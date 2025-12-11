'use client';

import { useState, useEffect } from 'react';
import { PolicyLensResponse } from '@/types';

interface MobileResultsNavProps {
    response: PolicyLensResponse;
}

export function MobileResultsNav({ response }: MobileResultsNavProps) {
    const [activeSection, setActiveSection] = useState<string>('summary');
    const [isVisible, setIsVisible] = useState(false);

    const sections = [
        { id: 'summary', label: 'Summary', icon: '🎯' },
        { id: 'synthesis', label: 'Crux', icon: '💡' },
        { id: 'distribution', label: 'Chart', icon: '📊' },
        { id: 'rationale', label: 'Details', icon: '⚖️' },
        ...(response.debate ? [{ id: 'debate', label: 'Debate', icon: '⚔️' }] : []),
        ...(response.cross_model ? [{ id: 'crossmodel', label: 'Models', icon: '🤖' }] : []),
    ];

    useEffect(() => {
        const handleScroll = () => {
            const sectionElements = sections.map(s => ({
                id: s.id,
                element: document.getElementById(`section-${s.id}`)
            }));

            for (let i = sectionElements.length - 1; i >= 0; i--) {
                const { element } = sectionElements[i];
                if (element) {
                    const rect = element.getBoundingClientRect();
                    if (rect.top <= 200) {
                        setActiveSection(sectionElements[i].id);
                        break;
                    }
                }
            }

            // Show nav when scrolled past first section
            setIsVisible(window.scrollY > 300);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, [sections]);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(`section-${id}`);
        if (element) {
            const offset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    if (sections.length <= 1 || !isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
            <div className="bg-[#0f1629]/95 backdrop-blur-md border-t border-[#1e293d] shadow-2xl">
                <div className="overflow-x-auto">
                    <div className="flex items-center gap-1 px-2 py-2 min-w-max">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => scrollToSection(section.id)}
                                className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 min-h-[44px] ${
                                    activeSection === section.id
                                        ? 'bg-teal-500/20 text-teal-300'
                                        : 'text-slate-400 hover:text-white hover:bg-[#1e293d]/50'
                                }`}
                            >
                                <span className="text-sm">{section.icon}</span>
                                <span>{section.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

