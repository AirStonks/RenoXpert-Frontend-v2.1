import React, { useState, useEffect } from 'react';

export interface AssignmentItem {
    id: number;
    label: string;
    sublabel?: string;
}

interface AssignmentModalProps {
    title: string;
    items: AssignmentItem[];
    selectedIds: number[];
    loading?: boolean;
    saving?: boolean;
    onSave: (ids: number[]) => void;
    onClose: () => void;
}

const AssignmentModal: React.FC<AssignmentModalProps> = ({ title, items, selectedIds, loading = false, saving = false, onSave, onClose }) => {
    const [selected, setSelected] = useState<Set<number>>(new Set(selectedIds));
    const [query, setQuery] = useState('');

    useEffect(() => { setSelected(new Set(selectedIds)); }, [selectedIds]);

    const toggle = (id: number) => setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });

    const q = query.trim().toLowerCase();
    const filtered = q
        ? items.filter((i) => i.label.toLowerCase().includes(q) || (i.sublabel || '').toLowerCase().includes(q))
        : items;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <div className="w-full max-w-md rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                    <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">✕</button>
                </div>
                <div className="px-5 py-3">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search…"
                        className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                        {loading ? (
                            <p className="py-6 text-center text-sm text-gray-400">Loading…</p>
                        ) : filtered.length === 0 ? (
                            <p className="py-6 text-center text-sm text-gray-400">Nothing to show.</p>
                        ) : filtered.map((i) => (
                            <label key={i.id} className="flex cursor-pointer items-center gap-3 py-2.5">
                                <input type="checkbox" checked={selected.has(i.id)} onChange={() => toggle(i.id)} className="h-4 w-4 rounded border-gray-300" />
                                <span className="flex-1">
                                    <span className="block text-sm text-gray-900">{i.label}</span>
                                    {i.sublabel && <span className="block text-xs text-gray-400">{i.sublabel}</span>}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4">
                    <span className="text-xs text-gray-400">{selected.size} selected</span>
                    <div className="flex gap-2">
                        <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600">Cancel</button>
                        <button type="button" disabled={saving || loading} onClick={() => onSave(Array.from(selected))} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignmentModal;
