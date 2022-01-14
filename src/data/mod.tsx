import { createResource, trackBest, trackOOMPS, trackTotal } from "@/features/resource";
import { createTree, GenericTree } from "@/features/tree";
import { globalBus } from "@/game/events";
import { createLayer, GenericLayer } from "@/game/layers";
import player, { PlayerData } from "@/game/player";
import { DecimalSource } from "@/lib/break_eternity";
import Decimal, { format, formatSmall, formatTime } from "@/util/bignum";
import { computed } from "vue";
import a from "./layers/aca/a";
import c, {
    generatorUpgrade,
    lollipopMultiplierEffect,
    lollipopMultiplierUpgrade
} from "./layers/aca/c";
import f from "./layers/aca/f";

export const points = createResource<DecimalSource>(0);
const best = trackBest(points);
const total = trackTotal(points);
const oomps = trackOOMPS(points);

const pointGain = computed(() => {
    if (!generatorUpgrade.bought) return new Decimal(0);
    let gain = new Decimal(3.19);
    if (lollipopMultiplierUpgrade.bought) gain = gain.times(lollipopMultiplierEffect.value);
    return gain;
});
globalBus.on("update", diff => {
    points.value = Decimal.add(points.value, Decimal.times(pointGain.value, diff));
});

// Note: Casting as generic tree to avoid recursive type definitions
export const tree = createTree({
    nodes: () => [[c.treeNode], [f.treeNode, c.spook]],
    leftSideNodes: [a.treeNode, c.h],
    branches: [
        {
            startNode: f.treeNode,
            endNode: c.treeNode,
            stroke: "blue",
            "stroke-width": "25px",
            style: {
                filter: "blur(5px)"
            }
        },
        { startNode: c.treeNode, endNode: c.g }
    ]
}) as GenericTree;

// Note: layers don't _need_ a reference to everything, but I'd recommend it over trying to remember
// what does and doesn't need to be included. Officially all you need are anything with persistency
export const main = createLayer({
    id: "main",
    name: "Tree",
    links: tree.links,
    display() {
        return (
            <template>
                <div v-if={player.devSpeed === 0}>Game Paused</div>
                <div v-else-if={player.devSpeed && player.devSpeed !== 1}>
                    {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                    Dev Speed: {format(player.devSpeed!)}x
                </div>
                <div v-if={player.offlineTime != undefined}>
                    {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                    Offline Time: {formatTime(player.offlineTime!)}
                </div>
                <div>
                    <span v-if={Decimal.lt(points.value, "1e1000")}>You have </span>
                    <h2>{format(points.value)}</h2>
                    <span v-if={Decimal.lt(points.value, "1e1e6")}> points</span>
                </div>
                <div v-if={Decimal.gt(pointGain.value, 0)}>
                    ({oomps.value === "" ? formatSmall(pointGain.value) : oomps.value}/sec)
                </div>
                <spacer />
                <modal show={false}>
                    <svg style="height: 80vmin; width: 80vmin;">
                        <path d="M 32 222 Q 128 222, 128 0 Q 128 222, 224 222 L 224 224 L 32 224" />

                        <circle cx="64" cy="128" r="64" fill="#8da8b0" />
                        <circle cx="128" cy="64" r="64" fill="#71368a" />
                        <circle cx="192" cy="128" r="64" fill="#fa8508" />
                    </svg>
                </modal>
                <tree {...tree} />
            </template>
        );
    },
    points,
    best,
    total,
    oomps,
    tree
});

export const getInitialLayers = (
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    player: Partial<PlayerData>
): Array<GenericLayer> => [main, f, c, a];

export const hasWon = computed(() => {
    return false;
});

/* eslint-disable @typescript-eslint/no-unused-vars */
export function fixOldSave(
    oldVersion: string | undefined,
    player: Partial<PlayerData>
    // eslint-disable-next-line @typescript-eslint/no-empty-function
): void {}
/* eslint-enable @typescript-eslint/no-unused-vars */
