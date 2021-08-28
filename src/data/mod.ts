import player from "@/game/player";
import { RawLayer } from "@/typings/layer";
import { PlayerData } from "@/typings/player";
import Decimal from "@/util/bignum";
import { computed } from "vue";
import main from "./layers/main";

export const getInitialLayers = (
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    playerData: Partial<PlayerData>
): Array<RawLayer> => [main];

export function getStartingData(): Record<string, unknown> {
    return {
        points: new Decimal(10),
        day: new Decimal(1),
        lastDayBedMade: new Decimal(0),
        lastDayBrushed: new Decimal(0),
        devStep: 0,
        moneyRequests: new Decimal(0)
    };
}

export const hasWon = computed(() => {
    return (player.devSpeed as number) >= 61;
});

export const pointGain = computed(() => {
    return new Decimal(0);
});

/* eslint-disable @typescript-eslint/no-unused-vars */
// eslint-disable-next-line @typescript-eslint/no-empty-function
export function update(delta: Decimal): void {}
/* eslint-enable @typescript-eslint/no-unused-vars */

/* eslint-disable @typescript-eslint/no-unused-vars */
export function fixOldSave(
    oldVersion: string | undefined,
    playerData: Partial<PlayerData>
    // eslint-disable-next-line @typescript-eslint/no-empty-function
): void {}
/* eslint-enable @typescript-eslint/no-unused-vars */
