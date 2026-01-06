// src/hooks/useCollapsibleSections.ts
// Custom hook for managing collapsible sections

import { useState, useCallback } from 'react';

export interface CollapsibleSection {
    id: string;
    title: string;
    icon: React.ElementType;
    isOpen: boolean;
}

export const useCollapsibleSections = (initialSections: CollapsibleSection[]) => {
    const [sections, setSections] = useState<CollapsibleSection[]>(initialSections);
    
    const toggleSection = useCallback((sectionId: string) => {
        setSections(prev => prev.map(section => 
            section.id === sectionId ? { ...section, isOpen: !section.isOpen } : section
        ));
    }, []);
    
    return { sections, setSections, toggleSection };
};

