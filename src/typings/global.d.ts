import Decimal, { DecimalSource } from "@/util/bignum";
import { App } from "vue";
import { PlayerData } from "./player";

declare global {
    interface Window {
        vue: App;
        save: () => void;
        hardReset: () => void;
        layers: Dictionary<typeof Proxy>;
        player: PlayerData;
        Decimal: typeof Decimal;
        exponentialFormat: (
            num: DecimalSource,
            precision: number,
            mantissa: boolean = true
        ) => string;
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
