'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  InputModule, 
  SynthesisCard, 
  DisagreementMatrix, 
  JudgeDetailCards, 
  DebateCard, 
  CrossModelCard,
  ShareButton,
  VerdictSummary,
  // Advanced Deep Dive Cards
  CounterfactualCard,
  RedTeamCard,
  TemporalCard,
  AppealCard,
  SycophancyCard,
} from '@/components';
import { SampleCase } from '@/data/samples';
import { PolicyLensResponse, PolicyLensRequest } from '@/types';
import { supabase } from '@/lib/supabaseClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';


// Inner component that uses useSearchParams
function AnalyzeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [response, setResponse] = useState<PolicyLensResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Input State (Lifted from InputModule)
  const [contentText, setContentText] = useState('');
  const [contextHint, setContextHint] = useState('');
  const [imageBase64, setImageBase64] = useState<string | undefined>();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);

  // Export JSON functionality
  const exportJSON = () => {
    if (!response) return;
    const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `policylens-${response.request_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSampleSelect = (sample: SampleCase) => {
    setContentText(sample.content);
    setContextHint(sample.context || '');
    // If we had images in samples, we would set them here.
    // For now, reset images to focus on text samples unless sample has image
    setImageBase64(sample.imageBase64);
    setImagePreview(sample.imageBase64 ? `data:image/jpeg;base64,${sample.imageBase64}` : null);
  };

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

      // Auto-save the results to Supabase and update URL
      // Use imagePreview from state to preserve data URI format, or construct it if needed
      saveSharedQuery(data, request.content_text, imagePreview || undefined);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Save to Supabase and update URL
  const saveSharedQuery = async (data: PolicyLensResponse, text: string, img?: string) => {
    try {
      const { data: saved, error: saveError } = await supabase
        .from('shared_queries')
        .insert({
          query_text: text,
          image_url: img || null,
          verdicts: data, // Storing full response object
          metadata: { saved_at: new Date().toISOString() }
        })
        .select()
        .single();

      if (saveError) {
        console.error('Share save error:', saveError);
        return;
      }

      if (saved) {
        // Update URL without reloading - explicitly use /analyze path
        setShareId(saved.id);
        const newUrl = `/analyze?id=${saved.id}`;
        router.replace(newUrl, { scroll: false });
      }
    } catch (err) {
      console.error('Failed to save share:', err);
    }
  };

  // Load from Supabase if ID is present
  useEffect(() => {
    const id = searchParams.get('id');
    if (!id) return;

    const fetchShared = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('shared_queries')
          .select('*')
          .eq('id', id)
          .single();

        // Handle "not found" gracefully - just clear the invalid ID from URL
        if (error) {
          if (error.code === 'PGRST116') {
            // No rows found - invalid/expired share link
            console.warn('Shared query not found, clearing URL parameter');
            router.replace('/analyze', { scroll: false });
            return;
          }
          throw error;
        }

        if (data) {
          setContentText(data.query_text);
          setShareId(data.id);
          if (data.image_url) {
            setImagePreview(data.image_url);
            // Try to extract base64 if it is one
            if (data.image_url.startsWith('data:')) {
              setImageBase64(data.image_url.split(',')[1]);
            }
          }
          if (data.verdicts) {
            setResponse(data.verdicts as PolicyLensResponse);
          }
        }
      } catch (err) {
        // Only log actual errors, not "not found"
        console.error('Error loading shared query:', err);
        setError('Failed to load shared query. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchShared();
  }, [searchParams, router]);

  return (
    <main className="min-h-screen bg-[#0a0f1a]">
      {/* Sophisticated mesh gradient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 gradient-mesh" />
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-teal-500/[0.07] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-500/[0.05] rounded-full blur-[100px]" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-teal-400/[0.04] rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="text-center mb-8 flex items-center justify-between">
          <a href="/" className="text-2xl font-bold text-white hover:text-teal-300 transition-colors">
            PolicyLens <span className="bg-gradient-to-r from-teal-400 to-amber-400 bg-clip-text text-transparent">v2.0</span>
          </a>
          <a href="/" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </a>
        </header>

        {/* Input Module */}
        <InputModule
          onAnalyze={handleAnalyze}
          loading={loading}
          contentText={contentText}
          onContentTextChange={setContentText}
          contextHint={contextHint}
          onContextHintChange={setContextHint}
          imageBase64={imageBase64}
          onImageBase64Change={setImageBase64}
          imagePreview={imagePreview}
          onImagePreviewChange={setImagePreview}
          onSampleSelect={handleSampleSelect}
        />

        {/* Error Display */}
        {error && (
          <div className="bg-red-950/60 border border-red-500/40 rounded-xl p-4 mt-6 text-red-200 flex items-center gap-3 backdrop-blur-sm">
            <span className="text-2xl">⚠️</span>
            <div>
              <div className="font-medium text-red-100">Analysis Error</div>
              <div className="text-red-300/80 text-sm">{error}</div>
            </div>
          </div>
        )}

        {/* Results */}
        {response && (
          <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* At-a-Glance Verdict Summary */}
            <VerdictSummary verdicts={response.judge_verdicts} />

            {/* Synthesis Card */}
            <SynthesisCard synthesis={response.synthesis} />

            {/* Middle: Disagreement Matrix */}
            <DisagreementMatrix
              verdicts={response.judge_verdicts}
              distribution={response.synthesis.verdict_distribution}
            />

            {/* Bottom: Detailed Rationale */}
            <JudgeDetailCards verdicts={response.judge_verdicts} />

            {/* Deep Dives Section - includes Debate, Cross-Model, and all Advanced */}
            {(response.debate || response.cross_model || response.counterfactual || 
              response.red_team || response.temporal || response.appeal || response.sycophancy) && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#2d3a52] to-transparent" />
                  <h2 className="text-white text-lg font-semibold flex items-center gap-2">
                    <span>🔬</span> Deep Dives
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-[#2d3a52] via-[#2d3a52] to-transparent" />
                </div>

                <div className="grid gap-6">
                  {/* Debate & Cross-Model */}
                  {(response.debate || response.cross_model) && (
                    <div className="grid md:grid-cols-2 gap-6">
                      {response.debate && (
                        <DebateCard debate={response.debate} />
                      )}
                      {response.cross_model && (
                        <CrossModelCard crossModel={response.cross_model} />
                      )}
                    </div>
                  )}

                  {/* Boundary Analysis */}
                  {response.counterfactual && (
                    <CounterfactualCard data={response.counterfactual} />
                  )}

                  {/* Security Analysis */}
                  {response.red_team && (
                    <RedTeamCard data={response.red_team} />
                  )}

                  {/* Context & Appeals */}
                  {(response.temporal || response.appeal) && (
                    <div className="grid md:grid-cols-2 gap-6">
                      {response.temporal && (
                        <TemporalCard data={response.temporal} />
                      )}
                      {response.appeal && (
                        <AppealCard data={response.appeal} />
                      )}
                    </div>
                  )}

                  {/* Bias Detection */}
                  {response.sycophancy && (
                    <SycophancyCard data={response.sycophancy} />
                  )}
                </div>
              </div>
            )}

            {/* Results Footer with Export and Share */}
            <div className="flex items-center justify-between bg-[#0f1629]/80 border border-[#1e293d] rounded-xl p-4 backdrop-blur-sm">
              <div className="text-slate-500 text-sm">
                Request ID: <code className="bg-[#0a0f1a] px-2 py-1 rounded text-teal-400/70 font-mono text-xs">{response.request_id}</code>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={exportJSON}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1e293d]/60 text-slate-300 border border-[#2d3a52] hover:bg-[#2d3a52]/60 hover:text-white hover:border-teal-500/30 transition-all text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export JSON
                </button>
                {shareId && (
                  <ShareButton shareId={shareId} />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-16 py-8 border-t border-[#1e293d]">
          <p className="text-slate-500 text-sm">
            PolicyLens v2.0 — Powered by{' '}
            <span className="text-teal-400">Gemini 3 Pro Preview</span>
          </p>
          <p className="text-slate-600 text-xs mt-2">
            ⚠️ This is a diagnostic tool, not an enforcement tool. All verdicts are simulated.
          </p>
        </footer>
      </div>
    </main>
  );
}

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <main className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-12 w-12 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-slate-400">Loading Analysis Engine...</p>
      </div>
    </main>
  );
}

// Default export wrapped in Suspense for useSearchParams
export default function AnalyzePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AnalyzeContent />
    </Suspense>
  );
}

