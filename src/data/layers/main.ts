import { ProgressDisplay, Shape } from "@/game/enums";
import { layers } from "@/game/layers";
import player from "@/game/player";
import Decimal, { DecimalSource } from "@/lib/break_eternity";
import { RawLayer } from "@/typings/layer";
import { formatTime } from "@/util/bignum";
import { format, formatWhole } from "@/util/break_eternity";
import { camelToTitle } from "@/util/common";
import { getUniqueNodeID } from "@/util/features";
import { watch } from "vue";
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
    log: LogEntry[];
};

export type LogEntry = {
    description: string;
    effectDescription?: string;
};

export type WeightedEvent = {
    event: () => LogEntry;
    weight: number;
};

const redditEvents = [
    {
        event: () => ({ description: "You blink and half an hour has passed before you know it." }),
        weight: 1
    },
    {
        event: () => {
            const id = getUniqueNodeID(layers.main.boards!.data.main);
            player.layers.main.boards.main.nodes.push({
                id,
                position: { x: 0, y: 150 }, // TODO function to get nearest unoccupied space
                type: "item",
                data: {
                    itemType: "time",
                    amount: new Decimal(15 * 60)
                }
            });
            return {
                description: "You found some funny memes and actually feel a bit refreshed.",
                effectDescription: `Added <span style="color: #0FF;">Speed</span> node`
            };
        },
        weight: 0.5
    }
];

function getRandomEvent(events: WeightedEvent[]): LogEntry | null {
    if (events.length === 0) {
        return null;
    }
    const totalWeight = events.reduce((acc, curr) => acc + curr.weight, 0);
    const random = Math.random() * totalWeight;

    let weight = 0;
    for (const outcome of events) {
        weight += outcome.weight;
        if (random <= weight) {
            return outcome.event();
        }
    }

    // Should never reach here
    return null;
}

enum LinkType {
    LossOnly,
    GainOnly,
    Both
}

// Links cause gain/loss of one resource to also affect other resources
const links = {
    time: [
        { resource: "social", amount: 1 / 60, linkType: LinkType.LossOnly },
        { resource: "mental", amount: 1 / 120, linkType: LinkType.LossOnly }
    ]
} as Record<
    string,
    {
        resource: string;
        amount: DecimalSource;
        linkType: LinkType;
    }[]
>;

