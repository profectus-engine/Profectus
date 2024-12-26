import Node from "components/Node.vue";
import Spacer from "components/layout/Spacer.vue";
import { createResource, trackBest, trackOOMPS, trackTotal } from "features/resources/resource";
import { branchedResetPropagation, createTree, Tree } from "features/trees/tree";
import type { Layer } from "game/layers";
import { createLayer } from "game/layers";
import { noPersist } from "game/persistence";
import player, { Player } from "game/player";
import type { DecimalSource } from "util/bignum";
import Decimal, { format, formatTime } from "util/bignum";
import { render } from "util/vue";
import { computed, toRaw } from "vue";
import prestige from "./layers/prestige";

/**
 * @hidden
 */
export const main = createLayer("main", layer => {
    const points = createResource<DecimalSource>(10);
    const best = trackBest(points);
    const total = trackTotal(points);

    const pointGain = computed(() => {
        // eslint-disable-next-line prefer-const
        let gain = new Decimal(1);
        return gain;
    });
    layer.on("update", diff => {
        points.value = Decimal.add(points.value, Decimal.times(pointGain.value, diff));
    });
    const oomps = trackOOMPS(points, pointGain);

    // Note: Casting as generic tree to avoid recursive type definitions
    const tree = createTree(() => ({
        nodes: noPersist([[prestige.treeNode]]),
        branches: [],
        onReset() {
            points.value = toRaw(tree.resettingNode.value) === toRaw(prestige.treeNode) ? 0 : 10;
            best.value = points.value;
            total.value = points.value;
        },
        resetPropagation: branchedResetPropagation
    })) as Tree;

    // Note: layers don't _need_ a reference to everything,
    //  but I'd recommend it over trying to remember what does and doesn't need to be included.
    // Officially all you need are anything with persistency or that you want to access elsewhere
    return {
        name: "Tree",
        links: tree.links,
        display: () => (
            <>
                {player.devSpeed === 0 ? (
                    <div>
                        Game Paused
                        <Node id="paused" />
                    </div>
                ) : null}
                {player.devSpeed != null && player.devSpeed !== 0 && player.devSpeed !== 1 ? (
                    <div>
                        Dev Speed: {format(player.devSpeed)}x
                        <Node id="devspeed" />
                    </div>
                ) : null}
                {player.offlineTime != null && player.offlineTime !== 0 ? (
                    <div>
                        Offline Time: {formatTime(player.offlineTime)}
                        <Node id="offline" />
                    </div>
                ) : null}
                <div>
                    {Decimal.lt(points.value, "1e1000") ? <span>You have </span> : null}
                    <h2>{format(points.value)}</h2>
                    {Decimal.lt(points.value, "1e1e6") ? <span> points</span> : null}
                </div>
                {Decimal.gt(pointGain.value, 0) ? (
                    <div>
                        ({oomps.value})
                        <Node id="oomps" />
                    </div>
                ) : null}
                <Spacer />
                {render(tree)}
            </>
        ),
        points,
        best,
        total,
        oomps,
        tree
    };
});

/**
 * Given a player save data object being loaded, return a list of layers that should currently be enabled.
 * If your project does not use dynamic layers, this should just return all layers.
 */
export const getInitialLayers = (
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    player: Partial<Player>
): Array<Layer> => [main, prestige];

/**
 * A computed ref whose value is true whenever the game is over.
 */
export const hasWon = computed(() => {
    return false;
});

/**
 * Given a player save data object being loaded with a different version, update the save data object to match the structure of the current version.
 * @param oldVersion The version of the save being loaded in
 * @param player The save data being loaded in
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
export function fixOldSave(
    oldVersion: string | undefined,
    player: Partial<Player>
    // eslint-disable-next-line @typescript-eslint/no-empty-function
): void {}
/* eslint-enable @typescript-eslint/no-unused-vars */
