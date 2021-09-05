import Decimal from "@/lib/break_eternity";

// Save data that doesn't persist between reloads
export interface Transient {
    lastTenTicks: number[];
    hasNaN: bool;
    NaNPath?: string[];
    NaNReceiver?: Record<string, unknown>;
    saveToExport: string;
    lastPoints: Decimal;
    oomps: Decimal;
    oompsMag: number;
}
