import MainDisplay from "@/components/features/MainDisplay.vue";
import Slider from "@/components/fields/Slider.vue";
import Text from "@/components/fields/Text.vue";
import Toggle from "@/components/fields/Toggle.vue";
import Column from "@/components/system/Column.vue";
import Resource from "@/components/system/Resource.vue";
import Row from "@/components/system/Row.vue";
import Spacer from "@/components/system/Spacer.vue";
import Sticky from "@/components/system/Sticky.vue";
import VerticalRule from "@/components/system/VerticalRule.vue";
import { createLayerTreeNode, createResetButton } from "@/data/common";
import { points as mainPoints, tree as mainTree } from "@/data/mod";
import { createBar, Direction } from "@/features/bar";
import { createBuyable } from "@/features/buyable";
import { createChallenge } from "@/features/challenge";
import { createClickable } from "@/features/clickable";
import { createCumulativeConversion, createExponentialScaling } from "@/features/conversion";
import { persistent, showIf } from "@/features/feature";
import { createHotkey } from "@/features/hotkey";
import { createInfobox } from "@/features/infobox";
import { createMilestone } from "@/features/milestone";
import { createReset } from "@/features/reset";
import { addSoftcap, createResource, displayResource, trackBest } from "@/features/resource";
import { createTab } from "@/features/tab";
import { createTabButton, createTabFamily } from "@/features/tabFamily";
import { createTree, createTreeNode } from "@/features/tree";
import { createUpgrade } from "@/features/upgrade";
import { createLayer, getLayer } from "@/game/layers";
import { DecimalSource } from "@/lib/break_eternity";
import Decimal, { format, formatWhole } from "@/util/bignum";
import { render, renderCol, renderRow } from "@/util/vue";
import { computed } from "vue";
import { boop, tab as fTab, treeNode as fNode } from "./f";

const c = getLayer("c");

const id = "c";
const color = "#4BDC13";
const name = "Candies";
const points = addSoftcap(createResource<DecimalSource>(0, "lollipops"), 1e100, 0.5);
const best = trackBest(points);
const beep = persistent<boolean>(false);
const thingy = persistent<string>("pointy");
export const otherThingy = persistent<number>(10);
const spentOnBuyables = persistent(new Decimal(10));

const waffleBoost = computed(() => Decimal.pow(points.value, 0.2));
const icecreamCap = computed(() => Decimal.times(points.value, 10));

const coolInfo = createInfobox({
    title: "Lore",
    titleStyle: { color: "#FE0000" },
    display: "DEEP LORE!",
    bodyStyle: { backgroundColor: "#0000EE" }
});

const lollipopMilestone3 = createMilestone({
    shouldEarn() {
        return Decimal.gte(best.value, 3);
    },
    display: {
        requirement: "3 Lollipops",
        effectDisplay: "Unlock the next milestone"
    }
});
const lollipopMilestone4 = createMilestone({
    visibility() {
        return showIf(lollipopMilestone3.earned.value);
    },
    shouldEarn() {
        return Decimal.gte(best.value, 4);
    },
    display: {
        requirement: "4 Lollipops",
        effectDisplay: "You can toggle beep and boop (which do nothing)",
        optionsDisplay() {
            return (
                <div style="display: flex; justify-content: center">
                    <Toggle title="beep" v-model={beep} />
                    <Toggle title="boop" v-model={boop} />
                </div>
            );
        }
    },
    style() {
        if (this.earned) {
            return { backgroundColor: "#1111DD" };
        }
        return {};
    }
});
const lollipopMilestones = [lollipopMilestone3, lollipopMilestone4];

const funChallenge = createChallenge({
    title: "Fun",
    completionLimit: 3,
    display: {
        description() {
            return `Makes the game 0% harder<br>${this.completions}/${this.completionLimit} completions`;
        },
        goal: "Have 20 points I guess",
        reward: "Says hi",
        effectDisplay() {
            return format(funEffect.value) + "x";
        }
    },
    visibility() {
        return showIf(Decimal.gt(best.value, 0));
    },
    goal: 20,
    resource: () => mainPoints,
    onComplete() {
        console.log("hiii");
    },
    onEnter() {
        console.log("So challenging");
    },
    onExit() {
        console.log("Sweet freedom!");
    },
    style: {
        height: "200px"
    }
});
const funEffect = computed(() => Decimal.add(points.value, 1).tetrate(0.02));

