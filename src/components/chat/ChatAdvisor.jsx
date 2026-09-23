import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, X, Key, Sparkles, RefreshCw, CheckCircle, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";
import { askGeminiAdvisor, getSavedApiKey, calculateTenorOptimization } from "../../utils/gemini";
import { idr } from "../../utils/format";
import { ApiKeyModal } from "./ApiKeyModal";

export function ChatAdvisor({ isOpen, onClose, state, result }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState(getSavedApiKey());
  const [latestOptimization, setLatestOptimization] = useState(null);
  const [appliedTenor, setAppliedTenor] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Initial welcome message or automatic initial analysis
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const opt = calculateTenorOptimization(state, result);
      setLatestOptimization(opt);
      setMessages([
        {
          id: 1,
          role: "assistant",
          text: `Halo! Saya adalah **AI Financial Advisor KPR Anda** 🏦✨\n\nSaya dapat menganalisis dan merekomendasikan **tenor pinjaman paling optimal** (10 thn, 15 thn, 20 thn, dll.) yang disesuaikan secara real-time dengan skema bunga dan profil utang Anda saat ini.\n\nKlik tombol di bawah atau ketik pertanyaan Anda!`,
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

      setLatestOptimization(response.optimization);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: response.text,
          optimization: response.optimization,
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

  const applyTenor = (tenor) => {
    state.setNewYears(tenor);
    setAppliedTenor(tenor);
    setTimeout(() => setAppliedTenor(null), 2500);
  };

  const quickPrompts = [
    "⚡ Analisis Tenor Optimal Sekarang",
    "⚖️ Bandingkan Tenor 10 vs 15 vs 20 Thn",
    "💡 Kapan Titik Impas (BEP) Tercapai?",
    "⚠️ Risiko Suku Bunga Floating di Tahun Depan"
  ];

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={onClose} />
      
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl transition-all duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-4 bg-slate-50/80 dark:bg-slate-850/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25">
              <Bot size={22} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">AI KPR Advisor</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                  <Sparkles size={10} />
                  {apiKey ? "Gemini 2.5 Flash" : "Smart Optimizer"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Rekomendasi Tenor & Refinance Real-Time</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
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
        <div className="border-b border-slate-100 dark:border-slate-800/80 bg-indigo-50/50 dark:bg-indigo-950/20 px-5 py-2.5 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
          <div className="truncate">
            <span className="font-semibold text-indigo-700 dark:text-indigo-300">KPR Baru:</span> {state.newYears} Thn · {idr.format(result.newPrincipal)} · {state.newScheme === "step" ? "Berjenjang" : state.newScheme === "fixedFloating" ? "Fixed-Floating" : "Full Fixed"}
          </div>
          {appliedTenor && (
            <span className="shrink-0 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-pulse">
              <CheckCircle size={13} />
              Tenor {appliedTenor} Thn Aktif!
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
                className={`max-w-[92%] sm:max-w-[88%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-sm ${
                  m.role === "user"
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-br-none"
                    : "bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200/60 dark:border-slate-700/60"
                }`}
              >
                {/* Formatted Markdown Rendering */}
                <div className="space-y-2 whitespace-pre-line">
                  {m.text}
                </div>

                {/* Tenor Quick Apply Card (if optimization exists) */}
                {m.optimization?.recommendations && (
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/80 space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      ⚡ 1-Klik Terapkan Tenor Pilihan:
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {/* Sweet Spot */}
                      <button
                        onClick={() => applyTenor(m.optimization.recommendations.sweetSpot.tenor)}
                        className="flex flex-col text-left p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 hover:border-indigo-400 transition-all text-indigo-900 dark:text-indigo-200"
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span>🌟 Seimbang</span>
                          <span className="px-1.5 py-0.5 rounded bg-indigo-200/60 dark:bg-indigo-800 text-[10px]">
                            {m.optimization.recommendations.sweetSpot.tenor} Thn
                          </span>
                        </div>
                        <div className="mt-1 text-[10px] text-slate-600 dark:text-slate-300">
                          {idr.format(m.optimization.recommendations.sweetSpot.firstPayment)}/bln
                        </div>
                      </button>

                      {/* Min Interest */}
                      <button
                        onClick={() => applyTenor(m.optimization.recommendations.minInterest.tenor)}
                        className="flex flex-col text-left p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 hover:border-emerald-400 transition-all text-emerald-900 dark:text-emerald-200"
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span>💰 Min Bunga</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-200/60 dark:bg-emerald-800 text-[10px]">
                            {m.optimization.recommendations.minInterest.tenor} Thn
                          </span>
                        </div>
                        <div className="mt-1 text-[10px] text-slate-600 dark:text-slate-300">
                          {idr.format(m.optimization.recommendations.minInterest.firstPayment)}/bln
                        </div>
                      </button>

                      {/* Light Cash Flow */}
                      <button
                        onClick={() => applyTenor(m.optimization.recommendations.lightCashFlow.tenor)}
                        className="flex flex-col text-left p-2.5 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50/70 dark:bg-violet-950/40 hover:border-violet-400 transition-all text-violet-900 dark:text-violet-200"
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span>🛡️ Cicilan Ramping</span>
                          <span className="px-1.5 py-0.5 rounded bg-violet-200/60 dark:bg-violet-800 text-[10px]">
                            {m.optimization.recommendations.lightCashFlow.tenor} Thn
                          </span>
                        </div>
                        <div className="mt-1 text-[10px] text-slate-600 dark:text-slate-300">
                          {idr.format(m.optimization.recommendations.lightCashFlow.firstPayment)}/bln
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs shadow-sm w-fit animate-pulse">
              <Bot size={16} className="text-indigo-600 animate-spin" />
              <span>AI sedang menganalisis profil pinjaman & menghitung tenor paling optimal...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200/80 dark:border-slate-800 overflow-x-auto flex gap-2 no-scrollbar">
          {quickPrompts.map((qp, idx) => (
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
              className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
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