for (const resource in links) {
    const resourceLinks = links[resource];
    watch(
        () =>
            (player.layers.main?.boards.main.nodes.find(
                node =>
                    node.type === "resource" &&
                    (node.data as ResourceNodeData).resourceType === resource
            )?.data as ResourceNodeData | null)?.amount,
        (amount, oldAmount) => {
            if (amount == null || oldAmount == null) {
                return;
            }
            const resourceGain = Decimal.sub(amount, oldAmount);
            resourceLinks.forEach(link => {
                switch (link.linkType) {
                    case LinkType.LossOnly:
                        if (Decimal.gt(amount, oldAmount)) {
                            return;
                        }
                        break;
                    case LinkType.GainOnly:
                        if (Decimal.lt(amount, oldAmount)) {
                            return;
                        }
                        break;
                }
                const node = player.layers.main.boards.main.nodes.find(
                    node =>
                        node.type === "resource" &&
                        (node.data as ResourceNodeData).resourceType === link.resource
                );
                if (node) {
                    const data = node.data as ResourceNodeData;
                    data.amount = Decimal.add(
                        data.amount,
                        Decimal.times(link.amount, resourceGain)
                    ).clamp(0, data.maxAmount);
                }
            });
        }
    );
}

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
                            position: { x: 0, y: 0 },
                            type: "resource",
                            data: {
                                resourceType: "mental",
                                amount: new Decimal(100),
                                maxAmount: new Decimal(100)
                            }
                        },
                        {
                            position: { x: 0, y: 0 },
                            type: "resource",
                            data: {
                                resourceType: "social",
                                amount: new Decimal(100),
                                maxAmount: new Decimal(100)
                            }
                        },
                        {
                            position: { x: 0, y: 0 },
                            type: "resource",
                            data: {
                                resourceType: "focus",
                                amount: new Decimal(100),
                                maxAmount: new Decimal(100)
                            }
                        },
                        {
                            position: { x: 0, y: 150 },
                            type: "item",
                            data: {
                                itemType: "time",
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
                        label(node) {
                            if (player.layers[this.layer].boards[this.id].selectedNode == node.id) {
                                const data = node.data as ResourceNodeData;
                                if (data.resourceType === "time") {
                                    return { text: formatTime(data.amount), color: "#0FF3" };
                                }
                                if (Decimal.eq(data.maxAmount, 100)) {
                                    return { text: formatWhole(data.amount) + "%", color: "#0FF3" };
                                }
                                return { text: format(data.amount), color: "#0FF3" };
                            }
                            if (player.layers[this.layer].boards[this.id].selectedNode == null) {
                                return null;
                            }
                            const selectedNode = layers[this.layer].boards!.data[this.id]
                                .selectedNode;
                            if (selectedNode.type === "resource") {
                                const data = selectedNode.data as ResourceNodeData;
                                if (data.resourceType in links) {
                                    const link = links[data.resourceType].find(
                                        link =>
                                            link.resource ===
                                            (node.data as ResourceNodeData).resourceType
                                    );
                                    if (link) {
                                        let text;
                                        if (
                                            (node.data as ResourceNodeData).resourceType === "time"
                                        ) {
                                            text = formatTime(link.amount);
                                        } else if (
                                            Decimal.eq(
                                                (node.data as ResourceNodeData).maxAmount,
                                                100
                                            )
                                        ) {
                                            text = formatWhole(link.amount) + "%";
                                        } else {
                                            text = format(link.amount);
                                        }
                                        let negativeLink = Decimal.lt(link.amount, 0);
                                        if (link.linkType === LinkType.LossOnly) {
                                            negativeLink = !negativeLink;
                                        }
                                        return { text, color: negativeLink ? "red" : "green" };
                                    }
                                }
                            }
                            if (player.layers[this.layer].boards[this.id].selectedAction == null) {
                                return null;
                            }
                            const action = player.layers[this.layer].boards[this.id].selectedAction;
                            switch (action) {
                                default:
                                    return null;
                                case "reddit":
                                    if ((node.data as ResourceNodeData).resourceType === "time") {
                                        return { text: "30m", color: "red", pulsing: true };
                                    }
                                    return null;
                            }
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
                            return "#0FF3";
                        },
                        canAccept(node, otherNode) {
                            return otherNode.type === "item";
                        },
                        onDrop(node, otherNode) {
                            const index = player.layers[this.layer].boards[this.id].nodes.indexOf(
                                otherNode
                            );
                            player.layers[this.layer].boards[this.id].nodes.splice(index, 1);
                            (node.data as ResourceNodeData).amount = Decimal.add(
                                (node.data as ResourceNodeData).amount,
                                (otherNode.data as ItemNodeData).amount
                            ).min((node.data as ResourceNodeData).maxAmount);
                        }
                    },
                    item: {
                        title(node) {
                            switch ((node.data as ItemNodeData).itemType) {
                                default:
                                    return null;
                                case "time":
                                    return "speed";
                            }
                        },
                        label(node) {
                            if (player.layers[this.layer].boards[this.id].selectedNode == node.id) {
                                const data = node.data as ItemNodeData;
                                if (data.itemType === "time") {
                                    return { text: formatTime(data.amount), color: "#0FF3" };
                                }
                                return { text: format(data.amount), color: "#0FF3" };
                            }
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
                                fillColor() {
                                    return themes[player.theme].variables["--secondary-background"];
                                },
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
                                    if (player.layers.main.boards.main.selectedAction === this.id) {
                                        const timeNode = player.layers.main.boards.main.nodes.find(
                                            node =>
                                                node.type === "resource" &&
                                                (node.data as ResourceNodeData).resourceType ===
                                                    "time"
                                        );
                                        if (timeNode) {
                                            (timeNode.data as ResourceNodeData).amount = Decimal.sub(
                                                (timeNode.data as ResourceNodeData).amount,
                                                30 * 60
                                            );
                                            player.layers.main.boards.main.selectedAction = null;
                                            (node.data as ActionNodeData).log.push(
                                                getRandomEvent(redditEvents)!
                                            );
                                        }
                                    } else {
                                        player.layers.main.boards.main.selectedAction = this.id;
                                    }
                                },
                                links(node) {
                                    return [
                                        {
                                            // TODO this is ridiculous and needs some utility
                                            //  function to shrink it down
                                            from: player.layers.main.boards.main.nodes.find(
                                                node =>
                                                    node.type === "resource" &&
                                                    (node.data as ResourceNodeData).resourceType ===
                                                        "time"
                                            ),
                                            to: node,
                                            stroke: "red",
                                            "stroke-width": 4,
                                            pulsing: true
                                        }
                                    ];
                                }
                            }
                        ]
                    }
                },
                links() {
                    if (this.selectedAction?.links) {
                        if (typeof this.selectedAction!.links === "function") {
                            return this.selectedAction!.links(this.selectedNode);
                        }
                        return this.selectedAction!.links;
                    }
                    if (player.layers[this.layer].boards[this.id].selectedNode == null) {
                        return null;
                    }
                    const selectedNode = layers[this.layer].boards!.data[this.id].selectedNode;
                    if (selectedNode.type === "resource") {
                        const data = selectedNode.data as ResourceNodeData;
                        if (data.resourceType in links) {
                            return links[data.resourceType].map(link => {
                                const node = player.layers.main.boards.main.nodes.find(
                                    node =>
                                        node.type === "resource" &&
                                        (node.data as ResourceNodeData).resourceType ===
                                            link.resource
                                );
                                let negativeLink = Decimal.lt(link.amount, 0);
                                if (link.linkType === LinkType.LossOnly) {
                                    negativeLink = !negativeLink;
                                }
                                return {
                                    from: selectedNode,
                                    to: node,
                                    stroke: negativeLink ? "red" : "green",
                                    "stroke-width": 4,
                                    pulsing: true
                                };
                            });
                        }
                    }
                    return null;
                }
            }
        }
    }
} as RawLayer;