export const generatorUpgrade = createUpgrade({
    title: "Generator of Genericness",
    display: "Gain 1 point every second",
    cost: 1,
    resource: points
});
export const lollipopMultiplierUpgrade = createUpgrade({
    display: () =>
        `Point generation is faster based on your unspent Lollipops<br>Currently: ${format(
            lollipopMultiplierEffect.value
        )}x`,
    cost: 1,
    resource: points,
    visibility: () => showIf(generatorUpgrade.bought.value)
});
export const lollipopMultiplierEffect = computed(() => {
    let ret = Decimal.add(points.value, 1).pow(0.5);
    if (ret.gte("1e20000000")) ret = ret.sqrt().times("1e10000000");
    return ret;
});
export const unlockIlluminatiUpgrade = createUpgrade({
    visibility() {
        return showIf(lollipopMultiplierUpgrade.bought.value);
    },
    canPurchase() {
        return Decimal.lt(mainPoints.value, 7);
    },
    onPurchase() {
        mainPoints.value = Decimal.add(mainPoints.value, 7);
    },
    display: "Only buyable with less than 7 points, and gives you 7 more. Unlocks a secret subtab.",
    style() {
        if (this.bought) {
            return { backgroundColor: "#1111dd" };
        }
        if (!this.canAfford) {
            return { backgroundColor: "#dd1111" };
        }
        return {};
    }
});
const upgrades = [generatorUpgrade, lollipopMultiplierUpgrade, unlockIlluminatiUpgrade];

const exhancers = createBuyable({
    resource: points,
    cost() {
        let x = new Decimal(this.amount.value);
        if (x.gte(25)) {
            x = x.pow(2).div(25);
        }
        const cost = Decimal.pow(2, x.pow(1.5));
        return cost.floor();
    },
    display: {
        title: "Exhancers",
        description() {
            return `Adds ${format(
                exhancersFirstEffect.value
            )} things and multiplies stuff by ${format(exhancersSecondEffect.value)}.`;
        }
    },
    onPurchase(cost) {
        spentOnBuyables.value = Decimal.add(spentOnBuyables.value, cost);
    },
    style: { height: "222px" },
    purchaseLimit: 4
});
const exhancersFirstEffect = computed(() => {
    if (Decimal.gte(exhancers.amount.value, 0)) {
        return Decimal.pow(25, Decimal.pow(exhancers.amount.value, 1.1));
    }
    return Decimal.pow(1 / 25, Decimal.times(exhancers.amount.value, -1).pow(1.1));
});
const exhancersSecondEffect = computed(() => {
    if (Decimal.gte(exhancers.amount.value, 0)) {
        return Decimal.pow(25, Decimal.pow(exhancers.amount.value, 1.1));
    }
    return Decimal.pow(1 / 25, Decimal.times(exhancers.amount.value, -1).pow(1.1));
});
const confirmRespec = persistent<boolean>(false);
const respecBuyables = createClickable({
    small: true,
    display: "Respec Thingies",
    onClick() {
        if (
            confirmRespec.value &&
            !confirm("Are you sure? Respeccing these doesn't accomplish much.")
        ) {
            return;
        }

        points.value = Decimal.add(points.value, spentOnBuyables.value);
        mainTree.reset(treeNode);
    }
});
const sellExhancer = createClickable({
    small: true,
    display: "Sell One",
    onClick() {
        if (Decimal.lte(exhancers.amount.value, 0)) {
            return;
        }
        exhancers.amount.value = Decimal.sub(exhancers.amount.value, 1);
        points.value = Decimal.add(points.value, exhancers.cost.value);
    }
});
const buyablesDisplay = (
    <Column>
        <Row>
            <Toggle title="Confirm" v-model={confirmRespec} />
            {render(respecBuyables)}
        </Row>
        {render(exhancers)}
        {render(sellExhancer)}
    </Column>
);

