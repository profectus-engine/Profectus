import Modal from "@/components/system/Modal.vue";
import Spacer from "@/components/system/Spacer.vue";
import { createResource, trackBest, trackOOMPS, trackTotal } from "@/features/resource";
import { createTree, GenericTree } from "@/features/tree";
import { globalBus } from "@/game/events";
import { createLayer, GenericLayer } from "@/game/layers";
import player, { PlayerData } from "@/game/player";
import { DecimalSource } from "@/lib/break_eternity";
import Decimal, { format, formatSmall, formatTime } from "@/util/bignum";
import { render } from "@/util/vue";
import { computed, ref } from "vue";
import a from "./layers/aca/a";
import c from "./layers/aca/c";
import f from "./layers/aca/f";

export const main = createLayer(() => {
    const points = createResource<DecimalSource>(0);
    const best = trackBest(points);
    const total = trackTotal(points);
    const oomps = trackOOMPS(points);
    const showModal = ref(false);

    const pointGain = computed(() => {
        if (!c.value.generatorUpgrade.bought) return new Decimal(0);
        let gain = new Decimal(3.19);
        if (c.value.lollipopMultiplierUpgrade.bought)
            gain = gain.times(c.value.lollipopMultiplierEffect.value);
        return gain;
    });
    globalBus.on("update", diff => {
        points.value = Decimal.add(points.value, Decimal.times(pointGain.value, diff));
    });

    // Note: Casting as generic tree to avoid recursive type definitions
    const tree = createTree({
        nodes: [[c.value.treeNode], [f.value.treeNode, c.value.spook]],
        leftSideNodes: [a.value.treeNode, c.value.h],
        branches: [
            {
                startNode: f.value.treeNode,
                endNode: c.value.treeNode,
                stroke: "blue",
                "stroke-width": "25px",
                style: {
                    filter: "blur(5px)"
                }
            },
            { startNode: c.value.treeNode, endNode: c.value.g }
        ]
    }) as GenericTree;

    // Note: layers don't _need_ a reference to everything,
    //  but I'd recommend it over trying to remember what does and doesn't need to be included.
    // Officially all you need are anything with persistency or that you want to access elsewhere
    return {
        id: "main",
        name: "Tree",
        links: tree.links,
        display: (
            <template>
                <div v-show={player.devSpeed === 0}>Game Paused</div>
                <div v-show={player.devSpeed && player.devSpeed !== 1}>
                    Dev Speed: {format(player.devSpeed || 0)}x
                </div>
                <div v-show={player.offlineTime != undefined}>
                    Offline Time: {formatTime(player.offlineTime || 0)}
                </div>
                <div>
                    <span v-show={Decimal.lt(points.value, "1e1000")}>You have </span>
                    <h2>{format(points.value)}</h2>
                    <span v-show={Decimal.lt(points.value, "1e1e6")}> points</span>
                </div>
                <div v-show={Decimal.gt(pointGain.value, 0)}>
                    ({oomps.value === "" ? formatSmall(pointGain.value) : oomps.value}/sec)
                </div>
                <Spacer />
                <Modal
                    modelValue={showModal.value}
                    onUpdate:modelValue={value => (showModal.value = value)}
                >
                    <svg style="height: 80vmin; width: 80vmin;">
                        <path d="M 32 222 Q 128 222, 128 0 Q 128 222, 224 222 L 224 224 L 32 224" />

                        <circle cx="64" cy="128" r="64" fill="#8da8b0" />
                        <circle cx="128" cy="64" r="64" fill="#71368a" />
                        <circle cx="192" cy="128" r="64" fill="#fa8508" />
                    </svg>
                </Modal>
                {render(tree)}
            </template>
        ),
        points,
        best,
        total,
        oomps,
        tree
    };
});

export const getInitialLayers = (
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    player: Partial<PlayerData>
): Array<GenericLayer> => [main.value, f.value, c.value, a.value];

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
