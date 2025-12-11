'use client';

import { useState, useEffect, useRef } from 'react';
import { PolicyLensResponse } from '@/types';

interface ResultsNavigationProps {
    response: PolicyLensResponse;
}

export function ResultsNavigation({ response }: ResultsNavigationProps) {
    const [activeSection, setActiveSection] = useState<string>('summary');
    const [isVisible, setIsVisible] = useState(true);
    const lastScrollY = useRef(0);

    const sections = [
        { id: 'summary', label: 'Verdict Summary', icon: '🎯' },
        { id: 'synthesis', label: 'The Crux', icon: '💡' },
        { id: 'distribution', label: 'Distribution', icon: '📊' },
        { id: 'rationale', label: 'Detailed Rationale', icon: '⚖️' },
        ...(response.debate ? [{ id: 'debate', label: 'Pro/Con Debate', icon: '⚔️' }] : []),
        ...(response.cross_model ? [{ id: 'crossmodel', label: 'Cross-Model', icon: '🤖' }] : []),
        ...(response.counterfactual ? [{ id: 'counterfactual', label: 'Counterfactual', icon: '🔀' }] : []),
        ...(response.red_team ? [{ id: 'redteam', label: 'Red Team', icon: '🎯' }] : []),
        ...(response.temporal ? [{ id: 'temporal', label: 'Temporal', icon: '⏰' }] : []),
        ...(response.appeal ? [{ id: 'appeal', label: 'Appeal', icon: '📝' }] : []),
        ...(response.sycophancy ? [{ id: 'sycophancy', label: 'Sycophancy', icon: '🎭' }] : []),
    ];

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            
            // Hide/show nav on scroll direction
            if (currentScrollY > lastScrollY.current && currentScrollY > 200) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }
            lastScrollY.current = currentScrollY;

            // Find active section
            const sectionElements = sections.map(s => ({
                id: s.id,
                element: document.getElementById(`section-${s.id}`)
            }));

            for (let i = sectionElements.length - 1; i >= 0; i--) {
                const { element } = sectionElements[i];
                if (element) {
                    const rect = element.getBoundingClientRect();
                    if (rect.top <= 150) {
                        setActiveSection(sectionElements[i].id);
                        break;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Initial check
        return () => window.removeEventListener('scroll', handleScroll);
    }, [sections]);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(`section-${id}`);
        if (element) {
            const offset = 100;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    if (sections.length <= 1) return null;

    return (
        <div
            className={`fixed left-4 top-1/2 -translate-y-1/2 z-40 transition-all duration-300 ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'
            } hidden lg:block`}
        >
            <div className="bg-[#0f1629]/95 backdrop-blur-sm border border-[#1e293d] rounded-xl p-3 shadow-xl">
                <div className="text-xs text-slate-400 mb-2 px-2 font-medium">Navigation</div>
                <nav className="space-y-1">
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => scrollToSection(section.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center gap-2 ${
                                activeSection === section.id
                                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                                    : 'text-slate-400 hover:text-white hover:bg-[#1e293d]/50'
                            }`}
                        >
                            <span>{section.icon}</span>
                            <span className="truncate">{section.label}</span>
                        </button>
                    ))}
                </nav>
            </div>
        </div>
    );
}

