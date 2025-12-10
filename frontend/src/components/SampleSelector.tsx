'use client';

import { useState, useMemo } from 'react';
import { SampleCase, SampleRegion, SAMPLE_CASES, SAMPLE_REGIONS, getPolicyCategories } from '@/data/samples';

type ViewMode = 'all' | 'region' | 'policy';

const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
    violating: { bg: 'bg-red-600/20', border: 'border-red-500/50', text: 'text-red-400' },
    borderline: { bg: 'bg-yellow-600/20', border: 'border-yellow-500/50', text: 'text-yellow-400' },
    benign: { bg: 'bg-green-600/20', border: 'border-green-500/50', text: 'text-green-400' },
};

const categoryEmoji = {
    violating: '🔴',
    borderline: '🟡',
    benign: '🟢',
};

interface SampleSelectorProps {
    onSelect: (sample: SampleCase) => void;
    isExpanded: boolean;
    onToggle: () => void;
}

export function SampleSelector({ onSelect, isExpanded, onToggle }: SampleSelectorProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('all');
    const [selectedRegion, setSelectedRegion] = useState<SampleRegion | null>(null);
    const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const policyCategories = useMemo(() => getPolicyCategories(), []);

    // Filter samples based on current view and filters
    const filteredSamples = useMemo(() => {
        let samples = SAMPLE_CASES;

        // Filter by search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            samples = samples.filter(s => 
                s.label.toLowerCase().includes(query) ||
                s.content.toLowerCase().includes(query) ||
                s.policyCategory.toLowerCase().includes(query)
            );
        }

        // Filter by region
        if (viewMode === 'region' && selectedRegion) {
            samples = samples.filter(s => s.region === selectedRegion);
        }

        // Filter by policy
        if (viewMode === 'policy' && selectedPolicy) {
            samples = samples.filter(s => s.policyCategory === selectedPolicy);
        }

        return samples;
    }, [viewMode, selectedRegion, selectedPolicy, searchQuery]);

    // Group samples by category for display
    const groupedSamples = useMemo(() => {
        if (viewMode === 'all') {
            return { 'All Samples': filteredSamples };
        }
        if (viewMode === 'region') {
            return SAMPLE_REGIONS.reduce((acc, region) => {
                const regionSamples = filteredSamples.filter(s => s.region === region.id);
                if (regionSamples.length > 0) {
                    acc[`${region.flag} ${region.label}`] = regionSamples;
                }
                return acc;
            }, {} as Record<string, SampleCase[]>);
        }
        if (viewMode === 'policy') {
            return policyCategories.reduce((acc, category) => {
                const policySamples = filteredSamples.filter(s => s.policyCategory === category);
                if (policySamples.length > 0) {
                    acc[category] = policySamples;
                }
                return acc;
            }, {} as Record<string, SampleCase[]>);
        }
        return {};
    }, [viewMode, filteredSamples, policyCategories]);

    const handleSelect = (sample: SampleCase) => {
        onSelect(sample);
        onToggle(); // Close the selector
    };

    return (
        <div className="mb-6">
            {/* Toggle Button */}
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-800/80 border border-slate-700 rounded-xl p-4 hover:border-purple-500/50 transition-all group"
            >
                <div className="flex items-center gap-3">
                    <span className="text-2xl">✨</span>
                    <div className="text-left">
                        <div className="text-white font-medium">Try a Sample Case</div>
                        <div className="text-slate-400 text-sm">
                            {SAMPLE_CASES.length} test scenarios across {SAMPLE_REGIONS.length} regions
                        </div>
                    </div>
                </div>
                <svg 
                    className={`w-5 h-5 text-slate-400 group-hover:text-purple-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Expanded Panel */}
            {isExpanded && (
                <div className="mt-2 bg-slate-800/90 backdrop-blur border border-slate-700 rounded-xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    {/* View Mode Tabs */}
                    <div className="flex items-center border-b border-slate-700">
                        <button
                            onClick={() => { setViewMode('all'); setSelectedRegion(null); setSelectedPolicy(null); }}
                            className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
                                viewMode === 'all'
                                    ? 'text-purple-400 border-b-2 border-purple-500 bg-purple-500/10'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            📋 All
                        </button>
                        <button
                            onClick={() => { setViewMode('region'); setSelectedPolicy(null); }}
                            className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
                                viewMode === 'region'
                                    ? 'text-purple-400 border-b-2 border-purple-500 bg-purple-500/10'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            🌍 By Region
                        </button>
                        <button
                            onClick={() => { setViewMode('policy'); setSelectedRegion(null); }}
                            className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
                                viewMode === 'policy'
                                    ? 'text-purple-400 border-b-2 border-purple-500 bg-purple-500/10'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            📜 By Policy
                        </button>
                    </div>

                    {/* Sub-filters for region/policy view */}
                    {viewMode === 'region' && (
                        <div className="p-3 border-b border-slate-700 bg-slate-900/50">
                            <div className="flex flex-wrap gap-2">
                                {SAMPLE_REGIONS.map(region => (
                                    <button
                                        key={region.id}
                                        onClick={() => setSelectedRegion(selectedRegion === region.id ? null : region.id)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                            selectedRegion === region.id
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                                        }`}
                                    >
                                        {region.flag} {region.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {viewMode === 'policy' && (
                        <div className="p-3 border-b border-slate-700 bg-slate-900/50">
                            <div className="flex flex-wrap gap-2">
                                {policyCategories.map(category => (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedPolicy(selectedPolicy === category ? null : category)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                            selectedPolicy === category
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                                        }`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Search */}
                    <div className="p-3 border-b border-slate-700">
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search samples..."
                                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                            />
                        </div>
                    </div>

                    {/* Sample Cards */}
                    <div className="max-h-96 overflow-y-auto p-3">
                        {Object.entries(groupedSamples).map(([groupName, samples]) => (
                            <div key={groupName} className="mb-4 last:mb-0">
                                {viewMode !== 'all' && (
                                    <div className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-2 px-1">
                                        {groupName} ({samples.length})
                                    </div>
                                )}
                                <div className="grid gap-2">
                                    {samples.map(sample => {
                                        const colors = categoryColors[sample.category];
                                        const region = SAMPLE_REGIONS.find(r => r.id === sample.region);
                                        return (
                                            <button
                                                key={sample.id}
                                                onClick={() => handleSelect(sample)}
                                                className={`w-full text-left p-3 rounded-lg border ${colors.border} ${colors.bg} hover:bg-opacity-40 transition-all group`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-sm">{categoryEmoji[sample.category]}</span>
                                                            <span className={`text-sm font-medium ${colors.text} truncate`}>
                                                                {sample.label.replace(/^[🔴🟡🟢⚖️✅]\s*/, '')}
                                                            </span>
                                                            {region && region.id !== 'global' && (
                                                                <span className="text-xs" title={region.label}>{region.flag}</span>
                                                            )}
                                                        </div>
                                                        <div className="text-slate-400 text-xs line-clamp-2">
                                                            {sample.content.substring(0, 100)}...
                                                        </div>
                                                    </div>
                                                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded">
                                                        {sample.policyCategory}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {filteredSamples.length === 0 && (
                            <div className="text-center py-8">
                                <div className="text-3xl mb-2">🔍</div>
                                <div className="text-slate-400 text-sm">No samples found</div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

