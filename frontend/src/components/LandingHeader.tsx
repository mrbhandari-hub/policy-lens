'use client';

import Link from 'next/link';

export function LandingHeader() {
    return (
        <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/50">
            <div className="container mx-auto px-4 py-4 max-w-7xl">
                <div className="flex items-center justify-between">
                    <Link href="/" className="text-xl font-bold text-white hover:text-purple-300 transition-colors">
                        PolicyLens <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">v2.0</span>
                    </Link>
                    <nav className="flex items-center gap-6">
                        <Link
                            href="/analyze"
                            className="text-slate-300 hover:text-white transition-colors text-sm font-medium"
                        >
                            Analyze
                        </Link>
                        <Link
                            href="/ad-scanner"
                            className="text-slate-300 hover:text-white transition-colors text-sm font-medium flex items-center gap-1"
                        >
                            <span>📢</span> Ad Scanner
                        </Link>
                        <Link
                            href="/analyze"
                            className="px-4 py-2 rounded-full bg-white text-slate-900 font-semibold text-sm hover:bg-slate-100 transition-all shadow-lg shadow-white/20"
                        >
                            Get Started
                        </Link>
                    </nav>
                </div>
            </div>
        </header>
    );
}

