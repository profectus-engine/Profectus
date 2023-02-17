// Import Decimal and numberUtils from a different file to globally change which big num library gets used
// This way switching out big number libraries just needs to happen here, not every file that needs big numbers
import type { DecimalSource as RawDecimalSource } from "lib/break_eternity";
import Decimal, * as numberUtils from "util/break_eternity";

export const {
    exponentialFormat,
    commaFormat,
    regularFormat,
    format,
    formatWhole,
    formatTime,
    toPlaces,
    formatSmall,
    invertOOM
} = numberUtils;

export type DecimalSource = RawDecimalSource;

declare global {
    /** Augment the window object so the big num functions can be accessed from the console. */
    interface Window {
        Decimal: typeof Decimal;
        exponentialFormat: (num: DecimalSource, precision: number, mantissa: boolean) => string;
        commaFormat: (num: DecimalSource, precision: number) => string;
        regularFormat: (num: DecimalSource, precision: number) => string;
        format: (num: DecimalSource, precision?: number, small?: boolean) => string;
        formatWhole: (num: DecimalSource) => string;
        formatTime: (s: number) => string;
        toPlaces: (x: DecimalSource, precision: number, maxAccepted: DecimalSource) => string;
        formatSmall: (x: DecimalSource, precision?: number) => string;
        invertOOM: (x: DecimalSource) => Decimal;
    }
}
window.Decimal = Decimal;
window.exponentialFormat = exponentialFormat;
window.commaFormat = commaFormat;
window.regularFormat = regularFormat;
window.format = format;
window.formatWhole = formatWhole;
window.formatTime = formatTime;
window.toPlaces = toPlaces;
window.formatSmall = formatSmall;
window.invertOOM = invertOOM;

export default Decimal;
