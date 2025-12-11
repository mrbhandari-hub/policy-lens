'use client';

import { useState } from 'react';
import { JudgeVerdict, VerdictTier } from '@/types';

const tierConfig: Record<VerdictTier, { color: string; bgColor: string; label: string; emoji: string }> = {
    REMOVE: { color: 'text-rose-400', bgColor: 'bg-rose-600', label: 'Remove', emoji: '🚫' },
    AGE_GATE: { color: 'text-orange-400', bgColor: 'bg-orange-500', label: 'Age-Gate', emoji: '🔞' },
    REDUCE_REACH: { color: 'text-amber-400', bgColor: 'bg-amber-500', label: 'Reduce Reach', emoji: '📉' },
    LABEL: { color: 'text-sky-400', bgColor: 'bg-sky-500', label: 'Label', emoji: '🏷️' },
    ALLOW: { color: 'text-emerald-400', bgColor: 'bg-emerald-500', label: 'Allow', emoji: '✅' },
};

// Policy documentation links for major platforms
const policyLinks: Record<string, { name: string; url: string; section?: string }> = {
    'meta': { 
        name: 'Meta Community Standards', 
        url: 'https://transparency.fb.com/policies/community-standards/',
        section: 'Violence & Incitement'
    },
    'youtube': { 
        name: 'YouTube Community Guidelines', 
        url: 'https://support.google.com/youtube/answer/9288567',
        section: 'Violent Criminal Organizations'
    },
    'tiktok': { 
        name: 'TikTok Community Guidelines', 
        url: 'https://www.tiktok.com/community-guidelines',
        section: 'Violence & Hateful Behavior'
    },
    'x_twitter': { 
        name: 'X Rules & Policies', 
        url: 'https://help.twitter.com/en/rules-and-policies',
        section: 'Violent Speech'
    },
    'google_search': { 
        name: 'Google Search Content Policies', 
        url: 'https://support.google.com/websearch/answer/10622781',
        section: 'Safety (Harm Reduction)'
    },
    'eu_regulator': {
        name: 'EU Digital Services Act',
        url: 'https://digital-strategy.ec.europa.eu/en/policies/digital-services-act-package',
        section: 'Illegal Content'
    },
};

// Jurisdiction indicators
const jurisdictionInfo: Record<string, { flag: string; region: string; note: string }> = {
    'meta': { flag: '🇺🇸', region: 'Global (US-based)', note: 'Stricter on incitement post-Jan 6' },
    'youtube': { flag: '🇺🇸', region: 'Global (US-based)', note: 'Context-dependent enforcement' },
    'tiktok': { flag: '🇨🇳', region: 'Global (CN-owned)', note: 'More restrictive on political content' },
    'x_twitter': { flag: '🇺🇸', region: 'Global (US-based)', note: 'Free speech oriented since 2022' },
    'google_search': { flag: '🇺🇸', region: 'Global (US-based)', note: 'Deranks rather than removes' },
    'eu_regulator': { flag: '🇪🇺', region: 'European Union', note: 'DSA compliance required' },
};

interface JudgeDetailCardsProps {
    verdicts: JudgeVerdict[];
}

