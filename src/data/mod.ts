import { layers } from "@/game/layers";
import player from "@/game/player";
import { RawLayer } from "@/typings/layer";
import { PlayerData } from "@/typings/player";
import Decimal from "@/util/bignum";
import {
    getBuyableAmount,
    hasMilestone,
    hasUpgrade,
    inChallenge,
    upgradeEffect
} from "@/util/features";
import { computed } from "vue";
import a from "./layers/aca/a";
import c from "./layers/aca/c";
import f from "./layers/aca/f";
import demoLayer from "./layers/demo";
import demoInfinityLayer from "./layers/demo-infinity";

// Import initial layers

const g = {
    id: "g",
    symbol: "TH",
    branches: ["c"],
    color: "#6d3678",
    shown: true,
    canClick() {
        return player.points.gte(10);
    },
    tooltip: "Thanos your points",
    click() {
        player.points = player.points.div(2);
        console.log(this.layer);
    }
} as RawLayer;
const h = {
    id: "h",
    branches: [
        "g",
        () => ({
            target: "flatBoi",
            featureType: "bar",
            endOffset: {
                x:
                    -50 +
                    100 *
                        (layers.c.bars!.data.flatBoi.progress instanceof Number
                            ? (layers.c.bars!.data.flatBoi.progress as number)
                            : (layers.c.bars!.data.flatBoi.progress as Decimal).toNumber())
            }
        })
    ],
    tooltip() {
        return "Restore your points to {{ player.layers.c.otherThingy }}";
    },
    row: "side",
    position: 3,
    canClick() {
        return player.points.lt(player.layers.c.otherThingy as Decimal);
    },
    click() {
        player.points = new Decimal(player.layers.c.otherThingy as Decimal);
    }
} as RawLayer;
const spook = {
    id: "spook",
    row: 1,
    layerShown: "ghost"
} as RawLayer;

const main = {
    id: "main",
    display: `
		<div v-if="player.devSpeed === 0">Game Paused</div>
		<div v-else-if="player.devSpeed && player.devSpeed !== 1">Dev Speed: {{ format(player.devSpeed) }}x</div>
		<div v-if="player.offTime != undefined">Offline Time: {{ formatTime(player.offTime.remain) }}</div>
		<div>
			<span v-if="player.points.lt('1e1000')">You have </span>
			<h2>{{ format(player.points) }}</h2>
			<span v-if="player.points.lt('1e1e6')"> points</span>
		</div>
		<div v-if="Decimal.gt(pointGain, 0)">
			({{ state.oompsMag != 0 ? format(state.oomps) + " OOM" + (state.oompsMag < 0 ? "^OOM" : state.oompsMag > 1 ? "^" + state.oompsMag : "") + "s" : formatSmall(pointGain) }}/sec)
		</div>
		<spacer />
        <modal :show="false">
            <svg style="height: 80vmin; width: 80vmin;">
                <path d="M 32 222 Q 128 222, 128 0 Q 128 222, 224 222 L 224 224 L 32 224"/>

                <circle cx="64" cy="128" r="64" fill="#8da8b0"/>
                <circle cx="128" cy="64" r="64" fill="#71368a"/>
                <circle cx="192" cy="128" r="64" fill="#fa8508"/>
            </svg>
        </modal>
		<tree :append="true" />`,
    name: "Tree"
} as RawLayer;

export const getInitialLayers = (
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    playerData: Partial<PlayerData>
): Array<RawLayer> => [main, f, c, a, g, h, spook, demoLayer, demoInfinityLayer];

export function getStartingData(): Record<string, unknown> {
    return {
        points: new Decimal(10)
    };
}

export const hasWon = computed(() => {
    return false;
});

