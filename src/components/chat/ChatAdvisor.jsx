import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, X, Key, Sparkles, CheckCircle } from "lucide-react";
import { askGeminiAdvisor, buildAdvisor, getSavedApiKey } from "../../utils/gemini";
import { idr } from "../../utils/format";
import { SCHEME_LABELS } from "../../utils/mortgage";
import { CASES } from "../../utils/advisor/analysis";
import { QUICK_PROMPTS } from "../../utils/advisor/skill";
import { bankPresets } from "../../constants/bankPresets";
import { ApiKeyModal } from "./ApiKeyModal";
import { MarkdownMessage } from "./MarkdownMessage";

const PICK_STYLES = {
  cepat: "border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/40 hover:border-amber-400 text-amber-900 dark:text-amber-200",
  optimal: "border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 hover:border-indigo-400 text-indigo-900 dark:text-indigo-200",
  ringan: "border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 hover:border-emerald-400 text-emerald-900 dark:text-emerald-200"
};

const tenorLabel = (months) => `${+(months / 12).toFixed(2)} th`;

/** One-click buttons that load the best bank + tenor of each strategy into the calculator. */
function PlanPicks({ picks, onApply }) {
  if (!picks) return null;
  return (
    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/80 space-y-2">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Terapkan rencana ke kalkulator:
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {Object.entries(CASES).map(([key, meta]) => {
          const pick = picks[key];
          const preset = pick && bankPresets.find(p => p.id === pick.presetId);
          return (
            <button
              key={key}
              type="button"
              disabled={!preset}
              onClick={() => onApply(pick, preset, meta)}
              className={`flex min-w-0 flex-col text-left p-2.5 rounded-xl border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${PICK_STYLES[key]}`}
            >
              <div className="flex items-center justify-between gap-1 text-[11px] font-bold">
                <span>{meta.icon} {meta.label}</span>
                {pick && <span className="shrink-0 px-1.5 py-0.5 rounded bg-white/60 dark:bg-black/20 text-[10px]">{tenorLabel(pick.tenorMonths)}</span>}
              </div>
              <div className="mt-1 truncate text-[10px] text-slate-600 dark:text-slate-300">
                {preset ? preset.bank : "Tidak ada opsi"}
              </div>
              {pick && (
                <div className="text-[10px] text-slate-600 dark:text-slate-300">
                  {idr.format(pick.first)}/bln · NPV {idr.format(pick.npv)}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ChatAdvisor({ isOpen, onClose, state, result }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState(getSavedApiKey());
  const [applied, setApplied] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Welcome message with the headline verdict for the current inputs
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const { analysis } = buildAdvisor(state, result);
      const headline = analysis
        ? `**Ringkasan cepat:** ${analysis.verdict.title}.`
        : "Lengkapi data KPR lama (sisa pokok & sisa tenor) agar saya bisa membandingkan.";
      setMessages([
        {
          id: 1,
          role: "assistant",
          text: `Halo! Saya **AI KPR Advisor** 🏦\n\nSaya membandingkan KPR Anda dengan **${bankPresets.length} produk bank** dalam 3 strategi: ⚡ **Cepat** (tenor minimum), 🎯 **Optimal** (NPV tertinggi dalam batas cicilan), dan 🛡️ **Ringan** (tenor maksimum), lengkap dengan skema bunga, tenor, waktu pindah terbaik, dan risikonya.\n\n${headline}\n\nPilih pertanyaan di bawah atau ketik sendiri.`,
          analysis,
          isInitial: true
        }
      ]);
    }
  }, [isOpen]);

  const handleSend = async (userPrompt) => {
    const promptText = userPrompt || input.trim();
    if (!promptText || loading) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      text: promptText
    };

    setMessages(prev => [...prev, userMessage]);
    if (!userPrompt) setInput("");
    setLoading(true);

    try {
      const response = await askGeminiAdvisor({
        apiKey,
        prompt: promptText,
        messages,
        state,
        result
      });

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: response.text,
          analysis: response.analysis,
          isLocal: response.isLocal
        }
      ]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: `Maaf, terjadi kesalahan saat memproses permintaan: ${err.message}. Silakan coba lagi.`,
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const applyPlan = (pick, preset, meta) => {
    state.applyNewPreset(preset.id, pick.tenorMonths / 12);
    setApplied(`${meta.label}: ${preset.bank} ${tenorLabel(pick.tenorMonths)}`);
    setTimeout(() => setApplied(null), 3000);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={onClose} />
      
      <div className="fixed inset-y-0 right-0 z-50 flex h-[100dvh] w-full max-w-lg flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl transition-all duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-5 py-3 sm:py-4 bg-slate-50/80 dark:bg-slate-850/80 backdrop-blur-sm">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25">
              <Bot size={22} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white">AI KPR Advisor</h2>
                <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                  <Sparkles size={10} />
                  {apiKey ? "Gemini Flash" : "Analisis Lokal"}
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400">Bandingkan semua bank: Cepat · Optimal · Ringan</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() => setApiKeyModalOpen(true)}
              title={apiKey ? "API Key Terpasang" : "Pasang API Key Gemini (Gratis)"}
              className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors ${
                apiKey 
                  ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40" 
                  : "text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
              }`}
            >
              <Key size={16} />
              <span className="text-[11px] hidden sm:inline">{apiKey ? "API Key" : "Free API Key"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Loan Context Pill Bar */}
        <div className="border-b border-slate-100 dark:border-slate-800/80 bg-indigo-50/50 dark:bg-indigo-950/20 px-4 sm:px-5 py-2.5 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
          <div className="min-w-0 truncate">
            <span className="font-semibold text-indigo-700 dark:text-indigo-300">KPR Baru:</span> {state.newYears} Thn · {idr.format(result.newPrincipal)} · {SCHEME_LABELS[state.newScheme] || state.newScheme}
          </div>
          {applied && (
            <span className="shrink-0 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-pulse">
              <CheckCircle size={13} />
              {applied} diterapkan
            </span>
          )}
        </div>

        {/* Message Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`min-w-0 max-w-[94%] sm:max-w-[90%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed shadow-sm ${
                  m.role === "user"
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-br-none whitespace-pre-line"
                    : "bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200/60 dark:border-slate-700/60"
                }`}
              >
                {m.role === "user" ? m.text : <MarkdownMessage text={m.text} />}

                {m.role !== "user" && m.analysis && <PlanPicks picks={m.analysis.picks} onApply={applyPlan} />}
                {m.isLocal && !m.isInitial && (
                  <div className="mt-3 text-[10px] text-slate-500 dark:text-slate-400">
                    Dihasilkan mesin analisis lokal. Pasang API key Gemini gratis untuk tanya-jawab bebas.
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs shadow-sm w-fit animate-pulse">
              <Bot size={16} className="text-indigo-600 animate-spin" />
              <span>Menganalisis {bankPresets.length} produk bank, timing & risiko...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200/80 dark:border-slate-800 overflow-x-auto flex gap-2 no-scrollbar">
          {QUICK_PROMPTS.map((qp, idx) => (
            <button
              key={idx}
              disabled={loading}
              onClick={() => handleSend(qp)}
              className="shrink-0 text-[11px] px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-2xs font-medium"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanya saran tenor (misal: 'Berapa tenor paling aman?')..."
              className="min-w-0 flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-base sm:text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send size={16} />
            </button>
          </form>

          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 px-1">
            <span>Quota GCP / Gen-AI: Gratis di Google AI Studio</span>
            <button
              onClick={() => setApiKeyModalOpen(true)}
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {apiKey ? "Ubah API Key" : "+ Pasang Key Gratis"}
            </button>
          </div>
        </div>

      </div>

      <ApiKeyModal
        isOpen={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
        onKeySaved={(newKey) => setApiKey(newKey)}
      />
    </>
  );
}
