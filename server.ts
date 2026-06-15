import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { adminAuth, adminDb as firestoreDb } from "./src/lib/firebase-admin.ts";

// Load environment variables
dotenv.config();

const app = express();

// Initialize server-side Firestore
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API Client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Gemini API Client initialized successfully.");
  } catch (err) {
    console.error("Error initializing Gemini API Client:", err);
  }
} else {
  console.log("No valid GEMINI_API_KEY. Server will run in template/sandbox mode.");
}

// In-memory store for radio episodes
interface Segment {
  speaker: string;
  text: string;
  voice: "Kore" | "Puck" | "Charon" | "Fenrir" | "Zephyr";
  role: "Anchor" | "Analyst" | "Reporter" | "Expert";
}

interface Episode {
  id: string;
  title: string;
  matchName: string;
  language: string;
  tone: string;
  segments: Segment[];
  durationSeconds: number;
}

const PRELOADED_EPISODES: Episode[] = [
  {
    id: "1",
    title: "Opening Ceremony Live from Los Angeles",
    matchName: "USA vs Canada (Group Stage)",
    language: "English",
    tone: "Dramatic",
    durationSeconds: 78,
    segments: [
      {
        speaker: "Anchor Mike",
        text: "The stage is finally set! The sun is shining high over Los Angeles and a record-breaking crowd has gathered. This is FIFA 2026, the biggest World Cup in history, and it starts today!",
        voice: "Zephyr",
        role: "Anchor"
      },
      {
        speaker: "Analyst Sofia",
        text: "Indeed Mike, the atmosphere is electric. Team USA is stepping onto the field under immense pressure, but this home crowd is ready to propel them. Meanwhile, Canada looks incredibly calm and organized under their new system.",
        voice: "Kore",
        role: "Analyst"
      },
      {
        speaker: "Reporter Thiago",
        text: "Mike, Sofia! I am down here by the corner flag, and let me tell you, you can feel the pitch vibrating. The national anthems have just concluded, and Christian Pulisic is leading the American delegation out. Football is home!",
        voice: "Puck",
        role: "Reporter"
      }
    ]
  },
  {
    id: "2",
    title: "Clash of Titans in New York",
    matchName: "Argentina vs England (Group Stage)",
    language: "English",
    tone: "Casual",
    durationSeconds: 85,
    segments: [
      {
        speaker: "Anchor Mike",
        text: "Welcome back to AI Radio FIFA 2026! We are broadcasting live from MetLife Stadium after a thrilling match. Argentina and England have left everything on the field.",
        voice: "Zephyr",
        role: "Anchor"
      },
      {
        speaker: "Analyst Sofia",
        text: "It was a tactical chess match. England's high-press frustrated Argentina's playmaker early on, but in the second half, the Argentine midfield found the space they needed. A true tactical masterclass on both sides.",
        voice: "Kore",
        role: "Analyst"
      },
      {
        speaker: "Reporter Thiago",
        text: "The stadium has barely cleared, but fans are still singing outside! Both coaches shared a very intense handshake. England believes they should have had a penalty, but the referee stood firm.",
        voice: "Puck",
        role: "Reporter"
      }
    ]
  }
];

let customEpisodesCount = 0;
const CUSTOM_EPISODES: Episode[] = [];

// Helper to extract verified userId if Bearer token present
const getAuthUserIdOptional = async (req: express.Request): Promise<string | null> => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split("Bearer ")[1];
    try {
      const decodedResult = await adminAuth.verifyIdToken(token);
      return decodedResult.uid;
    } catch (e: any) {
      console.warn("Soft auth verification failed on server:", e.message);
    }
  }
  return null;
};

// API: Get episodes
app.get("/api/episodes", (req, res) => {
  res.json([...PRELOADED_EPISODES, ...CUSTOM_EPISODES]);
});

