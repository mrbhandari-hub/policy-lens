'use client';

import { useState } from 'react';
import { InputModule, SynthesisCard, DisagreementMatrix, JudgeDetailCards } from '@/components';
import { PolicyLensResponse, PolicyLensRequest } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function PolicyLensPage() {
  const [response, setResponse] = useState<PolicyLensResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (request: PolicyLensRequest) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Analysis failed');
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-600/20 border border-purple-500/30 rounded-full px-4 py-1 mb-4">
            <span className="text-purple-400 text-sm font-medium">Trust & Safety Tool</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-3">
            PolicyLens <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">v2.0</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Multi-Perspective Content Analysis Engine — See where policies diverge and understand why.
          </p>
        </header>

        {/* Input Module */}
        <InputModule onAnalyze={handleAnalyze} loading={loading} />

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/40 border border-red-500/50 rounded-xl p-4 mt-6 text-red-200 flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <div className="font-medium">Analysis Error</div>
              <div className="text-red-300/80 text-sm">{error}</div>
            </div>
          </div>
        )}

        {/* Results */}
        {response && (
          <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top: Synthesis Card */}
            <SynthesisCard synthesis={response.synthesis} />

            {/* Middle: Disagreement Matrix */}
            <DisagreementMatrix
              verdicts={response.judge_verdicts}
              distribution={response.synthesis.verdict_distribution}
            />

            {/* Bottom: Detailed Rationale */}
            <JudgeDetailCards verdicts={response.judge_verdicts} />

            {/* Request metadata */}
            <div className="text-center text-slate-500 text-sm py-4">
              Request ID: <code className="bg-slate-800 px-2 py-1 rounded">{response.request_id}</code>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-16 py-8 border-t border-slate-800">
          <p className="text-slate-500 text-sm">
            PolicyLens v2.0 — Powered by{' '}
            <span className="text-purple-400">Gemini 3 Pro Preview</span>
          </p>
          <p className="text-slate-600 text-xs mt-2">
            ⚠️ This is a diagnostic tool, not an enforcement tool. All verdicts are simulated.
          </p>
        </footer>
      </div>
    </main>
  );
}
