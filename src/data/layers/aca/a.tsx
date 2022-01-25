import Tooltip from "@/components/system/Tooltip.vue";
import { points as mainPoints } from "@/data/mod";
import { createAchievement } from "@/features/achievement";
import { createGrid } from "@/features/grid";
import { createResource } from "@/features/resource";
import { createTreeNode } from "@/features/tree";
import { createLayer } from "@/game/layers";
import { DecimalSource } from "@/lib/break_eternity";
import Decimal from "@/util/bignum";
import { render, renderRow } from "@/util/vue";
import { points as fPoints } from "./f";

const id = "a";
const color = "yellow";
const name = "Achievements";
const points = createResource<DecimalSource>(0, "achievement power");

export const treeNode = createTreeNode({
    tooltip: "Achievements",
    onClick() {
        // TODO open this layer as a modal
    }
});

const ach1 = createAchievement({
    image: "https://unsoftcapped2.github.io/The-Modding-Tree-2/discord.png",
    display: "Get me!",
    tooltip() {
        if (this.earned.value) {
            return "You did it!";
        }
        return "How did this happen?";
    },
    shouldEarn: true
});
const ach2 = createAchievement({
    display: "Impossible!",
    tooltip() {
        if (this.earned.value) {
            return "HOW????";
        }
        return "Mwahahaha!";
    },
    style: { color: "#04e050" }
});
const ach3 = createAchievement({
    display: "EIEIO",
    tooltip:
        "Get a farm point.\n\nReward: The dinosaur is now your friend (you can max Farm Points).",
    shouldEarn: function () {
        return Decimal.gte(fPoints.value, 1);
    },
    onComplete() {
        console.log("Bork bork bork!");
    }
});
const achievements = [ach1, ach2, ach3];

const grid = createGrid({
    rows: 2,
    cols: 2,
    getStartState(id) {
        return id;
    },
    getStyle(id) {
        return { backgroundColor: `#${(Number(id) * 1234) % 999999}` };
    },
    // TODO display should return an object
    getTitle(id) {
        let direction;
        if (id === "101") {
            direction = "top";
        } else if (id === "102") {
            direction = "bottom";
        } else if (id === "201") {
            direction = "left";
        } else if (id === "202") {
            direction = "right";
        }
        return (
            <Tooltip display={JSON.stringify(this.cells[id].style)} {...{ direction }}>
                <h3>Gridable #{id}</h3>
            </Tooltip>
        );
    },
    getDisplay(id) {
        return String(id);
    },
    getCanClick() {
        return Decimal.eq(mainPoints.value, 10);
    },
    onClick(id, state) {
        this.cells[id].state = Number(state) + 1;
    }
});

const display = (
    <template>
        {renderRow(achievements)}
        {render(grid)}
    </template>
);

const layer = createLayer({
    id,
    color,
    name,
    points,
    achievements,
    grid,
    treeNode,
    display
});

export default layer;
