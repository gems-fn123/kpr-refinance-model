import { describeScheme, SCHEME_LABELS } from "./mortgage.js";
import { idr } from "./format.js";
import { analyzeRefinance } from "./advisor/analysis.js";
import { buildAdvisorContext, buildLocalReport } from "./advisor/report.js";
import { ADVISOR_SKILL } from "./advisor/skill.js";

const STORAGE_KEY = "gemini_api_key";
const HISTORY_MESSAGES = 6;
const HISTORY_CHARS = 4000;

export function getSavedApiKey() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEY) || import.meta.env.VITE_GEMINI_API_KEY || "";
}

export function saveApiKey(key) {
  if (typeof window === "undefined") return;
  if (!key) {
    localStorage.setItem(STORAGE_KEY, "");
  } else {
    localStorage.setItem(STORAGE_KEY, key.trim());
  }
}

/** The new-loan setup currently entered in the calculator, so follow-up questions about it can be answered. */
function currentConfigText(state, result) {
  return [
    `Skema: ${SCHEME_LABELS[state.newScheme] || state.newScheme} (${describeScheme(state.newScheme, state.newCfg, state.newYears)})`,
    `Tenor ${state.newYears} th · pokok baru ${idr.format(result.newPrincipal)} · cicilan awal ${idr.format(result.firstNew)}`,
    `NPV ${idr.format(result.npv)} · hemat total ${idr.format(result.saving)} · BEP pertama ${result.breakEven ? `${result.breakEven} bln` : "tidak tercapai"} · ${result.eligible ? "lolos LTV" : "melebihi LTV"}`
  ].join("\n");
}

/** Runs the refinance analysis and builds the data block the advisor skill reasons over. */
export function buildAdvisor(state, result, today = new Date()) {
  const analysis = analyzeRefinance({ state, result, today });
  return {
    analysis,
    localReport: buildLocalReport(analysis),
    context: buildAdvisorContext(analysis, { currentConfig: currentConfigText(state, result) })
  };
}

/** Recent chat turns as Gemini contents; Gemini expects the conversation to open with a user turn. */
function historyContents(messages) {
  const turns = messages
    .filter(m => !m.isInitial && !m.isError && m.text)
    .slice(-HISTORY_MESSAGES)
    .map(m => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.text.slice(0, HISTORY_CHARS) }] }));
  while (turns.length && turns[0].role !== "user") turns.shift();
  return turns;
}

/**
 * Calls Google Gemini with the advisor skill as system instruction and the computed analysis as data.
 * Without a key (or when every model fails) the same analysis is returned as the offline report.
 */
export async function askGeminiAdvisor({ apiKey, prompt, messages = [], state, result }) {
  const { analysis, localReport, context } = buildAdvisor(state, result);
  const activeKey = apiKey || getSavedApiKey();

  if (!activeKey || !analysis) {
    return { text: localReport, analysis, isLocal: true };
  }

  const modelsToTry = [
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
    "gemini-3.6-flash",
    "gemini-2.5-flash-lite"
  ];

  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: `${ADVISOR_SKILL}\n\n# DATA\n${context}` }] },
    contents: [...historyContents(messages), { role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8192
    }
  });

  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": activeKey
        },
        body
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const code = errorData.error?.code || response.status;
        const msg = errorData.error?.message || `HTTP ${response.status}`;

        if (code === 402 || msg.includes("prepayment") || msg.includes("credits are depleted")) {
          throw new Error("PREPAYMENT_DEPLETED");
        }
        throw new Error(`Model ${model}: ${msg}`);
      }

      const data = await response.json();
      const answer = (data.candidates?.[0]?.content?.parts || [])
        .map(part => part.text || "")
        .join("")
        .trim();
      if (answer) {
        return {
          text: answer,
          analysis,
          isLocal: false
        };
      }
      throw new Error(`Model ${model}: jawaban kosong (${data.candidates?.[0]?.finishReason || "tanpa kandidat"})`);
    } catch (err) {
      lastError = err;
      if (err.message === "PREPAYMENT_DEPLETED") {
        break; // don't retry other models on billing depleted
      }
      console.warn(`Attempt with ${model} failed, trying next fallback...`, err);
    }
  }

  // Handle prepayment credits depleted
  if (lastError?.message === "PREPAYMENT_DEPLETED") {
    return {
      text: `${localReport}\n\n⚠️ **Catatan Kuota GCP / API Key:**\nAPI Key yang digunakan terhubung ke project Google Cloud bertipe *Prepayment Billing* yang saldonya sedang kosong (Error 402).\n\n💡 **Tips Kuota 100% Gratis (Tanpa Bayar):**\nBuka [Google AI Studio (aistudio.google.com/app/apikey)](https://aistudio.google.com/app/apikey), lalu klik **"Create API key in new project"** (project baru tanpa penagihan/billing). Key tersebut akan mendapatkan kuota Free Tier resmi tanpa bayar sama sekali!`,
      analysis,
      isLocal: true
    };
  }

  return {
    text: `${localReport}\n\n*(Catatan: Panggilan ke Gemini API mengalami kendala: ${lastError?.message || "Koneksi terputus"}. Analisis di atas dihasilkan oleh mesin analisis lokal dengan metodologi yang sama.)*`,
    analysis,
    isLocal: true
  };
}
