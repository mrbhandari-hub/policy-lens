'use client';

import { useState } from 'react';
import { AdAnalysis, ScamFingerprint, PolicyViolation } from '@/types/adScanner';
import { ImageLightbox } from './ImageLightbox';
import { AdEnrichmentPanel } from './AdEnrichmentPanel';

interface AdCardProps {
    analysis: AdAnalysis;
    compact?: boolean;
}

const categoryConfig = {
    violating: {
        bgColor: 'bg-rose-950/40',
        borderColor: 'border-rose-500/40',
        badgeColor: 'bg-rose-600',
        emoji: '🚫',
        label: 'Violating'
    },
    mixed: {
        bgColor: 'bg-amber-950/40',
        borderColor: 'border-amber-500/40',
        badgeColor: 'bg-amber-600',
        emoji: '⚠️',
        label: 'Mixed'
    },
    benign: {
        bgColor: 'bg-emerald-950/40',
        borderColor: 'border-emerald-500/40',
        badgeColor: 'bg-emerald-600',
        emoji: '✅',
        label: 'Benign'
    }
};

const verdictColors: Record<string, string> = {
    REMOVE: 'bg-rose-500',
    AGE_GATE: 'bg-orange-500',
    REDUCE_REACH: 'bg-amber-500',
    LABEL: 'bg-sky-500',
    ALLOW: 'bg-emerald-500'
};

const scamTypeLabels: Record<string, { label: string; emoji: string; color: string }> = {
    crypto_scam: { label: 'Crypto Scam', emoji: '🪙', color: 'bg-orange-500' },
    fake_celebrity: { label: 'Fake Celebrity', emoji: '🎭', color: 'bg-purple-500' },
    phishing: { label: 'Phishing', emoji: '🎣', color: 'bg-red-600' },
    mlm_scheme: { label: 'MLM Scheme', emoji: '📊', color: 'bg-pink-500' },
    fake_weight_loss: { label: 'Fake Weight Loss', emoji: '⚖️', color: 'bg-lime-500' },
    romance_scam: { label: 'Romance Scam', emoji: '💔', color: 'bg-rose-400' },
    fake_job: { label: 'Fake Job', emoji: '💼', color: 'bg-blue-500' },
    urgency_scam: { label: 'Urgency Tactics', emoji: '⏰', color: 'bg-amber-500' },
    fake_giveaway: { label: 'Fake Giveaway', emoji: '🎁', color: 'bg-cyan-500' },
    health_miracle: { label: 'Health Miracle', emoji: '💊', color: 'bg-green-600' },
    get_rich_quick: { label: 'Get Rich Quick', emoji: '💰', color: 'bg-yellow-500' },
    none: { label: 'None Detected', emoji: '✓', color: 'bg-slate-500' }
};

const severityColors: Record<string, string> = {
    critical: 'bg-red-600 text-white',
    high: 'bg-orange-500 text-white',
    medium: 'bg-amber-500 text-black',
    low: 'bg-slate-500 text-white'
};

function CopyButton({ text, label }: { text: string; label: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="text-xs bg-slate-700/60 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded flex items-center gap-1 transition-colors"
        >
            {copied ? (
                <>
                    <span>✓</span>
                    <span>Copied!</span>
                </>
            ) : (
                <>
                    <span>📋</span>
                    <span>{label}</span>
                </>
            )}
        </button>
    );
}

function HarmScoreBadge({ score }: { score: number }) {
    const getColor = () => {
        if (score >= 80) return 'bg-red-600';
        if (score >= 60) return 'bg-orange-500';
        if (score >= 40) return 'bg-amber-500';
        if (score >= 20) return 'bg-yellow-500';
        return 'bg-emerald-500';
    };

    return (
        <div className={`${getColor()} text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1`}>
            <span>⚡</span>
            <span>{score}</span>
        </div>
    );
}

