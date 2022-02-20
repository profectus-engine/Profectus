import MainDisplay from "@/components/features/MainDisplay.vue";
import { createLayerTreeNode, createResetButton } from "@/data/common";
import { main } from "@/data/mod";
import { createClickable } from "@/features/clickable";
import { createExponentialScaling, createIndependentConversion } from "@/features/conversion";
import { persistent } from "@/features/feature";
import { createInfobox } from "@/features/infobox";
import { createReset } from "@/features/reset";
import { createResource, displayResource } from "@/features/resource";
import { createLayer, getLayer } from "@/game/layers";
import Decimal, { DecimalSource, formatWhole } from "@/util/bignum";
import { render } from "@/util/vue";
import c from "./c";

const layer = createLayer(() => {
    const id = "f";
    const color = "#FE0102";
    const name = "Farms";
    const points = createResource<DecimalSource>(0, "farm points");
    const boop = persistent<boolean>(false);

    const coolInfo = createInfobox({
        title: "Lore",
        titleStyle: { color: "#FE0000" },
        display: "DEEP LORE!",
        bodyStyle: { backgroundColor: "#0000EE" }
    });

    const clickableState = persistent<string>("Start");
    const clickable = createClickable({
        display: {
            title: "Clicky clicky!",
            description() {
                return "Current state:<br>" + clickableState.value;
            }
        },
        initialState: "Start",
        canClick() {
            return clickableState.value !== "Borkened...";
        },
        onClick() {
            switch (clickableState.value) {
                case "Start":
                    clickableState.value = "A new state!";
                    break;
                case "A new state!":
                    clickableState.value = "Keep going!";
                    break;
                case "Keep going!":
                    clickableState.value = "Maybe that's a bit too far...";
                    break;
                case "Maybe that's a bit too far...":
                    //makeParticles(coolParticle, 4)
                    clickableState.value = "Borkened...";
                    break;
                default:
                    clickableState.value = "Start";
                    break;
            }
        },
        onHold() {
            console.log("Clickkkkk...");
        },
        style() {
            switch (clickableState.value) {
                case "Start":
                    return { "background-color": "green" };
                case "A new state!":
                    return { "background-color": "yellow" };
                case "Keep going!":
                    return { "background-color": "orange" };
                case "Maybe that's a bit too far...":
                    return { "background-color": "red" };
                default:
                    return {};
            }
        }
    });

    const resetClickable = createClickable({
        onClick() {
            if (clickableState.value == "Borkened...") {
                clickableState.value = "Start";
            }
        },
        display() {
            return clickableState.value == "Borkened..." ? "Fix the clickable!" : "Does nothing";
        }
    });

    const reset = createReset({
        thingsToReset: () => [getLayer("f")]
    });

    const conversion = createIndependentConversion({
        scaling: createExponentialScaling(10, 3, 0.5),
        baseResource: main.value.points,
        gainResource: points,
        modifyGainAmount: gain => Decimal.times(gain, c.value.otherThingy.value)
    });

    const treeNode = createLayerTreeNode({
        layerID: id,
        color,
        reset,
        tooltip() {
            if (treeNode.canClick.value) {
                return `${displayResource(points)} ${points.displayName}`;
            }
            return `This weird farmer dinosaur will only see you if you have at least 10 points. You only have ${displayResource(
                main.value.points
            )}`;
        },
        canClick() {
            return Decimal.gte(main.value.points.value, 10);
        }
    });

    const resetButton = createResetButton({
        conversion,
        tree: main.value.tree,
        treeNode,
        display() {
            if (this.conversion.buyMax) {
                return (
                    <span>
                        Hi! I'm a <u>weird dinosaur</u> and I'll give you{" "}
                        <b>{formatWhole(this.conversion.currentGain.value)}</b> Farm Points in
                        exchange for all of your points and lollipops! (You'll get another one at{" "}
                        {formatWhole(this.conversion.nextAt.value)} points)
                    </span>
                );
            } else {
                return (
                    <span>
                        Hi! I'm a <u>weird dinosaur</u> and I'll give you a Farm Point in exchange
                        for all of your points and lollipops! (At least{" "}
                        {formatWhole(this.conversion.nextAt.value)} points)
                    </span>
                );
            }
        }
    });

    const tab = (): JSX.Element => (
        <template>
            {render(coolInfo)}
            <MainDisplay resource={points} color={color} />
            {render(resetButton)}
            <div>You have {formatWhole(conversion.baseResource.value)} points</div>
            <div>
                <br />
                <img src="https://images.beano.com/store/24ab3094eb95e5373bca1ccd6f330d4406db8d1f517fc4170b32e146f80d?auto=compress%2Cformat&dpr=1&w=390" />
                <div>Bork Bork!</div>
            </div>
            {render(clickable)}
        </template>
    );

    return {
        id,
        color,
        name,
        points,
        boop,
        coolInfo,
        clickable,
        clickableState,
        resetClickable,
        reset,
        conversion,
        treeNode,
        resetButton,
        display: tab
    };
});

export default layer;