import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Search, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Newspaper,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- CLOUD-READY URL LOGIC ---
const BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:3000";
const API_URL = `${BASE_URL}/api/verify`;

export default function HomePage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!text.trim() || text.length < 5) {
      setError("Please enter some text to analyze.");
      return;
    }
    
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });

      if (!response.ok) throw new Error("Server error");
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError("Backend unreachable. Please check if the Render server and Ngrok tunnel are active.");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (score >= 50) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-rose-600 bg-rose-50 border-rose-200";
  };

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="text-center space-y-4 animate-fade-in">
        <h1 className="text-4xl font-extrabold text-slate-900">
          Verify Crisis News <span className="text-blue-600">Instantly</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-xl mx-auto">
          AI-powered truth analysis. We check sources, scientific plausibility, and logical consistency.
        </p>
      </div>

      {/* Input Card */}
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200 border border-slate-100 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
        
        <div className="p-6 md:p-8 space-y-6">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-40 p-5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
            placeholder="Paste news text, claims, or WhatsApp forwards here..."
          ></textarea>

          {error && (
            <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-4 py-3 rounded-lg text-sm font-medium">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full py-4 rounded-xl bg-slate-900 text-white font-semibold text-lg hover:bg-slate-800 disabled:opacity-70 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Analyze Credibility"}
          </button>
        </div>
      </div>

      {/* Results Section */}
      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
          >
            <div className={`px-6 py-5 border-b flex justify-between items-center ${getScoreColor(result.score)}`}>
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white/50 rounded-full">
                  {result.score >= 80 ? <CheckCircle2 className="w-6 h-6" /> : 
                   result.score >= 50 ? <Activity className="w-6 h-6" /> : 
                   <XCircle className="w-6 h-6" />}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase opacity-70">Verdict</p>
                  <h3 className="text-2xl font-bold">{result.verdict}</h3>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase opacity-70">Credibility</p>
                <div className="text-4xl font-black">{result.score}/100</div>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold uppercase text-slate-400 flex items-center gap-2">
                  <Search className="w-4 h-4" /> AI Assessment
                </h4>
                <p className="text-lg text-slate-700 font-medium leading-relaxed">
                  {result.reason}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 w-full">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Sources Analyzed</p>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Newspaper className="w-4 h-4" />
                    {result.metadata?.sources_found || 0} Found
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}