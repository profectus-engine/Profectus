// Import Decimal and numberUtils from a different file to globally change which big num library gets used
// This way switching out big number libraries just needs to happen here, not every file that needs big numbers
import { DecimalSource as RawDecimalSource } from "lib/break_eternity";
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
