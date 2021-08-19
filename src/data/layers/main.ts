import player from "@/game/player";
import Decimal, { DecimalSource } from "@/lib/break_eternity";
import { RawLayer } from "@/typings/layer";
import themes from "../themes";

type ResourceNodeData = {
    resourceType: string;
    amount: DecimalSource;
    maxAmount: DecimalSource;
};

export default {
    id: "main",
    display: `
        <div v-if="player.devSpeed === 0">Game Paused</div>
        <div v-else-if="player.devSpeed && player.devSpeed !== 1">Dev Speed: {{ format(player.devSpeed) }}x</div>
        <div>TODO: Board</div>
        <Board id="main" />
    `,
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
                        }
                    }
                }
            }
        }
    }
} as RawLayer;
