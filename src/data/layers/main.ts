import { ProgressDisplay, Shape } from "@/game/enums";
import player from "@/game/player";
import Decimal, { DecimalSource } from "@/lib/break_eternity";
import { RawLayer } from "@/typings/layer";
import { camelToTitle } from "@/util/common";
import themes from "../themes";

type ResourceNodeData = {
    resourceType: string;
    amount: DecimalSource;
    maxAmount: DecimalSource;
};

type ItemNodeData = {
    itemType: string;
    amount: DecimalSource;
};

type ActionNodeData = {
    actionType: string;
};

export default {
    id: "main",
    display: `
        <div v-if="player.devSpeed === 0">Game Paused</div>
        <div v-else-if="player.devSpeed && player.devSpeed !== 1">Dev Speed: {{ format(player.devSpeed) }}x</div>
        <div>TODO: Board</div>
        <Board id="main" />

    `,
    startData() {
        return {
            openNode: null
        } as {
            openNode: string | null;
        };
    },
    minimizable: false,
    componentStyles: {
        board: {
            position: "absolute",
            top: "0",
            left: "0"
        }
    },
    boards: {
        data: {
            main: {
                height: "100%",
                startNodes() {
                    return [
                        {
                            position: { x: 0, y: 0 },
                            type: "resource",
                            data: {
                                resourceType: "time",
                                amount: new Decimal(24 * 60 * 60),
                                maxAmount: new Decimal(24 * 60 * 60)
                            }
                        },
                        {
                            position: { x: 0, y: 150 },
                            type: "item",
                            data: {
                                itemType: "speed",
                                amount: new Decimal(5 * 60 * 60)
                            }
                        },
                        {
                            position: { x: -150, y: 150 },
                            type: "action",
                            data: {
                                actionType: "browse"
                            }
                        }
                    ];
                },
                types: {
                    resource: {
                        title(node) {
                            return (node.data as ResourceNodeData).resourceType;
                        },
                        draggable: true,
                        progress(node) {
                            const data = node.data as ResourceNodeData;
                            return Decimal.div(data.amount, data.maxAmount).toNumber();
                        },
                        fillColor() {
                            return themes[player.theme].variables["--background"];
                        },
                        progressColor(node) {
                            const data = node.data as ResourceNodeData;
                            switch (data.resourceType) {
                                case "time":
                                    return "#0FF3";
                                default:
                                    return "none";
                            }
                        },
                        canAccept(node, otherNode) {
                            return otherNode.type === "item";
                        },
                        onDrop(node, otherNode) {
                            const index = player.layers[this.layer].boards[this.id].indexOf(
                                otherNode
                            );
                            player.layers[this.layer].boards[this.id].splice(index, 1);
                        }
                    },
                    item: {
                        title(node) {
                            return (node.data as ItemNodeData).itemType;
                        },
                        draggable: true
                    },
                    action: {
                        title(node) {
                            return camelToTitle((node.data as ActionNodeData).actionType);
                        },
                        tooltip(node) {
                            switch ((node.data as ActionNodeData).actionType) {
                                default:
                                    return camelToTitle((node.data as ActionNodeData).actionType);
                                case "browse":
                                    return "Browse the internet";
                            }
                        },
                        draggable: false,
                        shape: Shape.Diamond,
                        size: 100,
                        progressColor: "#0FF3",
                        progressDisplay: ProgressDisplay.Outline
                    }
                }
            }
        }
    }
} as RawLayer;