export function JudgeDetailCards({ verdicts }: JudgeDetailCardsProps) {
    const [expandedJudge, setExpandedJudge] = useState<string | null>(null);

    const formatJudgeName = (id: string): string => {
        const nameMap: Record<string, string> = {
            'meta': 'Meta (Facebook/Instagram)',
            'youtube': 'YouTube',
            'tiktok': 'TikTok',
            'x_twitter': 'X (formerly Twitter)',
            'google_search': 'Google Search',
            'civil_libertarian': 'Civil Libertarian',
            'global_conservative': 'Global Conservative',
            'global_progressive': 'Global Progressive',
            'eu_regulator': 'EU Regulator (DSA)',
            'human_rights_lawyer': 'Human Rights Lawyer',
            'journalist_press': 'Press Freedom Advocate',
            'child_safety_advocate': 'Child Safety Advocate',
            'counterterrorism_expert': 'Counterterrorism Expert',
            'brand_safety_advertiser': 'Brand Safety (Advertiser)',
            'academic_researcher': 'Academic Researcher',
            'global_south_advocate': 'Global South Advocate',
            'creator_economy': 'Creator Economy',
            'platform_legal_counsel': 'Platform Legal Counsel',
        };
        return nameMap[id] || id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    const toggleExpand = (judgeId: string) => {
        setExpandedJudge(expandedJudge === judgeId ? null : judgeId);
    };

    const isPlatformJudge = (id: string) => ['meta', 'youtube', 'tiktok', 'x_twitter', 'google_search'].includes(id);

    return (
        <div className="bg-[#0f1629]/90 backdrop-blur-sm border border-[#1e293d] rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-white text-xl font-bold flex items-center gap-2">
                    <span className="text-2xl">⚖️</span> Detailed Rationale
                </h3>
                <div className="text-slate-500 text-xs flex items-center gap-2">
                    <span>📖</span> Click to expand policy citations
                </div>
            </div>

            <div className="space-y-4">
                {verdicts.map((verdict) => {
                    const config = tierConfig[verdict.verdict_tier];
                    const isExpanded = expandedJudge === verdict.judge_id;
                    const hasPolicyLink = policyLinks[verdict.judge_id];
                    const hasJurisdiction = jurisdictionInfo[verdict.judge_id];
                    const isPlatform = isPlatformJudge(verdict.judge_id);

                    return (
                        <div
                            key={verdict.judge_id}
                            className={`border rounded-xl overflow-hidden transition-all ${
                                isPlatform ? 'border-purple-500/30' : 'border-[#2d3a52]'
                            }`}
                        >
                            {/* Header - always visible */}
                            <button
                                onClick={() => toggleExpand(verdict.judge_id)}
                                className="w-full p-4 bg-[#151d2e]/80 hover:bg-[#1e293d]/80 transition-colors flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3 flex-wrap">
                                    <span
                                        className={`${config.bgColor} text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-md flex items-center gap-1`}
                                    >
                                        <span>{config.emoji}</span>
                                        {config.label}
                                    </span>
                                    <span className="text-white font-semibold">
                                        {formatJudgeName(verdict.judge_id)}
                                    </span>
                                    {hasJurisdiction && (
                                        <span className="text-lg" title={hasJurisdiction.region}>
                                            {hasJurisdiction.flag}
                                        </span>
                                    )}
                                    <span className="text-slate-400 text-sm hidden lg:inline px-2 py-0.5 bg-[#1e293d]/60 rounded">
                                        {verdict.primary_policy_axis}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-slate-400 text-sm hidden sm:inline">
                                        {(verdict.confidence_score * 100).toFixed(0)}% confident
                                    </span>
                                    <span
                                        className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                    >
                                        ▼
                                    </span>
                                </div>
                            </button>

                            {/* Expanded content */}
                            {isExpanded && (
                                <div className="p-4 bg-[#0a0f1a]/60 border-t border-[#1e293d] space-y-4">
                                    {/* Policy Citation - NEW */}
                                    {hasPolicyLink && (
                                        <div className="bg-[#1e293d]/40 border border-[#2d3a52] rounded-lg p-3">
                                            <h4 className="text-purple-400 text-xs font-semibold mb-2 flex items-center gap-2">
                                                <span>📖</span> Policy Reference
                                            </h4>
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                <a 
                                                    href={hasPolicyLink.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-teal-300 text-sm hover:text-teal-200 underline underline-offset-2 flex items-center gap-1"
                                                >
                                                    {hasPolicyLink.name}
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                </a>
                                                {hasPolicyLink.section && (
                                                    <span className="text-slate-400 text-xs">
                                                        → Section: <span className="text-amber-300">{hasPolicyLink.section}</span>
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-slate-500 text-xs mt-2 italic">
                                                Note: Policy versions change frequently. This references the current known policy framework.
                                            </p>
                                        </div>
                                    )}

                                    {/* Jurisdiction Context - NEW */}
                                    {hasJurisdiction && (
                                        <div className="flex items-center gap-3 text-sm bg-[#1e293d]/30 rounded-lg p-2">
                                            <span className="text-xl">{hasJurisdiction.flag}</span>
                                            <div>
                                                <span className="text-slate-300">{hasJurisdiction.region}</span>
                                                <span className="text-slate-500 mx-2">•</span>
                                                <span className="text-slate-400">{hasJurisdiction.note}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Reasoning */}
                                    <div>
                                        <h4 className="text-teal-400 text-sm font-semibold mb-2 flex items-center gap-2">
                                            <span>💭</span> Reasoning
                                        </h4>
                                        <ul className="space-y-2">
                                            {verdict.reasoning_bullets.map((bullet, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                                                    <span className="text-teal-400 mt-1">•</span>
                                                    <span>{bullet}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Mitigating Factors */}
                                    {verdict.mitigating_factors.length > 0 && (
                                        <div>
                                            <h4 className="text-emerald-400 text-sm font-semibold mb-2 flex items-center gap-2">
                                                <span>🛡️</span> Mitigating Factors
                                            </h4>
                                            <ul className="space-y-2">
                                                {verdict.mitigating_factors.map((factor, idx) => (
                                                    <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                                                        <span className="text-emerald-400 mt-1">+</span>
                                                        <span>{factor}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Footer with confidence and safety */}
                                    <div className="pt-3 border-t border-[#1e293d] flex flex-wrap items-center gap-3">
                                        {/* Confidence indicator */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-500 text-xs">Confidence:</span>
                                            <div className="w-24 h-2 bg-[#2d3a52] rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${
                                                        verdict.confidence_score >= 0.8 ? 'bg-emerald-500' :
                                                        verdict.confidence_score >= 0.6 ? 'bg-teal-500' :
                                                        verdict.confidence_score >= 0.4 ? 'bg-amber-500' : 'bg-rose-500'
                                                    }`}
                                                    style={{ width: `${verdict.confidence_score * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-slate-400 text-xs font-mono">
                                                {(verdict.confidence_score * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                        
                                        {/* Safety confirmation */}
                                        <span
                                            className={`text-xs px-2 py-1 rounded ${verdict.refusal_to_instruct
                                                    ? 'bg-emerald-900/30 text-emerald-400'
                                                    : 'bg-amber-900/30 text-amber-400'
                                                }`}
                                        >
                                            {verdict.refusal_to_instruct
                                                ? '✓ No evasion advice provided'
                                                : '⚠ Safety flag unchecked'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
