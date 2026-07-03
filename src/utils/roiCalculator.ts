import type { RoiCalculator, RoiRoom } from '../types';

export type RoiRange = [number, number];
export type RoiScenario = 'whole' | 'co' | 'opt';

export function roomRange(room: RoiRoom, spread: number): RoiRange {
    return room.mode === 'pm' ? [room.amount - spread, room.amount + spread] : [room.amount, room.amount];
}

export function hasPartition(model: RoiCalculator): boolean {
    return model.rooms.some((r) => r.partition);
}

function scenarioRooms(model: RoiCalculator, scenario: RoiScenario): RoiRoom[] {
    if (scenario === 'opt') return model.rooms;
    return model.rooms.filter((r) => !r.partition);
}

export function scenarioMonthlyRange(model: RoiCalculator, scenario: RoiScenario, occupancyPct: number): RoiRange {
    // A whole unit is a single tenancy — it is either rented in full or vacant, so a
    // fractional occupancy must NOT partially scale it. Occupancy (individual rooms sitting
    // empty) only applies to the per-room co-living / optimized scenarios.
    if (scenario === 'whole') {
        return [model.whole_unit.amount, model.whole_unit.amount];
    }
    const occ = (occupancyPct || 100) / 100;
    let lo = 0;
    let hi = 0;
    for (const r of scenarioRooms(model, scenario)) {
        const [a, b] = roomRange(r, model.pm_spread);
        lo += a;
        hi += b;
    }
    return [lo * occ, hi * occ];
}

export function roiPercent(monthly: number, spa: number): number {
    return spa > 0 ? (monthly * 12) / spa * 100 : 0;
}

export function annual(monthly: number): number {
    return monthly * 12;
}

export function paybackMonths(renovationPrice: number, selectedMonthly: number, wholeMonthly: number): number | null {
    const uplift = selectedMonthly - wholeMonthly;
    return uplift > 0 ? renovationPrice / uplift : null;
}