export function AdCard({ analysis, compact = false }: AdCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const config = categoryConfig[analysis.category];

    const hasScamFingerprints = analysis.scam_fingerprints && analysis.scam_fingerprints.length > 0;
    const hasPolicyViolations = analysis.policy_violations && analysis.policy_violations.length > 0;

    // Compact mode: Show minimal info for batch results
    if (compact) {
        return (
            <div className={`${config.bgColor} border ${config.borderColor} rounded-xl p-3 transition-all duration-200`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {analysis.ad.advertiser_name.charAt(0)}
                        </div>
                        <span className="text-white font-medium text-xs truncate">
                            {analysis.ad.advertiser_name}
                        </span>
                    </div>
                    {analysis.harm_score && (
                        <HarmScoreBadge score={analysis.harm_score} />
                    )}
                </div>
                
                {/* Scam type tags */}
                {hasScamFingerprints && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {analysis.scam_fingerprints!.slice(0, 2).map((fp, i) => {
                            const scamInfo = scamTypeLabels[fp.type] || scamTypeLabels.none;
                            return (
                                <span
                                    key={i}
                                    className={`${scamInfo.color} text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5`}
                                >
                                    <span>{scamInfo.emoji}</span>
                                    <span>{scamInfo.label}</span>
                                </span>
                            );
                        })}
                    </div>
                )}

                <p className="text-slate-300 text-xs line-clamp-2 mb-2">
                    {analysis.ad.text}
                </p>

                <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[10px]">
                        {analysis.consensus_badge}
                    </span>
                    {analysis.ad.ad_library_url && (
                        <a
                            href={analysis.ad.ad_library_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-[10px] flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                        >
                            View
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`${config.bgColor} border ${config.borderColor} rounded-xl overflow-hidden transition-all duration-200`}>
            {/* Card Header - Always visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 text-left hover:bg-white/5 transition-colors"
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        {/* Advertiser */}
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                                {analysis.ad.advertiser_name.charAt(0)}
                            </div>
                            <div>
                                <div className="text-white font-medium text-sm truncate max-w-[200px]">
                                    {analysis.ad.advertiser_name}
                                </div>
                                {analysis.ad.start_date && (
                                    <div className="text-slate-500 text-xs">
                                        {analysis.ad.start_date}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Scam Fingerprints Tags - NEW */}
                        {hasScamFingerprints && (
                            <div className="flex flex-wrap gap-1 mb-2">
                                {analysis.scam_fingerprints!.slice(0, 3).map((fp, i) => {
                                    const scamInfo = scamTypeLabels[fp.type] || scamTypeLabels.none;
                                    return (
                                        <span
                                            key={i}
                                            className={`${scamInfo.color} text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1`}
                                        >
                                            <span>{scamInfo.emoji}</span>
                                            <span>{scamInfo.label}</span>
                                        </span>
                                    );
                                })}
                            </div>
                        )}

                        {/* Ad Image - Click to enlarge */}
                        {analysis.ad.image_url && (
                            <div className="mb-3 rounded-lg overflow-hidden border border-[#2d3a52]/50 bg-black/20">
                                <ImageLightbox
                                    src={analysis.ad.image_url}
                                    alt={`Ad by ${analysis.ad.advertiser_name}`}
                                />
                            </div>
                        )}

                        {/* Ad Text Preview */}
                        <p className="text-slate-300 text-sm line-clamp-3">
                            {analysis.ad.text}
                        </p>
                    </div>

                    {/* Right side - badges */}
                    <div className="flex flex-col items-end gap-2">
                        <span className={`${config.badgeColor} text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1`}>
                            {config.emoji} {config.label}
                        </span>
                        {analysis.harm_score && (
                            <HarmScoreBadge score={analysis.harm_score} />
                        )}
                        <span className="text-slate-500 text-xs bg-[#1e293d]/60 px-2 py-0.5 rounded">
                            {analysis.consensus_badge}
                        </span>
                        <span className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                            ▼
                        </span>
                    </div>
                </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="p-4 pt-0 border-t border-[#2d3a52]/50 space-y-4">
                    {/* Action Buttons - NEW */}
                    <div className="flex flex-wrap gap-2 pt-3">
                        {analysis.ad.ad_library_url && (
                            <a
                                href={analysis.ad.ad_library_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
                            >
                                <span>🔗</span>
                                <span>View on Meta</span>
                            </a>
                        )}
                        {analysis.ad.landing_page_url && (
                            <a
                                href={analysis.ad.landing_page_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
                            >
                                <span>🌐</span>
                                <span>Visit Landing Page</span>
                            </a>
                        )}
                        <CopyButton text={analysis.ad.text} label="Copy Ad Text" />
                        <CopyButton
                            text={`Ad ID: ${analysis.ad.ad_id}\nAdvertiser: ${analysis.ad.advertiser_name}\nCategory: ${analysis.category}\nHarm Score: ${analysis.harm_score || 'N/A'}\n\nAd Text:\n${analysis.ad.text}\n\nAnalysis: ${analysis.crux_narrative}`}
                            label="Copy Evidence"
                        />
                    </div>

                    {/* Landing Page Context - NEW: Shows crawl worked */}
                    {(analysis.ad.landing_page_url || analysis.ad.landing_page_content || analysis.ad.landing_page_crawl_error) && (
                        <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-lg p-4">
                            <h4 className="text-indigo-400 text-xs uppercase tracking-wider mb-3 font-semibold flex items-center gap-2">
                                <span>🌐</span>
                                <span>Landing Page Analysis</span>
                                {analysis.ad.landing_page_content ? (
                                    <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                        <span>✓</span> Crawled
                                    </span>
                                ) : analysis.ad.landing_page_crawl_error ? (
                                    <span className="bg-amber-600 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                        <span>⚠</span> Failed
                                    </span>
                                ) : (
                                    <span className="bg-slate-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                        No URL
                                    </span>
                                )}
                            </h4>

                            {/* Landing Page URL */}
                            {analysis.ad.landing_page_url && (
                                <div className="mb-3">
                                    <div className="text-slate-500 text-xs mb-1">Destination URL:</div>
                                    <a
                                        href={analysis.ad.landing_page_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-indigo-300 text-sm font-mono break-all hover:text-indigo-200 transition-colors"
                                    >
                                        {analysis.ad.landing_page_url}
                                    </a>
                                </div>
                            )}

                            {/* Crawl Error */}
                            {analysis.ad.landing_page_crawl_error && (
                                <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg p-2 mb-3">
                                    <div className="text-amber-400 text-xs flex items-center gap-1">
                                        <span>⚠️</span>
                                        <span>Crawl Error: {analysis.ad.landing_page_crawl_error}</span>
                                    </div>
                                </div>
                            )}

                            {/* Crawled Content Preview */}
                            {analysis.ad.landing_page_content && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-slate-500 text-xs">
                                            Crawled Content ({analysis.ad.landing_page_content.length.toLocaleString()} chars):
                                        </div>
                                        <CopyButton text={analysis.ad.landing_page_content} label="Copy" />
                                    </div>
                                    <div className="bg-[#0a0f1a]/60 rounded-lg p-3 max-h-48 overflow-y-auto">
                                        <pre className="text-slate-300 text-xs whitespace-pre-wrap font-mono">
                                            {analysis.ad.landing_page_content}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Web Research / Enrichment - Available for all ads */}
                    <AdEnrichmentPanel
                        adId={analysis.ad.ad_id}
                        advertiserName={analysis.ad.advertiser_name}
                        adText={analysis.ad.text}
                        landingPageUrl={analysis.ad.landing_page_url}
                        scamTypes={analysis.scam_fingerprints?.map(fp => fp.type) || []}
                    />

                    {/* Policy Violations - NEW */}
                    {hasPolicyViolations && (
                        <div>
                            <h4 className="text-rose-400 text-xs uppercase tracking-wider mb-2 font-semibold flex items-center gap-1">
                                <span>⚖️</span> Meta Policy Violations
                            </h4>
                            <div className="space-y-2">
                                {analysis.policy_violations!.map((pv, i) => (
                                    <a
                                        key={i}
                                        href={pv.meta_policy_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block bg-rose-950/40 border border-rose-500/30 rounded-lg p-3 hover:bg-rose-950/60 transition-colors group"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-white font-mono text-sm">{pv.policy_code}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded ${severityColors[pv.severity]}`}>
                                                {pv.severity.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="text-rose-200 text-sm font-medium">{pv.policy_name}</div>
                                        <div className="text-rose-300/70 text-xs flex items-center gap-1 mt-1">
                                            <span>{pv.policy_section}</span>
                                            <span className="text-rose-400 group-hover:underline">→ View Policy</span>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Scam Fingerprint Details - NEW */}
                    {hasScamFingerprints && (
                        <div>
                            <h4 className="text-orange-400 text-xs uppercase tracking-wider mb-2 font-semibold flex items-center gap-1">
                                <span>🔍</span> Scam Pattern Detection
                            </h4>
                            <div className="space-y-2">
                                {analysis.scam_fingerprints!.map((fp, i) => {
                                    const scamInfo = scamTypeLabels[fp.type] || scamTypeLabels.none;
                                    return (
                                        <div
                                            key={i}
                                            className="bg-orange-950/30 border border-orange-500/30 rounded-lg p-3"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`${scamInfo.color} text-white text-xs px-2 py-0.5 rounded flex items-center gap-1`}>
                                                    <span>{scamInfo.emoji}</span>
                                                    <span>{scamInfo.label}</span>
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-orange-300 text-xs">
                                                        Risk: {fp.risk_score}/10
                                                    </span>
                                                    <span className="text-orange-300 text-xs">
                                                        Conf: {(fp.confidence * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                            </div>
                                            {fp.matched_patterns && fp.matched_patterns.length > 0 && (
                                                <div className="text-orange-200/70 text-xs">
                                                    Matched {fp.matched_patterns.length} pattern{fp.matched_patterns.length > 1 ? 's' : ''}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Ad Metadata */}
                    <div>
                        <h4 className="text-slate-400 text-xs uppercase tracking-wider mb-2">Ad Details</h4>
                        <div className="bg-[#0a0f1a]/60 p-3 rounded-lg space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-slate-500">ID:</span>
                                <span className="text-slate-300 font-mono text-xs">{analysis.ad.ad_id}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-slate-500">Advertiser:</span>
                                <span className="text-slate-300">{analysis.ad.advertiser_name}</span>
                            </div>
                            {analysis.ad.start_date && (
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-slate-500">Start Date:</span>
                                    <span className="text-slate-300">{analysis.ad.start_date}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-slate-500">Status:</span>
                                <span className={analysis.ad.is_active ? "text-emerald-400" : "text-slate-500"}>
                                    {analysis.ad.is_active ? "Active" : "Inactive"}
                                </span>
                            </div>
                            {analysis.harm_score && (
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-slate-500">Harm Score:</span>
                                    <span className="text-rose-400 font-bold">{analysis.harm_score}/100</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Full Ad Text */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-slate-400 text-xs uppercase tracking-wider">Full Ad Copy</h4>
                            <CopyButton text={analysis.ad.text} label="Copy" />
                        </div>
                        <p className="text-slate-200 text-sm bg-[#0a0f1a]/60 p-3 rounded-lg whitespace-pre-wrap">
                            {analysis.ad.text}
                        </p>
                    </div>

                    {/* Crux Narrative */}
                    <div>
                        <h4 className="text-slate-400 text-xs uppercase tracking-wider mb-2">Analysis Summary</h4>
                        <p className="text-teal-300 text-sm italic">
                            &quot;{analysis.crux_narrative}&quot;
                        </p>
                    </div>

                    {/* Verdict Distribution */}
                    <div>
                        <h4 className="text-slate-400 text-xs uppercase tracking-wider mb-2">Verdict Distribution</h4>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(analysis.verdict_distribution)
                                .filter(([, count]) => count > 0)
                                .map(([tier, count]) => (
                                    <span
                                        key={tier}
                                        className={`${verdictColors[tier] || 'bg-slate-500'} text-white text-xs px-2 py-1 rounded-full`}
                                    >
                                        {tier}: {count}
                                    </span>
                                ))}
                        </div>
                    </div>

                    {/* Individual Judge Verdicts */}
                    <div>
                        <h4 className="text-slate-400 text-xs uppercase tracking-wider mb-2">Judge Verdicts</h4>
                        <div className="space-y-2">
                            {analysis.judge_verdicts.map((verdict) => (
                                <div
                                    key={verdict.judge_id}
                                    className="bg-[#0a0f1a]/60 rounded-lg p-3"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-white text-sm font-medium">
                                            {verdict.judge_id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </span>
                                        <span className={`${verdictColors[verdict.verdict_tier] || 'bg-slate-500'} text-white text-xs px-2 py-0.5 rounded`}>
                                            {verdict.verdict_tier}
                                        </span>
                                    </div>
                                    <div className="text-slate-400 text-xs mb-1">
                                        {verdict.primary_policy_axis} • {(verdict.confidence_score * 100).toFixed(0)}% confident
                                    </div>
                                    {verdict.reasoning_bullets && verdict.reasoning_bullets.length > 0 && (
                                        <div className="mt-2">
                                            <div className="text-rose-400/80 text-xs mb-1">Concerns:</div>
                                            <ul className="text-slate-300 text-xs space-y-1">
                                                {verdict.reasoning_bullets.map((reason, i) => (
                                                    <li key={i} className="flex items-start gap-1">
                                                        <span className="text-rose-400">•</span>
                                                        <span>{reason}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {verdict.mitigating_factors && verdict.mitigating_factors.length > 0 && (
                                        <div className="mt-2">
                                            <div className="text-emerald-400/80 text-xs mb-1">Mitigating Factors:</div>
                                            <ul className="text-slate-300 text-xs space-y-1">
                                                {verdict.mitigating_factors.map((factor, i) => (
                                                    <li key={i} className="flex items-start gap-1">
                                                        <span className="text-emerald-400">+</span>
                                                        <span>{factor}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
