import Profectus from "@/components/Profectus.vue";
import Spacer from "@/components/layout/Spacer.vue";
import { jsx } from "@/features/feature";
import { createResource, trackBest, trackOOMPS, trackTotal } from "@/features/resources/resource";
import { branchedResetPropagation, createTree, GenericTree } from "@/features/trees/tree";
import { globalBus } from "@/game/events";
import { createLayer, GenericLayer, setupLayerModal } from "@/game/layers";
import player, { PlayerData } from "@/game/player";
import { DecimalSource } from "@/lib/break_eternity";
import Decimal, { format, formatTime } from "@/util/bignum";
import { render } from "@/util/vue";
import { computed, toRaw } from "vue";
import a from "./layers/aca/a";
import c from "./layers/aca/c";
import f from "./layers/aca/f";

export const main = createLayer(() => {
    const points = createResource<DecimalSource>(10);
    const best = trackBest(points);
    const total = trackTotal(points);

    const pointGain = computed(() => {
        if (!c.generatorUpgrade.bought.value) return new Decimal(0);
        let gain = new Decimal(3.19);
        if (c.lollipopMultiplierUpgrade.bought.value)
            gain = gain.times(c.lollipopMultiplierEffect.value);
        return gain;
    });
    globalBus.on("update", diff => {
        points.value = Decimal.add(points.value, Decimal.times(pointGain.value, diff));
    });
    const oomps = trackOOMPS(points, pointGain);

    const { openModal, modal } = setupLayerModal(a);

    // Note: Casting as generic tree to avoid recursive type definitions
    const tree = createTree(() => ({
        nodes: [[c.treeNode], [f.treeNode, c.spook]],
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
            }
        ],
        onReset() {
            points.value = toRaw(this.resettingNode.value) === toRaw(c.treeNode) ? 0 : 10;
            best.value = points.value;
            total.value = points.value;
        },
        resetPropagation: branchedResetPropagation
    })) as GenericTree;

    // Note: layers don't _need_ a reference to everything,
    //  but I'd recommend it over trying to remember what does and doesn't need to be included.
    // Officially all you need are anything with persistency or that you want to access elsewhere
    return {
        id: "main",
        name: "Tree",
        links: tree.links,
        display: jsx(() => (
            <>
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
                <div v-show={Decimal.gt(pointGain.value, 0)}>({oomps.value})</div>
                <Spacer />
                <button onClick={openModal}>open achievements</button>
                {render(modal)}
                {render(tree)}
                <Profectus height="200px" style="margin: 10px auto; display: block" />
            </>
        )),
        points,
        best,
        total,
        oomps,
        tree,
        showAchievements: openModal
    };
});

export const getInitialLayers = (
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    player: Partial<PlayerData>
): Array<GenericLayer> => [main, f, c, a];

export const hasWon = computed(() => {
    return Decimal.gt(main.points.value, 25);
});

/* eslint-disable @typescript-eslint/no-unused-vars */
export function fixOldSave(
    oldVersion: string | undefined,
    player: Partial<PlayerData>
    // eslint-disable-next-line @typescript-eslint/no-empty-function
): void {}
/* eslint-enable @typescript-eslint/no-unused-vars */