// API: Generate dynamic episode script using Gemini
app.post("/api/generate-episode", async (req, res) => {
  const { matchName, language, tone, stats } = req.body;

  if (!matchName) {
    return res.status(400).json({ error: "matchName is required" });
  }

  const userId = await getAuthUserIdOptional(req);
  const selectedLanguage = language || "English";
  const selectedTone = tone || "Dramatic";
  const customStats = stats || "A heavy counter-attacking game with some heated bookings.";

  const prompt = `You are a professional sports radio producer for FIFA World Cup 2026.
Generate a high-fidelity sports radio script for a match recap/preview.
Match: "${matchName}"
Language: "${selectedLanguage}"
Tone: "${selectedTone}"
Context/Stats: "${customStats}"

Format the script as a dynamic broadcast conversation with exactly 3 speakers (in order):
1. 'Anchor Mike' (Voice: Zephyr, Role: Anchor) - Introduces the segment with energetic radio charisma.
2. 'Analyst Sofia' (Voice: Kore, Role: Analyst) - Delivers a deep tactical or analytical breakdown of key moments.
3. 'Reporter Thiago' (Voice: Puck, Role: Reporter) - Reports from the pitch-side inside the stadium with crowd energy.

Make each character's dialogue feel unique, expressive, and realistic. 
Important: The response MUST be generated entirely in the selected language (${selectedLanguage})! Even the speaker names and roles should match the output schema, but the written text must be fully translated.
Return the result strictly in JSON matching this schema:
{
  "title": "A short engaging radio headline",
  "matchName": "${matchName}",
  "segments": [
    {
      "speaker": "Anchor Mike",
      "text": "The spoken words here",
      "voice": "Zephyr",
      "role": "Anchor"
    },
    {
      "speaker": "Analyst Sofia",
      "text": "The spoken words here",
      "voice": "Kore",
      "role": "Analyst"
    },
    {
      "speaker": "Reporter Thiago",
      "text": "The spoken words here",
      "voice": "Puck",
      "role": "Reporter"
    }
  ]
}`;

  try {
    if (aiClient) {
      console.log(`Generating radio script for ${matchName} using gemini-3.5-flash...`);
      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              matchName: { type: Type.STRING },
              segments: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    speaker: { type: Type.STRING },
                    text: { type: Type.STRING },
                    voice: { type: Type.STRING },
                    role: { type: Type.STRING }
                  },
                  required: ["speaker", "text", "voice", "role"]
                }
              }
            },
            required: ["title", "matchName", "segments"]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty response from Gemini API");
      }

      const generatedData = JSON.parse(text);
      customEpisodesCount++;
      const episodeId = userId ? `db_custom_${Date.now()}` : `custom_${customEpisodesCount}`;
      const newEpisode: Episode = {
        id: episodeId,
        title: generatedData.title || `Radio recap of ${matchName}`,
        matchName: generatedData.matchName || matchName,
        language: selectedLanguage,
        tone: selectedTone,
        segments: generatedData.segments.map((seg: any) => ({
          ...seg,
          voice: seg.voice || "Zephyr"
        })),
        durationSeconds: Math.floor(
          generatedData.segments.reduce((acc: number, seg: any) => acc + (seg.text?.split(" ").length || 0) * 0.4, 0) + 15
        )
      };

      if (!userId) {
        CUSTOM_EPISODES.push(newEpisode);
      }
      return res.json(newEpisode);
    } else {
      // Sandbox fallback mode - Generate a convincing mockup structure
      console.log("Using server fallback for script generation (No API key)");
      const fallbackTitlesEnglish = [
        `Tactical Mastery in Houston - ${matchName}`,
        `Stadium Roars in Mexico City - ${matchName}`,
        `History Made in Vancouver - ${matchName}`
      ];
      const selectedIndex = Math.floor(Math.random() * fallbackTitlesEnglish.length);
      const randomTitle = fallbackTitlesEnglish[selectedIndex];

      // Translate or adjust based on language
      let segmentText1 = `This is Anchor Mike bringing you the latest updates live from the FIFA World Cup 2026. The atmosphere is heating up for ${matchName}! Excitement is reaching fever pitch as fans expect nothing short of a masterpiece.`;
      let segmentText2 = `Thank you, Mike. Tactically, both teams are setting up incredibly wide today. The high defensive lines could prove risky, and I expect several breakaways. This will be decided by midfield control.`;
      let segmentText3 = `Thiago here pitch-side! The stadium is completely painted in national colors. The noise is absolutely deafening. Pre-match warmups are just finishing, and we are minutes away from kickoff!`;

      if (selectedLanguage === "Spanish") {
        segmentText1 = `¡Aquí les habla el locutor Mike con lo último en directo de la Copa Mundial de la FIFA 2026! El ambiente se está calentando para ${matchName}. La emoción está al máximo y los aficionados esperan un gran espectáculo.`;
        segmentText2 = `Gracias, Mike. Tácticamente, ambos equipos se están plantando con mucha amplitud hoy. Las líneas defensivas altas podrían ser arriesgadas. ¡Esto se decidirá en el mediocampo!`;
        segmentText3 = `¡Thiago aquí a pie de campo! El estadio está cubierto de banderas y el ruido es absolutamente ensordecedor. ¡Estamos a pocos minutos del pitido inicial!`;
      } else if (selectedLanguage === "Portuguese") {
        segmentText1 = `Aqui é o âncora Mike trazendo as últimas notícias ao vivo da Copa do Mundo FIFA 2026. O clima esquenta para ${matchName}! A emoção está nas alturas com os torcedores ansiosos.`;
        segmentText2 = `Obrigado, Mike. Taticamente, ambas as equipes estão bem abertas hoje. As linhas defensivas altas podem ser um perigo real. A partida será decidida no meio de campo.`;
        segmentText3 = `Thiago aqui na beira do gramado! O estádio está totalmente lotado e o barulho é simplesmente ensurdecedor. Estamos a poucos minutos do pontapé inicial!`;
      } else if (selectedLanguage === "Hindi") {
        segmentText1 = `यहाँ मुख्य एंकर माइक आप सभी के लिए फीफा विश्व कप 2026 से सीधा प्रसारण कर रहे हैं। ${matchName} के लिए रोमांच अपनी चरम सीमा पर पहुँच चुका है!`;
        segmentText2 = `धन्यवाद, माइक। रणनीतिक तौर पर, दोनों टीमें आज बहुत आक्रामक रवैया अपना रही हैं। मिडफील्ड पर नियंत्रण ही इस मुकाबला का फैसला करेगा।`;
        segmentText3 = `मैं थियागो मैदान के बिल्कुल पास से रिपोर्ट कर रहा हूँ! पूरा स्टेडियम दर्शकों के शोर से गूंज उठा है। बस मैच शुरू होने ही वाला है!`;
      }

      customEpisodesCount++;
      const episodeId = userId ? `db_custom_${Date.now()}` : `custom_${customEpisodesCount}`;
      const newEpisode: Episode = {
        id: episodeId,
        title: randomTitle,
        matchName: matchName,
        language: selectedLanguage,
        tone: selectedTone,
        segments: [
          {
            speaker: selectedLanguage === "Spanish" ? "Locutor Mike" : (selectedLanguage === "Portuguese" ? "Âncora Mike" : "Anchor Mike"),
            text: segmentText1,
            voice: "Zephyr",
            role: "Anchor"
          },
          {
            speaker: selectedLanguage === "Spanish" ? "Analista Sofia" : (selectedLanguage === "Portuguese" ? "Analista Sofia" : "Analyst Sofia"),
            text: segmentText2,
            voice: "Kore",
            role: "Analyst"
          },
          {
            speaker: selectedLanguage === "Spanish" ? "Reportero Thiago" : (selectedLanguage === "Portuguese" ? "Repórter Thiago" : "Reporter Thiago"),
            text: segmentText3,
            voice: "Puck",
            role: "Reporter"
          }
        ],
        durationSeconds: 52
      };

      if (!userId) {
        CUSTOM_EPISODES.push(newEpisode);
      }
      return res.json(newEpisode);
    }
  } catch (error: any) {
    console.error("Failed to generate script:", error);
    res.status(500).json({ error: "Failed to generate radio script: " + error.message });
  }
});

// API: Synthesize TTS Audio using gemini-3.1-flash-tts-preview
app.post("/api/generate-speech", async (req, res) => {
  const { text, voice } = req.body;

  if (!text) {
    return res.status(400).json({ error: "text is required" });
  }

  const selectedVoice = voice || "Zephyr";

  try {
    if (aiClient) {
      console.log(`Synthesizing text with speed voice ${selectedVoice}...`);
      const response = await aiClient.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: text }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        return res.json({ audio: base64Audio });
      } else {
        throw new Error("No audio payload returned from Google TTS preview model");
      }
    } else {
      // If no client exists, tell the client to use browser fallback
      return res.json({ useBrowserSpeech: true, message: "No API Key configured. Emulating voice using local speech engine." });
    }
  } catch (error: any) {
    console.error("TTS synthesis error:", error);
    return res.json({ useBrowserSpeech: true, error: error.message });
  }
});

// Vite Setup for static file serving and reverse proxy
const setupServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite Middleware in Development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving build assets in Production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
};

setupServer().catch((err) => {
  console.error("Vite server failed to transition:", err);
});
