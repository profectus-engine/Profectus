/**
 * @module
 * @hidden
 */
import { main } from "data/projEntry";
import { createCumulativeConversion } from "features/conversion";
import { createHotkey } from "features/hotkey";
import { createReset } from "features/reset";
import MainDisplay from "features/resources/MainDisplay.vue";
import { createResource } from "features/resources/resource";
import { createResourceTooltip } from "features/trees/tree";
import { createLayer } from "game/layers";
import type { DecimalSource } from "util/bignum";
import { render } from "util/vue";
import { addTooltip } from "wrappers/tooltips/tooltip";
import { createLayerTreeNode, createResetButton } from "../common";

const id = "p";
const layer = createLayer(id, () => {
    const name = "Prestige";
    const color = "#4BDC13";
    const points = createResource<DecimalSource>(0, "prestige points");

    const conversion = createCumulativeConversion(() => ({
        formula: x => x.div(10).sqrt(),
        baseResource: main.points,
        gainResource: points
    }));

    const reset = createReset(() => ({
        thingsToReset: (): Record<string, unknown>[] => [layer]
    }));

    const treeNode = createLayerTreeNode(() => ({
        layerID: id,
        color,
        reset
    }));
    const tooltip = addTooltip(treeNode, () => ({
        display: createResourceTooltip(points),
        pinnable: true
    }));

    const resetButton = createResetButton(() => ({
        conversion,
        tree: main.tree,
        treeNode
    }));

    const hotkey = createHotkey(() => ({
        description: "Reset for prestige points",
        key: "p",
        onPress: resetButton.onClick!
    }));

    return {
        name,
        color,
        points,
        tooltip,
        display: () => (
            <>
                <MainDisplay resource={points} color={color} />
                {render(resetButton)}
            </>
        ),
        treeNode,
        hotkey
    };
});

export default layer;
