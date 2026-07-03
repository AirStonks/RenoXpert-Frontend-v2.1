import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Calculator, X } from 'lucide-react';
import type { RoiCalculator } from '../../../types';
import { scenarioMonthlyRange, roiPercent, annual, paybackMonths, roomRange, hasPartition } from '../../../utils/roiCalculator';
import type { RoiScenario } from '../../../utils/roiCalculator';

export type RoiCalcPackage = { id: number; name: string; price: number };

interface Props {
    roi: RoiCalculator;
    packages: RoiCalcPackage[];
}

const money = (n: number) => 'RM' + Math.round(n).toLocaleString('en-MY');
const fmtRange = (lo: number, hi: number, f: (n: number) => string) =>
    Math.round(lo) === Math.round(hi) ? f(lo) : `${f(lo)} - ${f(hi)}`;

const ANIM_MS = 300;

const RoiCalculatorDrawer: React.FC<Props> = ({ roi, packages }) => {
    const part = hasPartition(roi);
    const [open, setOpen] = useState(false);
    const [shown, setShown] = useState(false); // drives the enter/leave transition classes
    const [strategy, setStrategy] = useState<'whole' | 'co'>('co');
    const [partition, setPartition] = useState<'no' | 'yes'>(part ? 'yes' : 'no');
    const [occ, setOcc] = useState<number>(roi.occupancy_steps.normal);
    const [spa, setSpa] = useState<number>(roi.spa_price);

    const closeTimer = useRef<number | null>(null);
    const clearCloseTimer = () => {
        if (closeTimer.current != null) { window.clearTimeout(closeTimer.current); closeTimer.current = null; }
    };

    // Animate in on mount: double rAF guarantees the hidden state paints before the transition flips.
    useEffect(() => {
        if (!open) return;
        let id2 = 0;
        const id1 = requestAnimationFrame(() => { id2 = requestAnimationFrame(() => setShown(true)); });
        return () => { cancelAnimationFrame(id1); cancelAnimationFrame(id2); };
    }, [open]);

    // Cancel any pending unmount timer if the component itself unmounts mid-close.
    useEffect(() => clearCloseTimer, []);

    const openModal = () => {
        clearCloseTimer();
        if (open) setShown(true); // reopened during the close animation — animate back in
        else setOpen(true); // fresh mount — the effect above animates in
    };

    // Animate out, then unmount.
    const close = useCallback(() => {
        setShown(false);
        clearCloseTimer();
        closeTimer.current = window.setTimeout(() => { setOpen(false); closeTimer.current = null; }, ANIM_MS);
    }, []);

    // Close on Escape while open.
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, close]);

    const pkgById = (id: number | null) => (id == null ? null : packages.find((p) => p.id === id) ?? null);
    const active: RoiScenario = strategy === 'whole' ? 'whole' : (part && partition === 'yes' ? 'opt' : 'co');

    const cols: { key: RoiScenario; label: string }[] = [
        { key: 'whole', label: 'Whole Unit' },
        { key: 'co', label: 'Co-Living' },
        ...(part ? [{ key: 'opt' as RoiScenario, label: 'Optimized' }] : []),
    ];
    const totals: Record<string, [number, number]> = {};
    cols.forEach((c) => { totals[c.key] = scenarioMonthlyRange(roi, c.key, occ); });

    const wholeM = scenarioMonthlyRange(roi, 'whole', occ)[0];
    const t = totals[active];
    const profA: [number, number] = [annual(t[0]), annual(t[1])];

    const renoPkg = active === 'whole' ? null : (active === 'opt' ? pkgById(roi.packages.with_partition) : pkgById(roi.packages.without_partition));
    const diffM: [number, number] = [t[0] - wholeM, t[1] - wholeM];
    // money() carries its own minus sign, so only prepend "+" when the difference is positive.
    const diffSign = diffM[0] < 0 ? '' : '+';
    const months = renoPkg ? paybackMonths(renoPkg.price, t[0], wholeM) : null;

    const seg = (on: boolean) =>
        `flex-1 px-2 py-2.5 text-sm font-semibold transition-colors ${on ? 'bg-campaign text-white' : 'bg-white text-slate-500 hover:text-slate-700'}`;
    const featCell = (on: boolean) => (on ? 'bg-rose-50' : '');
    const roiCell = (r: [number, number]) =>
        spa > 0 ? fmtRange(roiPercent(r[0], spa), roiPercent(r[1], spa), (v) => v.toFixed(1) + '%') : '–';
    const numCell = 'px-2 py-2.5 sm:px-3';

    return (
        <>
            {/* Floating button — lifted above the lg:hidden sticky bottom bar on mobile */}
            <button
                type="button"
                onClick={openModal}
                aria-label="ROI Calculator"
                className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-campaign text-white shadow-xl transition-transform hover:scale-105 lg:bottom-6 lg:right-6"
            >
                <Calculator className="h-6 w-6" />
            </button>

            {open && (
                <div
                    className={`fixed inset-0 z-50 flex items-end justify-center bg-black/40 transition-opacity duration-300 sm:items-center sm:p-6 ${shown ? 'opacity-100' : 'opacity-0'}`}
                    onClick={close}
                >
                    {/* Mobile: bottom sheet (slides up) · Desktop: centered modal (fade + scale) */}
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="ROI Calculator"
                        className={`flex h-[92dvh] w-full flex-col rounded-t-2xl bg-white shadow-xl transition-[transform,opacity] duration-300 ease-out sm:h-auto sm:max-h-[88vh] sm:max-w-2xl sm:rounded-2xl ${shown ? 'translate-y-0 sm:scale-100 sm:opacity-100' : 'translate-y-full sm:translate-y-0 sm:scale-95 sm:opacity-0'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">ROI Calculator</h2>
                                {(roi.unit_facts?.size || roi.unit_facts?.beds_baths) && (
                                    <p className="text-xs text-slate-400">
                                        {[roi.unit_facts?.size, roi.unit_facts?.beds_baths].filter(Boolean).join(' · ')}
                                    </p>
                                )}
                            </div>
                            <button type="button" onClick={close} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Close">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
                            {/* Controls */}
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Rental strategy</label>
                                    <div className="flex divide-x divide-slate-200 overflow-hidden rounded-xl border border-slate-200">
                                        <button type="button" className={seg(strategy === 'whole')} onClick={() => setStrategy('whole')}>Whole Unit</button>
                                        <button type="button" className={seg(strategy === 'co')} onClick={() => setStrategy('co')}>Co-Living</button>
                                    </div>
                                </div>
                                {strategy === 'co' && part && (
                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Renovation</label>
                                        <div className="flex divide-x divide-slate-200 overflow-hidden rounded-xl border border-slate-200">
                                            <button type="button" className={seg(partition === 'no')} onClick={() => setPartition('no')}>W/o partition</button>
                                            <button type="button" className={seg(partition === 'yes')} onClick={() => setPartition('yes')}>With partition</button>
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Occupancy</label>
                                    <div className="flex divide-x divide-slate-200 overflow-hidden rounded-xl border border-slate-200">
                                        {([['Worst', roi.occupancy_steps.worst], ['Normal', roi.occupancy_steps.normal], ['Best', roi.occupancy_steps.best]] as [string, number][]).map(([lbl, val]) => (
                                            <button key={lbl} type="button" className={seg(occ === val)} onClick={() => setOcc(val)}>
                                                <span className="block leading-tight">{lbl}</span>
                                                <span className={`block text-[11px] leading-tight ${occ === val ? 'text-white/80' : 'text-slate-400'}`}>{val}%</span>
                                            </button>
                                        ))}
                                    </div>
                                    <p className="mt-1.5 text-[11px] text-slate-400">Applies to co-living rooms only — a whole unit is a single tenancy.</p>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Purchase price (SPA)</label>
                                    <input type="number" value={spa} onChange={(e) => setSpa(Number(e.target.value) || 0)}
                                        className="block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-900" />
                                </div>
                            </div>

                            {/* Profit -> Difference -> Cost emphasis band */}
                            <div className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                    <span className="w-full text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:w-20">Profit</span>
                                    <span className="text-3xl font-extrabold leading-none text-green-600">{fmtRange(profA[0], profA[1], money)}</span>
                                    <span className="text-xs text-slate-400">{fmtRange(t[0], t[1], money)}/mo · per year</span>
                                </div>
                                <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-dashed border-slate-200 pt-3">
                                    <span className="w-full text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:w-20">Difference</span>
                                    {active === 'whole'
                                        ? <span className="text-xl font-extrabold text-slate-400">Baseline</span>
                                        : (<>
                                            <span className="text-xl font-extrabold text-campaign">{diffSign}{fmtRange(annual(diffM[0]), annual(diffM[1]), money)}</span>
                                            <span className="text-xs text-slate-400">{diffSign}{fmtRange(diffM[0], diffM[1], money)}/mo vs whole unit</span>
                                        </>)}
                                </div>
                                <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-dashed border-slate-200 pt-3">
                                    <span className="w-full text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:w-20">Cost</span>
                                    {renoPkg
                                        ? (<>
                                            <span className="text-sm font-bold text-slate-900">{money(renoPkg.price)}</span>
                                            <span className="text-xs text-slate-400">{months != null ? `pays back in ${months.toFixed(1)} mo` : 'one-time renovation'}</span>
                                        </>)
                                        : <span className="text-sm font-bold text-slate-400">–</span>}
                                </div>
                            </div>

                            {/* Always-on comparison table — fits without horizontal scroll:
                                room labels never wrap; ranges break at the " - " separator instead. */}
                            <div className="overflow-hidden rounded-2xl border border-slate-200">
                                <table className="w-full text-right text-xs sm:text-[13px]">
                                    <thead>
                                        <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                                            <th className="whitespace-nowrap px-2 py-2.5 text-left font-bold sm:px-3">Condo</th>
                                            {cols.map((c) => (
                                                <th key={c.key} className={`px-2 py-2.5 font-bold sm:px-3 ${c.key === active ? 'text-campaign' : ''}`}>
                                                    {c.label}{c.key === active ? ' ★' : ''}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {roi.rooms.map((rm, i) => (
                                            <tr key={rm.id} className="border-t border-slate-100">
                                                {/* Truncate long labels with an ellipsis (title shows the full text) instead of clipping the table */}
                                                <td className="px-2 py-2.5 text-left text-slate-700 sm:px-3">
                                                    <span className="block max-w-[9rem] truncate sm:max-w-none" title={rm.label}>{rm.label}</span>
                                                </td>
                                                {cols.map((c) => {
                                                    if (c.key === 'whole') {
                                                        return i === 0
                                                            ? <td key={c.key} rowSpan={roi.rooms.length} className={`px-2 text-center align-middle font-semibold sm:px-3 ${featCell(active === 'whole')}`}>{money(roi.whole_unit.amount)}<div className="text-[10px] font-normal text-slate-400">whole unit</div></td>
                                                            : null;
                                                    }
                                                    const show = c.key === 'opt' ? true : !rm.partition;
                                                    if (!show) return <td key={c.key} className={`${numCell} ${featCell(c.key === active)}`}><span className="text-slate-300">–</span></td>;
                                                    const [lo, hi] = roomRange(rm, roi.pm_spread);
                                                    return <td key={c.key} className={`${numCell} ${featCell(c.key === active)}`}>{fmtRange(lo, hi, money)}</td>;
                                                })}
                                            </tr>
                                        ))}
                                        <tr className="border-t-2 border-slate-300 font-extrabold">
                                            <td className="whitespace-nowrap px-2 py-2.5 text-left sm:px-3">Total / month</td>
                                            {cols.map((c) => <td key={c.key} className={`${numCell} ${featCell(c.key === active)}`}>{fmtRange(totals[c.key][0], totals[c.key][1], money)}</td>)}
                                        </tr>
                                        <tr className="font-extrabold text-campaign">
                                            <td className="whitespace-nowrap px-2 py-2.5 text-left sm:px-3">ROI %</td>
                                            {cols.map((c) => <td key={c.key} className={`${numCell} ${featCell(c.key === active)}`}>{roiCell(totals[c.key])}</td>)}
                                        </tr>
                                        <tr className="font-semibold text-slate-500">
                                            <td className="whitespace-nowrap px-2 py-2.5 text-left sm:px-3">Annual income</td>
                                            {cols.map((c) => <td key={c.key} className={`${numCell} ${featCell(c.key === active)}`}>{fmtRange(annual(totals[c.key][0]), annual(totals[c.key][1]), money)}</td>)}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {renoPkg && (
                                <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">{renoPkg.name}</p>
                                        <p className="text-xs text-slate-400">Renovation package</p>
                                    </div>
                                    <span className="whitespace-nowrap text-base font-extrabold text-campaign">{money(renoPkg.price)}</span>
                                </div>
                            )}

                            {roi.disclaimers.length > 0 && (
                                <ul className="space-y-1 text-[11px] leading-relaxed text-slate-400">
                                    {roi.disclaimers.map((d, i) => <li key={i}>* {d}</li>)}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default RoiCalculatorDrawer;
