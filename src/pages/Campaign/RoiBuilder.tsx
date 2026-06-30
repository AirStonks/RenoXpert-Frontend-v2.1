import React from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import type { RoiCalculator, RoiRoom } from '../../types';
import { scenarioMonthlyRange, roiPercent, paybackMonths } from '../../utils/roiCalculator';

export type RoiPackageOption = { id: number; label: string; price: number };

interface Props {
    value: RoiCalculator | null;
    packages: RoiPackageOption[];
    onChange: (next: RoiCalculator) => void;
}

let _uid = 0;
const newRoomId = () => `room_${Date.now()}_${++_uid}`;

const emptyModel = (): RoiCalculator => ({
    enabled: true,
    spa_price: 0,
    unit_facts: {},
    pm_spread: 50,
    occupancy_steps: { worst: 85, normal: 90, best: 100 },
    whole_unit: { amount: 0 },
    rooms: [],
    packages: { without_partition: null, with_partition: null },
    disclaimers: [],
});

const money = (n: number) => 'RM' + Math.round(n).toLocaleString('en-MY');
const fmtRange = (lo: number, hi: number, f: (n: number) => string) =>
    Math.round(lo) === Math.round(hi) ? f(lo) : `${f(lo)} – ${f(hi)}`;

const RoiBuilder: React.FC<Props> = ({ value, packages, onChange }) => {
    if (!value) {
        return (
            <button
                type="button"
                onClick={() => onChange(emptyModel())}
                className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-semibold"
            >
                Enable ROI Calculator
            </button>
        );
    }
    const m = value;
    const patch = (p: Partial<RoiCalculator>) => onChange({ ...m, ...p });
    const patchRoom = (id: string, p: Partial<RoiRoom>) =>
        patch({ rooms: m.rooms.map((r) => (r.id === id ? { ...r, ...p } : r)) });
    const addRoom = () =>
        patch({ rooms: [...m.rooms, { id: newRoomId(), label: 'New room', amount: 600, mode: 'fixed', partition: false }] });
    const delRoom = (id: string) => patch({ rooms: m.rooms.filter((r) => r.id !== id) });
    const moveRoom = (idx: number, dir: -1 | 1) => {
        const j = idx + dir;
        if (j < 0 || j >= m.rooms.length) return;
        const rooms = [...m.rooms];
        [rooms[idx], rooms[j]] = [rooms[j], rooms[idx]];
        patch({ rooms });
    };
    const priceOf = (id: number | null) => (id == null ? 0 : packages.find((p) => p.id === id)?.price ?? 0);

    // preview @100% occupancy
    const hasPart = m.rooms.some((r) => r.partition);
    const whole = scenarioMonthlyRange(m, 'whole', 100);
    const co = scenarioMonthlyRange(m, 'co', 100);
    const opt = scenarioMonthlyRange(m, 'opt', 100);
    const pay = (total: number, reno: number) => {
        const mo = paybackMonths(reno, total, whole[0]);
        return mo == null ? '–' : `${mo.toFixed(1)} mo`;
    };
    const roiCell = (r: readonly [number, number]) =>
        m.spa_price > 0 ? fmtRange(roiPercent(r[0], m.spa_price), roiPercent(r[1], m.spa_price), (v) => v.toFixed(1) + '%') : '–';

    const inputCls = 'border border-gray-300 rounded-md px-2 py-1 text-sm';

    return (
        <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={m.enabled} onChange={(e) => patch({ enabled: e.target.checked })} />
                Calculator enabled
            </label>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <label className="text-xs font-medium text-gray-600">Layout name
                    <input type="text" className={`mt-1 block w-full ${inputCls}`} value={m.unit_facts.name ?? ''}
                        onChange={(e) => patch({ unit_facts: { ...m.unit_facts, name: e.target.value } })} />
                </label>
                <label className="text-xs font-medium text-gray-600">SPA price (RM)
                    <input type="number" className={`mt-1 block w-full ${inputCls}`} value={m.spa_price}
                        onChange={(e) => patch({ spa_price: Number(e.target.value) || 0 })} />
                </label>
                <label className="text-xs font-medium text-gray-600">± spread (RM)
                    <input type="number" className={`mt-1 block w-full ${inputCls}`} value={m.pm_spread}
                        onChange={(e) => patch({ pm_spread: Number(e.target.value) || 0 })} />
                </label>
                <label className="text-xs font-medium text-gray-600">Whole-unit rent (RM/mo)
                    <input type="number" className={`mt-1 block w-full ${inputCls}`} value={m.whole_unit.amount}
                        onChange={(e) => patch({ whole_unit: { amount: Number(e.target.value) || 0 } })} />
                </label>
                <label className="text-xs font-medium text-gray-600">Size
                    <input type="text" className={`mt-1 block w-full ${inputCls}`} value={m.unit_facts.size ?? ''}
                        onChange={(e) => patch({ unit_facts: { ...m.unit_facts, size: e.target.value } })} />
                </label>
                <label className="text-xs font-medium text-gray-600">Beds / baths
                    <input type="text" className={`mt-1 block w-full ${inputCls}`} value={m.unit_facts.beds_baths ?? ''}
                        onChange={(e) => patch({ unit_facts: { ...m.unit_facts, beds_baths: e.target.value } })} />
                </label>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <label className="text-xs font-medium text-gray-600">Occupancy — Worst %
                    <input type="number" className={`mt-1 block w-full ${inputCls}`} value={m.occupancy_steps.worst}
                        onChange={(e) => patch({ occupancy_steps: { ...m.occupancy_steps, worst: Number(e.target.value) || 0 } })} />
                </label>
                <label className="text-xs font-medium text-gray-600">Normal %
                    <input type="number" className={`mt-1 block w-full ${inputCls}`} value={m.occupancy_steps.normal}
                        onChange={(e) => patch({ occupancy_steps: { ...m.occupancy_steps, normal: Number(e.target.value) || 0 } })} />
                </label>
                <label className="text-xs font-medium text-gray-600">Best %
                    <input type="number" className={`mt-1 block w-full ${inputCls}`} value={m.occupancy_steps.best}
                        onChange={(e) => patch({ occupancy_steps: { ...m.occupancy_steps, best: Number(e.target.value) || 0 } })} />
                </label>
            </div>

            <div>
                <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-semibold text-gray-900">Co-Living rooms</h5>
                    <button type="button" onClick={addRoom} className="px-2.5 py-1 bg-blue-600 text-white rounded-md text-xs font-semibold flex items-center gap-1">
                        <Plus className="h-3.5 w-3.5" /> Room
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="text-xs text-gray-500 text-left">
                            <th className="py-1">Room</th><th>Amount</th><th>Mode</th><th>Partition</th><th></th>
                        </tr></thead>
                        <tbody>
                            {m.rooms.map((r, i) => (
                                <tr key={r.id} className="border-t border-gray-100">
                                    <td className="py-1 pr-2"><input type="text" className={`w-40 ${inputCls}`} value={r.label}
                                        onChange={(e) => patchRoom(r.id, { label: e.target.value })} /></td>
                                    <td className="pr-2"><input type="number" className={`w-20 ${inputCls}`} value={r.amount}
                                        onChange={(e) => patchRoom(r.id, { amount: Number(e.target.value) || 0 })} /></td>
                                    <td className="pr-2"><select className={inputCls} value={r.mode}
                                        onChange={(e) => patchRoom(r.id, { mode: e.target.value as 'fixed' | 'pm' })}>
                                        <option value="fixed">fixed</option><option value="pm">±</option></select></td>
                                    <td className="pr-2 text-center"><input type="checkbox" checked={r.partition}
                                        onChange={(e) => patchRoom(r.id, { partition: e.target.checked })} /></td>
                                    <td className="text-right whitespace-nowrap">
                                        <button type="button" onClick={() => moveRoom(i, -1)} className="text-gray-400 px-1" disabled={i === 0}><ArrowUp className="h-3.5 w-3.5 inline" /></button>
                                        <button type="button" onClick={() => moveRoom(i, 1)} className="text-gray-400 px-1" disabled={i === m.rooms.length - 1}><ArrowDown className="h-3.5 w-3.5 inline" /></button>
                                        <button type="button" onClick={() => delRoom(r.id)} className="text-red-500 px-1"><Trash2 className="h-3.5 w-3.5 inline" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="text-xs text-gray-400 mt-1">Mode ± = amount ± spread. Partition rooms only count when the buyer turns Partition on.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-xs font-medium text-gray-600">Package — w/o partition
                    <select className={`mt-1 block w-full ${inputCls}`} value={m.packages.without_partition ?? ''}
                        onChange={(e) => patch({ packages: { ...m.packages, without_partition: e.target.value ? Number(e.target.value) : null } })}>
                        <option value="">— none —</option>
                        {packages.map((p) => <option key={p.id} value={p.id}>{p.label} — {money(p.price)}</option>)}
                    </select>
                </label>
                <label className="text-xs font-medium text-gray-600">Package — with partition
                    <select className={`mt-1 block w-full ${inputCls}`} value={m.packages.with_partition ?? ''}
                        onChange={(e) => patch({ packages: { ...m.packages, with_partition: e.target.value ? Number(e.target.value) : null } })}>
                        <option value="">— none —</option>
                        {packages.map((p) => <option key={p.id} value={p.id}>{p.label} — {money(p.price)}</option>)}
                    </select>
                </label>
            </div>

            <label className="block text-xs font-medium text-gray-600">Disclaimers (one per line)
                <textarea rows={2} className={`mt-1 block w-full ${inputCls}`} value={m.disclaimers.join('\n')}
                    onChange={(e) => patch({ disclaimers: e.target.value.split('\n').filter((s) => s.trim()) })} />
            </label>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">Preview @100% occupancy</h5>
                <table className="w-full text-sm text-right">
                    <thead><tr className="text-xs text-gray-500"><th className="text-left">Scenario</th><th>Whole</th><th>Co-Living</th>{hasPart && <th>Optimized</th>}</tr></thead>
                    <tbody>
                        <tr><td className="text-left font-semibold">Total/mo</td><td>{fmtRange(whole[0], whole[1], money)}</td><td>{fmtRange(co[0], co[1], money)}</td>{hasPart && <td>{fmtRange(opt[0], opt[1], money)}</td>}</tr>
                        <tr className="text-red-600 font-semibold"><td className="text-left">ROI %</td>
                            <td>{roiCell(whole)}</td>
                            <td>{roiCell(co)}</td>
                            {hasPart && <td>{roiCell(opt)}</td>}</tr>
                        <tr className="text-gray-500"><td className="text-left">Payback</td><td>–</td><td>{pay(co[0], priceOf(m.packages.without_partition))}</td>{hasPart && <td>{pay(opt[0], priceOf(m.packages.with_partition))}</td>}</tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RoiBuilder;
