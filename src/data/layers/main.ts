import { ProgressDisplay, Shape } from "@/game/enums";
import player from "@/game/player";
import Decimal, { DecimalSource } from "@/lib/break_eternity";
import { RawLayer } from "@/typings/layer";
import { camelToTitle } from "@/util/common";
import themes from "../themes";
import Main from "./Main.vue";

export type ResourceNodeData = {
    resourceType: string;
    amount: DecimalSource;
    maxAmount: DecimalSource;
};

export type ItemNodeData = {
    itemType: string;
    amount: DecimalSource;
};

export type ActionNodeData = {
    actionType: string;
    log: string[];
};

export default {
    id: "main",
    display: Main,
    startData() {
        return {
            openNode: null,
            showModal: false
        } as {
            openNode: string | null;
            showModal: boolean;
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
                                actionType: "web",
                                log: []
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
                        onClick(node) {
                            player.layers.main.openNode = node.id;
                            player.layers.main.showModal = true;
                        },
                        onDrop(node, otherNode) {
                            const index = player.layers[this.layer].boards[this.id].nodes.indexOf(
                                otherNode
                            );
                            player.layers[this.layer].boards[this.id].nodes.splice(index, 1);
                        }
                    },
                    item: {
                        title(node) {
                            return (node.data as ItemNodeData).itemType;
                        },
                        onClick(node) {
                            player.layers.main.openNode = node.id;
                            player.layers.main.showModal = true;
                        },
                        draggable: true
                    },
                    action: {
                        title(node) {
                            return camelToTitle((node.data as ActionNodeData).actionType);
                        },
                        fillColor: "#000",
                        draggable: true,
                        shape: Shape.Diamond,
                        progressColor: "#0FF3",
                        progressDisplay: ProgressDisplay.Outline,
                        actions: [
                            {
                                id: "info",
                                icon: "history_edu",
                                tooltip: "Log",
                                onClick(node) {
                                    player.layers.main.openNode = node.id;
                                    player.layers.main.showModal = true;
                                }
                            },
                            {
                                id: "reddit",
                                icon: "reddit",
                                tooltip: "Browse Reddit",
                                onClick(node) {
                                    // TODO
                                }
                            }
                        ]
                    }
                }
            }
        }
    }
} as RawLayer;
