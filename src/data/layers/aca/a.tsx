import Row from "@/components/layout/Row.vue";
import Tooltip from "@/components/Tooltip.vue";
import { main } from "@/data/mod";
import { createAchievement } from "@/features/achievements/achievement";
import { jsx } from "@/features/feature";
import { createGrid } from "@/features/grids/grid";
import { createResource } from "@/features/resources/resource";
import { createTreeNode } from "@/features/trees/tree";
import { createLayer } from "@/game/layers";
import { DecimalSource } from "@/lib/break_eternity";
import Decimal from "@/util/bignum";
import { render, renderRow } from "@/util/vue";
import { computed } from "vue";
import f from "./f";

const layer = createLayer(() => {
    const id = "a";
    const color = "yellow";
    const name = "Achievements";
    const points = createResource<DecimalSource>(0, "achievement power");

    const treeNode = createTreeNode(() => ({
        display: "A",
        color,
        tooltip: {
            display: "Achievements",
            right: true
        },
        onClick() {
            main.showAchievements();
        }
    }));

    const ach1 = createAchievement(() => ({
        image: "https://unsoftcapped2.github.io/The-Modding-Tree-2/discord.png",
        display: "Get me!",
        tooltip: computed(() => {
            if (ach1.earned.value) {
                return "You did it!";
            }
            return "How did this happen?";
        }),
        shouldEarn: true
    }));
    const ach2 = createAchievement(() => ({
        display: "Impossible!",
        tooltip: computed(() => {
            if (ach2.earned.value) {
                return "HOW????";
            }
            return "Mwahahaha!";
        }),
        style: { color: "#04e050" }
    }));
    const ach3 = createAchievement(() => ({
        display: "EIEIO",
        tooltip:
            "Get a farm point.\n\nReward: The dinosaur is now your friend (you can max Farm Points).",
        shouldEarn: function () {
            return Decimal.gte(f.points.value, 1);
        },
        onComplete() {
            console.log("Bork bork bork!");
        }
    }));
    const achievements = [ach1, ach2, ach3];

    const grid = createGrid(() => ({
        rows: 2,
        cols: 2,
        getStartState(id) {
            return id;
        },
        getStyle(id, state) {
            return { backgroundColor: `#${(Number(state) * 1234) % 999999}` };
        },
        // TODO display should return an object
        getTitle(id) {
            let direction = "";
            if (id === "101") {
                direction = "top";
            } else if (id === "102") {
                direction = "bottom";
            } else if (id === "201") {
                direction = "left";
            } else if (id === "202") {
                direction = "right";
            }
            return jsx(() => (
                <Tooltip display={JSON.stringify(this.cells[id].style)} {...{ [direction]: true }}>
                    <h3>Gridable #{id}</h3>
                </Tooltip>
            ));
        },
        getDisplay(id, state) {
            return String(state);
        },
        getCanClick() {
            return Decimal.eq(main.points.value, 10);
        },
        onClick(id, state) {
            this.cells[id].state = Number(state) + 1;
        }
    }));

    const display = jsx(() => (
        <>
            <Row>
                <Tooltip display={ach1.tooltip} bottom>
                    {render(ach1)}
                </Tooltip>
                <Tooltip display={ach2.tooltip} bottom>
                    {render(ach2)}
                </Tooltip>
                <Tooltip display={ach3.tooltip} bottom>
                    {render(ach3)}
                </Tooltip>
            </Row>
            {renderRow(grid)}
        </>
    ));

    return {
        id,
        color,
        name,
        points,
        achievements,
        grid,
        treeNode,
        display
    };
});

export default layer;