const longBoi = createBar({
    fillStyle: { backgroundColor: "#FFFFFF" },
    baseStyle: { backgroundColor: "#696969" },
    textStyle: { color: "#04e050" },
    direction: Direction.Right,
    width: 300,
    height: 30,
    progress() {
        return Decimal.add(mainPoints.value, 1).log(10).div(10).toNumber();
    },
    display() {
        return format(mainPoints.value) + " / 1e10 points";
    }
});
const tallBoi = createBar({
    fillStyle: { backgroundColor: "#4BEC13" },
    baseStyle: { backgroundColor: "#000000" },
    textStyle: { textShadow: "0px 0px 2px #000000" },
    borderStyle: { borderWidth: "7px" },
    direction: Direction.Up,
    width: 50,
    height: 200,
    progress() {
        return Decimal.div(mainPoints.value, 100);
    },
    display() {
        return formatWhole(Decimal.div(mainPoints.value, 1).min(100)) + "%";
    }
});
const flatBoi = createBar({
    fillStyle: { backgroundColor: "#FE0102" },
    baseStyle: { backgroundColor: "#222222" },
    textStyle: { textShadow: "0px 0px 2px #000000" },
    direction: Direction.Up,
    width: 100,
    height: 30,
    progress() {
        return Decimal.div(points.value, 50);
    }
});

const conversion = createCumulativeConversion({
    scaling: createExponentialScaling(10, 5, 0.5),
    baseResource: mainPoints,
    gainResource: points,
    roundUpCost: true
});

const reset = createReset({
    thingsToReset: () => [c()]
});

const hotkeys = [
    createHotkey({
        key: "c",
        description: "reset for lollipops or whatever",
        onPress() {
            if (resetButton.canClick) {
                reset.reset();
            }
        }
    }),
    createHotkey({
        key: "ctrl+c",
        description: "respec things",
        onPress() {
            respecBuyables.onClick();
        }
    })
];

export const treeNode = createLayerTreeNode({
    layerID: id,
    color,
    reset,
    mark: "https://unsoftcapped2.github.io/The-Modding-Tree-2/discord.png",
    tooltip() {
        let tooltip = displayResource(points);
        if (Decimal.gt(exhancers.amount.value, 0)) {
            tooltip += `<br><i><br><br><br>${formatWhole(exhancers.amount.value)} Exhancers</i>`;
        }
        return tooltip;
    },
    style: {
        color: "#3325CC",
        textDecoration: "underline"
    }
});

const resetButton = createResetButton({
    conversion,
    tree: mainTree,
    treeNode,
    style: {
        color: "#AA66AA"
    },
    resetDescription: "Melt your points into "
});

export const g = createTreeNode({
    display: "TH",
    color: "#6d3678",
    canClick() {
        return Decimal.gte(points.value, 10);
    },
    tooltip: "Thanos your points",
    onClick() {
        points.value = Decimal.div(points.value, 2);
        console.log("Thanos'd");
    },
    glowColor() {
        if (Decimal.eq(exhancers.amount.value, 1)) {
            return "orange";
        }
        return "";
    }
});
export const h = createTreeNode({
    id: "h",
    branches: [
        "g",
        () => ({
            target: "flatBoi",
            featureType: "bar",
            endOffset: {
                x: -50 + 100 * flatBoi.progress.value.toNumber()
            }
        })
    ],
    tooltip() {
        return `Restore your points to ${format(otherThingy.value)}`;
    },
    canClick() {
        return Decimal.lt(mainPoints.value, otherThingy.value);
    },
    onClick() {
        mainPoints.value = otherThingy.value;
    }
});
export const spook = createTreeNode({});
const tree = createTree({
    nodes() {
        return [
            [fNode, treeNode],
            [g, spook, h]
        ];
    },
    branches: [
        {
            startNode: fNode,
            endNode: treeNode,
            style: {
                strokeWidth: "25px",
                stroke: "blue",
                filter: "blur(5px)"
            }
        },
        { startNode: treeNode, endNode: g },
        { startNode: g, endNode: h }
    ]
});

const illuminatiTabs = createTabFamily({
    tabs: {
        first: createTabButton({
            tab: (
                <template>
                    {renderRow(upgrades)}
                    <div>confirmed</div>
                </template>
            ),
            display: "first"
        }),
        second: createTabButton({
            tab: fTab,
            display: "second"
        })
    },
    style: {
        width: "660px",
        height: "370px",
        backgroundColor: "brown",
        "--background": "brown",
        border: "solid white",
        margin: "auto"
    }
});

