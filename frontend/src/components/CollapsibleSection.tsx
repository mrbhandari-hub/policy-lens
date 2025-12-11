'use client';

import { useState, useEffect, ReactNode } from 'react';

interface CollapsibleSectionProps {
    id: string;
    title: string;
    icon: string;
    children: ReactNode;
    defaultExpanded?: boolean;
}

export function CollapsibleSection({ 
    id, 
    title, 
    icon, 
    children, 
    defaultExpanded = true 
}: CollapsibleSectionProps) {
    const [isExpanded, setIsExpanded] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(`collapsible-${id}`);
            return saved ? saved === 'true' : defaultExpanded;
        }
        return defaultExpanded;
    });

    useEffect(() => {
        localStorage.setItem(`collapsible-${id}`, String(isExpanded));
    }, [id, isExpanded]);

    return (
        <div className="overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-3 mb-2 flex items-center justify-between bg-[#1e293d]/40 rounded-lg hover:bg-[#1e293d]/60 transition-colors border border-[#2d3a52]"
            >
                <div className="flex items-center gap-3">
                    <span className="text-xl">{icon}</span>
                    <h3 className="text-white text-sm font-semibold">{title}</h3>
                </div>
                <svg
                    className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isExpanded && (
                <div>
                    {children}
                </div>
            )}
        </div>
    );
}

