'use client';

import { useState } from 'react';
import { AdEnrichment, DomainInfo, WebResearch } from '@/types/adScanner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface AdEnrichmentPanelProps {
    adId: string;
    advertiserName: string;
    adText: string;
    landingPageUrl?: string;
    scamTypes: string[];
}

const riskColors: Record<string, { bg: string; text: string; border: string; label: string }> = {
    likely_scam: { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/30', label: 'Likely Scam' },
    suspicious: { bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/30', label: 'Suspicious' },
    unclear: { bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/30', label: 'Unclear' },
    likely_legitimate: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30', label: 'Likely Legitimate' },
    unknown: { bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/30', label: 'Unknown' },
};

export function AdEnrichmentPanel({ 
    adId, 
    advertiserName, 
    adText, 
    landingPageUrl, 
    scamTypes 
}: AdEnrichmentPanelProps) {
    const [enrichment, setEnrichment] = useState<AdEnrichment | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    const fetchEnrichment = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`${API_URL}/enrich-ad`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ad_id: adId,
                    advertiser_name: advertiserName,
                    ad_text: adText,
                    landing_page_url: landingPageUrl,
                    scam_types: scamTypes
                })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch enrichment data');
            }

            const data = await response.json();
            setEnrichment(data);
            setIsExpanded(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    if (!enrichment && !loading) {
        return (
            <button
                onClick={fetchEnrichment}
                className="w-full mt-3 py-2.5 px-4 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/30 rounded-xl text-indigo-300 text-[13px] font-medium transition-all flex items-center justify-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Research This Advertiser</span>
            </button>
        );
    }

    if (loading) {
        return (
            <div className="mt-3 py-4 px-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                    <span className="text-indigo-300 text-[13px]">Researching advertiser...</span>
                </div>
                <p className="text-indigo-400/50 text-[11px] mt-2">
                    Searching the web for scam reports, company info, and domain data
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mt-3 py-3 px-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <div className="flex items-center justify-between">
                    <span className="text-red-300 text-[13px]">Research failed: {error}</span>
                    <button 
                        onClick={fetchEnrichment}
                        className="text-red-400 hover:text-red-300 text-[12px]"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!enrichment) return null;

    const risk = riskColors[enrichment.overall_risk_assessment] || riskColors.unknown;

    return (
        <div className={`mt-3 ${risk.bg} border ${risk.border} rounded-xl overflow-hidden`}>
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full py-3 px-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="text-white/80 text-[13px] font-medium">Web Research</span>
                    <span className={`${risk.bg} ${risk.text} text-[11px] px-2 py-0.5 rounded-full border ${risk.border}`}>
                        {risk.label}
                    </span>
                </div>
                <svg 
                    className={`w-4 h-4 text-white/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-4 pb-4 space-y-4">
                    {/* Domain Info */}
                    {enrichment.domain_info && !enrichment.domain_info.error && (
                        <div className="bg-black/20 rounded-lg p-3">
                            <h4 className="text-white/60 text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                </svg>
                                Domain Info
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-[12px]">
                                <div>
                                    <span className="text-white/40">Domain:</span>
                                    <span className="text-white/80 ml-1">{enrichment.domain_info.domain}</span>
                                </div>
                                {enrichment.domain_info.age_days !== undefined && (
                                    <div>
                                        <span className="text-white/40">Age:</span>
                                        <span className={`ml-1 ${enrichment.domain_info.is_newly_registered ? 'text-orange-400' : 'text-white/80'}`}>
                                            {enrichment.domain_info.age_days} days
                                            {enrichment.domain_info.is_newly_registered && ' ⚠️ New'}
                                        </span>
                                    </div>
                                )}
                                {enrichment.domain_info.registrar && (
                                    <div>
                                        <span className="text-white/40">Registrar:</span>
                                        <span className="text-white/80 ml-1">{enrichment.domain_info.registrar}</span>
                                    </div>
                                )}
                                {enrichment.domain_info.country && (
                                    <div>
                                        <span className="text-white/40">Country:</span>
                                        <span className="text-white/80 ml-1">{enrichment.domain_info.country}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Red Flags */}
                    {enrichment.web_research?.red_flags && enrichment.web_research.red_flags.length > 0 && (
                        <div>
                            <h4 className="text-red-400 text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <span>🚩</span> Red Flags ({enrichment.web_research.red_flags.length})
                            </h4>
                            <ul className="space-y-1.5">
                                {enrichment.web_research.red_flags.map((flag, i) => (
                                    <li key={i} className="text-red-200/80 text-[12px] flex items-start gap-2">
                                        <span className="text-red-400 mt-0.5">•</span>
                                        <span>{flag}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Green Flags */}
                    {enrichment.web_research?.green_flags && enrichment.web_research.green_flags.length > 0 && (
                        <div>
                            <h4 className="text-emerald-400 text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <span>✓</span> Green Flags ({enrichment.web_research.green_flags.length})
                            </h4>
                            <ul className="space-y-1.5">
                                {enrichment.web_research.green_flags.map((flag, i) => (
                                    <li key={i} className="text-emerald-200/80 text-[12px] flex items-start gap-2">
                                        <span className="text-emerald-400 mt-0.5">+</span>
                                        <span>{flag}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Full Assessment */}
                    {enrichment.web_research?.legitimacy_assessment && (
                        <div>
                            <h4 className="text-white/60 text-[11px] uppercase tracking-wider mb-2">
                                Research Summary
                            </h4>
                            <p className="text-white/70 text-[12px] leading-relaxed whitespace-pre-wrap">
                                {enrichment.web_research.legitimacy_assessment}
                            </p>
                        </div>
                    )}

                    {/* Sources */}
                    {enrichment.web_research?.sources && enrichment.web_research.sources.length > 0 && (
                        <div>
                            <h4 className="text-white/60 text-[11px] uppercase tracking-wider mb-2">
                                Sources
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {enrichment.web_research.sources.map((source, i) => (
                                    <a
                                        key={i}
                                        href={source}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-indigo-400 hover:text-indigo-300 text-[11px] truncate max-w-[200px] hover:underline"
                                    >
                                        {new URL(source).hostname}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Confidence & Timestamp */}
                    <div className="flex items-center justify-between text-[10px] text-white/30 pt-2 border-t border-white/10">
                        <span>
                            Confidence: {enrichment.web_research?.confidence || 'unknown'}
                        </span>
                        <span>
                            Researched: {new Date(enrichment.enriched_at).toLocaleString()}
                        </span>
                    </div>

                    {/* Error/Warning */}
                    {enrichment.web_research?.error && (
                        <div className="text-amber-400/70 text-[11px] bg-amber-500/10 rounded-lg px-3 py-2">
                            ℹ️ {enrichment.web_research.error}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