const tabs = createTabFamily({
    tabs: {
        mainTab: createTabButton({
            tab: createTab({
                display() {
                    return (
                        <template>
                            <MainDisplay
                                resource={points}
                                color={color}
                                effectDisplay={`which are boosting waffles by ${format(
                                    waffleBoost.value
                                )} and increasing the Ice Cream cap by ${format(
                                    icecreamCap.value
                                )}`}
                            />
                            <Sticky>{render(resetButton)}</Sticky>
                            <Resource resource={points} color={color} />
                            <Spacer height="5px" />
                            <button onClick={() => console.log("yeet")}>'HI'</button>
                            <div>Name your points!</div>
                            <Text v-model={thingy} />
                            <Sticky style="color: red; font-size: 32px; font-family: Comic Sans MS;">
                                I have {displayResource(mainPoints)}!
                            </Sticky>
                            <hr />
                            {renderCol(lollipopMilestones)}
                            <Spacer />
                            {renderRow(upgrades)}
                            {render(funChallenge)}
                        </template>
                    );
                },
                style: {
                    backgroundColor: "#3325CC"
                }
            }),
            display: "main tab",
            glowColor() {
                if (
                    generatorUpgrade.canPurchase.value ||
                    lollipopMultiplierUpgrade.canPurchase.value ||
                    unlockIlluminatiUpgrade.canPurchase.value ||
                    funChallenge.canComplete.value
                ) {
                    return "blue";
                }
                return "";
            },
            style: { color: "orange" }
        }),
        thingies: createTabButton({
            tab: createTab({
                glowColor: "white",
                style() {
                    return { backgroundColor: "#222222", "--background": "#222222" };
                },
                display() {
                    return (
                        <template>
                            {buyablesDisplay}
                            <Spacer />
                            <Row style="width: 600px; height: 350px; background-color: green; border-style: solid;">
                                <Toggle v-model={beep} />
                                <Spacer width="30px" height="10px" />
                                <div>Beep</div>
                                <Spacer />
                                <VerticalRule height="200px" />
                            </Row>
                            <Spacer />
                            <img src="https://unsoftcapped2.github.io/The-Modding-Tree-2/discord.png" />
                        </template>
                    );
                }
            }),
            display: "thingies",
            style: { borderColor: "orange" }
        }),
        jail: createTabButton({
            tab: createTab({
                display() {
                    return (
                        <template>
                            {render(coolInfo)}
                            {render(longBoi)}
                            <Spacer />
                            <Row>
                                <Column style="background-color: #555555; padding: 15px">
                                    <div style="color: teal">Sugar level:</div>
                                    <Spacer />
                                    {render(tallBoi)}
                                </Column>
                                <Spacer />
                                <Column>
                                    <div>idk</div>
                                    <Spacer width="0" height="50px" />
                                    {render(flatBoi)}
                                </Column>
                            </Row>
                            <Spacer />
                            <div>It's jail because "bars"! So funny! Ha ha!</div>
                            {render(tree)}
                        </template>
                    );
                },
                style: {
                    backgroundColor: "#3325CC"
                }
            }),
            display: "jail"
        }),
        illuminati: createTabButton({
            tab: createTab({
                display() {
                    return (
                        <template>
                            <h1> C O N F I R M E D </h1>
                            <Spacer />
                            {render(illuminatiTabs)}
                            <div>Adjust how many points H gives you!</div>
                            <Slider v-model={otherThingy} min={1} max={30} />
                        </template>
                    );
                },
                style: {
                    backgroundColor: "#3325CC"
                }
            }),
            visibility() {
                return showIf(unlockIlluminatiUpgrade.bought.value);
            },
            display: "illuminati"
        })
    }
});

const layer = createLayer({
    id,
    color,
    name,
    links: tree.links,
    points,
    beep,
    thingy,
    otherThingy,
    spentOnBuyables,
    waffleBoost,
    icecreamCap,
    coolInfo,
    lollipopMilestones,
    funChallenge,
    funEffect,
    generatorUpgrade,
    lollipopMultiplierUpgrade,
    lollipopMultiplierEffect,
    unlockIlluminatiUpgrade,
    exhancers,
    exhancersFirstEffect,
    exhancersSecondEffect,
    respecBuyables,
    sellExhancer,
    bars: { tallBoi, longBoi, flatBoi },
    tree,
    g,
    h,
    spook,
    conversion,
    reset,
    hotkeys,
    treeNode,
    resetButton,
    minWidth: 800,
    display: tabs
});

export default layer;
