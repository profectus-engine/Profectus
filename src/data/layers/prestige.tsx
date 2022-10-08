/**
 * @module
 * @hidden
 */
import { main } from "data/projEntry";
import { createCumulativeConversion, createPolynomialScaling } from "features/conversion";
import { jsx } from "features/feature";
import { createHotkey } from "features/hotkey";
import { createReset } from "features/reset";
import MainDisplay from "features/resources/MainDisplay.vue";
import { createResource } from "features/resources/resource";
import { addTooltip } from "features/tooltips/tooltip";
import { createResourceTooltip } from "features/trees/tree";
import { BaseLayer, createLayer } from "game/layers";
import type { DecimalSource } from "util/bignum";
import { render } from "util/vue";
import { createLayerTreeNode, createResetButton } from "../common";

const id = "p";
const layer = createLayer(id, function (this: BaseLayer) {
    const name = "Prestige";
    const color = "#4BDC13";
    const points = createResource<DecimalSource>(0, "prestige points");

    const conversion = createCumulativeConversion(() => ({
        scaling: createPolynomialScaling(10, 0.5),
        baseResource: main.points,
        gainResource: points,
        roundUpCost: true
    }));

    const reset = createReset(() => ({
        thingsToReset: (): Record<string, unknown>[] => [layer]
    }));

    const treeNode = createLayerTreeNode(() => ({
        layerID: id,
        color,
        reset
    }));
    addTooltip(treeNode, {
        display: createResourceTooltip(points),
        pinnable: true
    });

    const resetButton = createResetButton(() => ({
        conversion,
        tree: main.tree,
        treeNode
    }));

    const hotkey = createHotkey(() => ({
        description: "Reset for prestige points",
        key: "p",
        onPress: resetButton.onClick
    }));

    return {
        name,
        color,
        points,
        display: jsx(() => (
            <>
                <MainDisplay resource={points} color={color} />
                {render(resetButton)}
            </>
        )),
        treeNode,
        hotkey
    };
});

export default layer;