export const pointGain = computed(() => {
    if (!hasUpgrade("c", 11)) return new Decimal(0);
    let gain = new Decimal(3.19);
    if (hasUpgrade("c", 12)) gain = gain.times(upgradeEffect("c", 12) as Decimal);
    if (hasMilestone("p", 0)) gain = gain.plus(0.01);
    if (hasMilestone("p", 4)) {
        if (hasUpgrade("p", 12)) gain = gain.plus(0.1);
        if (hasUpgrade("p", 13)) gain = gain.plus(0.1);
        if (hasUpgrade("p", 14)) gain = gain.plus(0.1);
        if (hasUpgrade("p", 21)) gain = gain.plus(0.1);
        if (hasUpgrade("p", 22)) gain = gain.plus(0.1);
        if (hasUpgrade("p", 23)) gain = gain.plus(0.1);
        if (hasUpgrade("p", 31)) gain = gain.plus(0.1);
        if (hasUpgrade("p", 32)) gain = gain.plus(0.1);
        if (hasUpgrade("p", 33)) gain = gain.plus(0.1);
    }
    if (hasUpgrade("p", 11))
        gain = gain.plus(
            hasUpgrade("p", 34)
                ? new Decimal(1).plus(layers.p.upgrades!.data[34].effect as Decimal)
                : 1
        );
    if (hasUpgrade("p", 12))
        gain = gain.times(
            hasUpgrade("p", 34)
                ? new Decimal(1).plus(layers.p.upgrades!.data[34].effect as Decimal)
                : 1
        );
    if (hasUpgrade("p", 13))
        gain = gain.pow(
            hasUpgrade("p", 34)
                ? new Decimal(1).plus(layers.p.upgrades!.data[34].effect as Decimal)
                : 1
        );
    if (hasUpgrade("p", 14))
        gain = gain.tetrate(
            hasUpgrade("p", 34)
                ? new Decimal(1).plus(layers.p.upgrades!.data[34].effect as Decimal).toNumber()
                : 1
        );

    if (hasUpgrade("p", 71)) gain = gain.plus(1.1);
    if (hasUpgrade("p", 72)) gain = gain.times(1.1);
    if (hasUpgrade("p", 73)) gain = gain.pow(1.1);
    if (hasUpgrade("p", 74)) gain = gain.tetrate(1.1);
    if (hasMilestone("p", 5) && !inChallenge("p", 22)) {
        const asdf = hasUpgrade("p", 132)
            ? (player.layers.p.gp as Decimal).plus(1).pow(new Decimal(1).div(2))
            : hasUpgrade("p", 101)
            ? (player.layers.p.gp as Decimal).plus(1).pow(new Decimal(1).div(3))
            : hasUpgrade("p", 93)
            ? (player.layers.p.gp as Decimal).plus(1).pow(0.2)
            : (player.layers.p.gp as Decimal).plus(1).log10();
        gain = gain.plus(asdf);
        if (hasUpgrade("p", 213)) gain = gain.mul(asdf.plus(1));
    }
    if (hasUpgrade("p", 104)) gain = gain.times(player.layers.p.points.plus(1).pow(0.5));
    if (hasUpgrade("p", 142)) gain = gain.times(5);
    if (player.layers.i.unlocked)
        gain = gain.times(player.layers.i.points.plus(1).pow(hasUpgrade("p", 235) ? 6.942 : 1));
    if (inChallenge("p", 11) || inChallenge("p", 21))
        gain = new Decimal(10).pow(gain.log10().pow(0.75));
    if (inChallenge("p", 12) || inChallenge("p", 21))
        gain = gain.pow(new Decimal(1).sub(new Decimal(1).div(getBuyableAmount("p", 11)!.plus(1))));
    if (hasUpgrade("p", 211)) gain = gain.times(getBuyableAmount("p", 21)!.plus(1));
    if (hasMilestone("p", 13)) gain = gain.times(layers.p.buyables!.data[31].effect as Decimal);
    if (hasMilestone("p", 13)) gain = gain.pow(layers.p.buyables!.data[42].effect as Decimal);
    return gain;
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
