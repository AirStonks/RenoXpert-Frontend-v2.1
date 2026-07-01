import React, { useState } from 'react';
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

const RoiCalculatorDrawer: React.FC<Props> = ({ roi, packages }) => {
    const part = hasPartition(roi);
    const [open, setOpen] = useState(false);
    const [strategy, setStrategy] = useState<'whole' | 'co'>('co');
    const [partition, setPartition] = useState<'no' | 'yes'>(part ? 'yes' : 'no');
    const [occ, setOcc] = useState<number>(roi.occupancy_steps.normal);
    const [spa, setSpa] = useState<number>(roi.spa_price);

    const pkgById = (id: number | null) => (id == null ? null : packages.find((p) => p.id === id) ?? null);
    const active: RoiScenario = strategy === 'whole' ? 'whole' : (part && partition === 'yes' ? 'opt' : 'co');

    const cols: { key: RoiScenario; label: string }[] = [
        { key: 'whole', label: 'Whole Unit' },
        { key: 'co', label: 'Co-Living' },
        ...(part ? [{ key: 'opt' as RoiScenario, label: 'Optimized Co-Living' }] : []),
    ];
    const totals: Record<string, [number, number]> = {};
    cols.forEach((c) => { totals[c.key] = scenarioMonthlyRange(roi, c.key, occ); });

    const wholeM = scenarioMonthlyRange(roi, 'whole', occ)[0];
    const t = totals[active];
    const profA: [number, number] = [annual(t[0]), annual(t[1])];

    const renoPkg = active === 'whole' ? null : (active === 'opt' ? pkgById(roi.packages.with_partition) : pkgById(roi.packages.without_partition));
    const diffM: [number, number] = [t[0] - wholeM, t[1] - wholeM];
    const months = renoPkg ? paybackMonths(renoPkg.price, t[0], wholeM) : null;

    const seg = (on: boolean) => `flex-1 px-3 py-2 text-sm font-semibold ${on ? 'bg-campaign text-white' : 'bg-white text-slate-500'}`;
    const featCell = (on: boolean) => (on ? 'bg-rose-50' : '');
    const roiCell = (r: [number, number]) =>
        spa > 0 ? fmtRange(roiPercent(r[0], spa), roiPercent(r[1], spa), (v) => v.toFixed(1) + '%') : '–';

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="fixed bottom-5 right-5 z-40 rounded-full bg-campaign px-5 py-3 text-sm font-bold text-white shadow-lg hover:opacity-90"
            >
                ROI Calculator
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setOpen(false)}>
                    <div className="h-full w-full max-w-md overflow-y-auto bg-white p-5 shadow-xl sm:p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900">ROI Calculator</h2>
                            <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600" aria-label="Close">✕</button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-600">Rental strategy</label>
                                <div className="flex overflow-hidden rounded-lg border border-slate-200">
                                    <button type="button" className={seg(strategy === 'whole')} onClick={() => setStrategy('whole')}>Whole Unit</button>
                                    <button type="button" className={seg(strategy === 'co')} onClick={() => setStrategy('co')}>Co-Living</button>
                                </div>
                            </div>
                            {strategy === 'co' && part && (
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-600">Renovation</label>
                                    <div className="flex overflow-hidden rounded-lg border border-slate-200">
                                        <button type="button" className={seg(partition === 'no')} onClick={() => setPartition('no')}>W/o partition</button>
                                        <button type="button" className={seg(partition === 'yes')} onClick={() => setPartition('yes')}>With partition</button>
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-600">Occupancy</label>
                                <div className="flex overflow-hidden rounded-lg border border-slate-200">
                                    {([['Worst', roi.occupancy_steps.worst], ['Normal', roi.occupancy_steps.normal], ['Best', roi.occupancy_steps.best]] as [string, number][]).map(([lbl, val]) => (
                                        <button key={lbl} type="button" className={seg(occ === val)} onClick={() => setOcc(val)}>{lbl} {val}%</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-600">Purchase price (SPA)</label>
                                <input type="number" value={spa} onChange={(e) => setSpa(Number(e.target.value) || 0)}
                                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                            </div>
                        </div>

                        {/* Profit -> Difference -> Cost emphasis band */}
                        <div className="my-4 rounded-xl border border-slate-200 p-4">
                            <div className="flex flex-wrap items-baseline gap-2">
                                <span className="w-20 text-[10px] font-bold uppercase tracking-wide text-slate-400">Profit</span>
                                <span className="text-2xl font-extrabold text-green-600">{fmtRange(profA[0], profA[1], money)}</span>
                                <span className="text-xs text-slate-400">{fmtRange(t[0], t[1], money)}/mo · per year</span>
                            </div>
                            <div className="mt-2 flex flex-wrap items-baseline gap-2 border-t border-dashed border-slate-200 pt-2">
                                <span className="w-20 text-[10px] font-bold uppercase tracking-wide text-slate-400">Difference</span>
                                {active === 'whole'
                                    ? <span className="text-lg font-extrabold text-slate-400">Baseline</span>
                                    : (<>
                                        <span className="text-lg font-extrabold text-campaign">+{fmtRange(annual(diffM[0]), annual(diffM[1]), money)}</span>
                                        <span className="text-xs text-slate-400">+{fmtRange(diffM[0], diffM[1], money)}/mo vs whole unit</span>
                                    </>)}
                            </div>
                            <div className="mt-2 flex flex-wrap items-baseline gap-2 border-t border-dashed border-slate-200 pt-2">
                                <span className="w-20 text-[10px] font-bold uppercase tracking-wide text-slate-400">Cost</span>
                                {renoPkg
                                    ? (<>
                                        <span className="text-sm font-bold text-slate-900">{money(renoPkg.price)}</span>
                                        <span className="text-xs text-slate-400">{months != null ? `pays back in ${months.toFixed(1)} mo` : 'one-time renovation'}</span>
                                    </>)
                                    : <span className="text-sm font-bold text-slate-400">–</span>}
                            </div>
                        </div>

                        {/* Always-on comparison table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-sm">
                                <thead>
                                    <tr className="text-[11px] uppercase text-slate-400">
                                        <th className="text-left">Condo</th>
                                        {cols.map((c) => <th key={c.key} className={c.key === active ? 'text-campaign' : ''}>{c.label}{c.key === active ? ' ★' : ''}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {roi.rooms.map((rm, i) => (
                                        <tr key={rm.id} className="border-t border-slate-100">
                                            <td className="py-2 text-left text-slate-700">{rm.label}</td>
                                            {cols.map((c) => {
                                                if (c.key === 'whole') {
                                                    return i === 0
                                                        ? <td key={c.key} rowSpan={roi.rooms.length} className={`align-middle text-center font-semibold ${featCell(active === 'whole')}`}>{money(roi.whole_unit.amount)}<div className="text-[10px] font-normal text-slate-400">whole unit</div></td>
                                                        : null;
                                                }
                                                const show = c.key === 'opt' ? true : !rm.partition;
                                                if (!show) return <td key={c.key} className={featCell(c.key === active)}><span className="text-slate-300">–</span></td>;
                                                const [lo, hi] = roomRange(rm, roi.pm_spread);
                                                return <td key={c.key} className={featCell(c.key === active)}>{fmtRange(lo, hi, money)}</td>;
                                            })}
                                        </tr>
                                    ))}
                                    <tr className="border-t-2 border-slate-800 font-extrabold">
                                        <td className="py-2 text-left">Total / month</td>
                                        {cols.map((c) => <td key={c.key} className={featCell(c.key === active)}>{fmtRange(totals[c.key][0], totals[c.key][1], money)}</td>)}
                                    </tr>
                                    <tr className="font-extrabold text-campaign">
                                        <td className="text-left">ROI %</td>
                                        {cols.map((c) => <td key={c.key} className={featCell(c.key === active)}>{roiCell(totals[c.key])}</td>)}
                                    </tr>
                                    <tr className="font-semibold text-slate-500">
                                        <td className="text-left">Annual income</td>
                                        {cols.map((c) => <td key={c.key} className={featCell(c.key === active)}>{fmtRange(annual(totals[c.key][0]), annual(totals[c.key][1]), money)}</td>)}
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {renoPkg && (
                            <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
                                <span className="text-sm font-semibold text-slate-700">{renoPkg.name}</span>
                                <span className="text-sm font-extrabold text-campaign">{money(renoPkg.price)}</span>
                            </div>
                        )}

                        {roi.disclaimers.length > 0 && (
                            <ul className="mt-3 space-y-1 text-[11px] text-slate-400">
                                {roi.disclaimers.map((d, i) => <li key={i}>* {d}</li>)}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default RoiCalculatorDrawer;
