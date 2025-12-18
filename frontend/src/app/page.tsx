'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LandingHero, LandingFeatures, LandingHeader, LandingUseCases } from '@/components';

function LandingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Redirect legacy links (/?id=...) to /analyze?id=...
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      router.replace(`/analyze?id=${id}`);
    }
  }, [searchParams, router]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl" />
      </div>

      <LandingHeader />
      <LandingHero />
      <LandingFeatures />
      <LandingUseCases />

      <footer className="text-center py-8 border-t border-slate-800/50 relative z-10">
        <div className="container mx-auto px-4 max-w-6xl">
          <p className="text-slate-500 text-sm mb-4">
            PolicyLens v2.0 — Powered by{' '}
            <span className="text-purple-400">Gemini 2.5 Flash</span>
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-slate-600">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 transition-colors">
              GitHub
            </a>
            <span>•</span>
            <a href="/analyze" className="hover:text-slate-400 transition-colors">
              Documentation
            </a>
            <span>•</span>
            <a href="mailto:contact@policylens.xyz" className="hover:text-slate-400 transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

// Loading fallback
function LoadingFallback() {
  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
    </main>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LandingContent />
    </Suspense>
  );
}
