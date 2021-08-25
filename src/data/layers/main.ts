import { ProgressDisplay, Shape } from "@/game/enums";
import { layers } from "@/game/layers";
import player from "@/game/player";
import Decimal, { DecimalSource } from "@/lib/break_eternity";
import { BoardNode, BoardNodeAction } from "@/typings/features/board";
import { RawLayer } from "@/typings/layer";
import { formatTime } from "@/util/bignum";
import { format, formatWhole } from "@/util/break_eternity";
import { camelToTitle } from "@/util/common";
import { getUniqueNodeID } from "@/util/features";
import { computed, watch } from "vue";
import themes from "../themes";
import Main from "./Main.vue";

export type ResourceNodeData = {
    resourceType: string;
    amount: DecimalSource;
    [key: string]: any;
};

export type ItemNodeData = {
    itemType: string;
    amount: DecimalSource;
};

export type ActionNodeData = {
    actionType: string;
    log: LogEntry[];
};

type Resource = {
    readonly name: string;
    readonly color: string;
    readonly node: BoardNode | undefined;
    amount: DecimalSource | undefined;
    readonly maxAmount: DecimalSource;
};

const resources = {
    time: createResource("time", "#3EB48933", 24 * 60 * 60),
    energy: createResource("energy", "#FFA50033", 100),
    social: createResource("social", "#80008033", 100),
    mental: createResource("mental", "#32CD3233", 100),
    focus: createResource("focus", "#0000FF33", 100)
} as Record<string, Resource>;

function createResource(name: string, color: string, maxAmount: DecimalSource): Resource {
    const node = computed(() =>
        player.layers.main?.boards.main.nodes.find(
            node =>
                node.type === "resource" && (node.data as ResourceNodeData).resourceType === name
        )
    );
    const data = computed(() => node.value?.data as ResourceNodeData);
    return {
        name,
        color,
        get node() {
            return node.value;
        },
        get amount() {
            return data.value?.amount;
        },
        set amount(amount: DecimalSource) {
            data.value.amount = Decimal.clamp(amount, 0, maxAmount);
        },
        maxAmount
    };
}

function getResource(node: BoardNode): Resource | undefined {
    return Object.values(resources).find(resource => resource.node === node);
}

const selectedNode = computed(() => layers.main?.boards?.data.main.selectedNode);
const selectedAction = computed(() => layers.main?.boards?.data.main.selectedAction);

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
        { resource: "social", amount: 1 / (60 * 60), linkType: LinkType.LossOnly },
        { resource: "mental", amount: 1 / (120 * 60), linkType: LinkType.LossOnly }
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
        () => resources[resource].amount,
        (amount, oldAmount) => {
            if (amount == null || oldAmount == null) {
                return;
            }
            const resourceGain = Decimal.sub(amount, oldAmount);
            resourceLinks.forEach(link => {
                if (link.linkType === LinkType.LossOnly && Decimal.gt(amount, oldAmount)) {
                    return;
                }
                if (link.linkType === LinkType.GainOnly && Decimal.lt(amount, oldAmount)) {
                    return;
                }
                const resource = resources[link.resource];
                if (resource.amount != null) {
                    resource.amount = Decimal.add(
                        resource.amount,
                        Decimal.times(link.amount, resourceGain)
                    );
                }
            });
        }
    );
}

const pinAction = {
    id: "pin",
    icon: "push_pin",
    fillColor(node) {
        if (node.pinned) {
            return themes[player.theme].variables["--bought"];
        }
        return themes[player.theme].variables["--secondary-background"];
    },
    tooltip: "Always show resource",
    onClick(node) {
        node.pinned = !node.pinned;
        return true;
    }
} as BoardNodeAction;

export default {
    id: "main",
    display: Main,
    minWidth: undefined,
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
                                amount: new Decimal(24 * 60 * 60)
                            }
                        },
                        {
                            position: { x: 300, y: 0 },
                            type: "resource",
                            data: {
                                resourceType: "mental",
                                amount: new Decimal(100)
                            }
                        },
                        {
                            position: { x: 150, y: 0 },
                            type: "resource",
                            data: {
                                resourceType: "social",
                                amount: new Decimal(100)
                            }
                        },
                        {
                            position: { x: -150, y: 0 },
                            type: "resource",
                            data: {
                                resourceType: "focus",
                                amount: new Decimal(0),
                                currentFocus: ""
                            }
                        },
                        {
                            position: { x: -300, y: 0 },
                            type: "resource",
                            data: {
                                resourceType: "energy",
                                amount: new Decimal(100)
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
                            const resource = getResource(node)!;
                            if (selectedNode.value != node && selectedAction.value != null) {
                                if (resource && resource.name === "focus") {
                                    const currentFocus =
                                        (resource.node?.data as ResourceNodeData | undefined)
                                            ?.currentFocus === selectedAction.value?.id;
                                    return {
                                        text: currentFocus ? "10%" : "X",
                                        color: currentFocus ? "green" : "black",
                                        pulsing: true
                                    };
                                }
                                switch (selectedAction.value.id) {
                                    case "reddit":
                                        switch (resource.name) {
                                            case "time":
                                                return {
                                                    text: "30m",
                                                    color: "red",
                                                    pulsing: true
                                                };
                                            case "energy":
                                                return {
                                                    text: "5%",
                                                    color: "green",
                                                    pulsing: true
                                                };
                                        }
                                        break;
                                }
                            }
                            if (
                                selectedNode.value != node &&
                                selectedNode.value != null &&
                                selectedNode.value.type === "resource"
                            ) {
                                const selectedResource = getResource(selectedNode.value);
                                if (selectedResource && selectedResource.name in links) {
                                    const link = links[selectedResource.name].find(
                                        link => link.resource === resource.name
                                    );
                                    if (link) {
                                        let text;
                                        if (resource.name === "time") {
                                            text = formatTime(link.amount);
                                        } else if (Decimal.eq(resource.maxAmount, 100)) {
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
                            if (selectedNode.value == node || node.pinned) {
                                const data = node.data as ResourceNodeData;
                                if (data.resourceType === "time") {
                                    return { text: formatTime(data.amount), color: "#0FF3" };
                                }
                                if (Decimal.eq(resource.maxAmount, 100)) {
                                    return { text: formatWhole(data.amount) + "%", color: "#0FF3" };
                                }
                                return { text: format(data.amount), color: "#0FF3" };
                            }
                        },
                        draggable: true,
                        progress(node) {
                            const resource = getResource(node)!;
                            return Decimal.div(resource.amount || 0, resource.maxAmount).toNumber();
                        },
                        fillColor() {
                            return themes[player.theme].variables["--background"];
                        },
                        progressColor(node) {
                            return getResource(node)!.color;
                        },
                        canAccept(node, otherNode) {
                            return otherNode.type === "item";
                        },
                        onDrop(node, otherNode) {
                            const resource = getResource(node)!;
                            const index = player.layers[this.layer].boards[this.id].nodes.indexOf(
                                otherNode
                            );
                            player.layers[this.layer].boards[this.id].nodes.splice(index, 1);
                            resource.amount = Decimal.add(
                                resource.amount || 0,
                                (otherNode.data as ItemNodeData).amount
                            );
                        },
                        actions: [pinAction]
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
                            if (selectedNode.value == node || node.pinned) {
                                const data = node.data as ItemNodeData;
                                if (data.itemType === "time") {
                                    return { text: formatTime(data.amount), color: "#0FF3" };
                                }
                                return { text: format(data.amount), color: "#0FF3" };
                            }
                        },
                        draggable: true,
                        actions: [pinAction]
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
                                    if (selectedAction.value?.id === this.id) {
                                        const focusData = resources.focus.node
                                            ?.data as ResourceNodeData;
                                        if (focusData.currentFocus === "reddit") {
                                            resources.focus.amount = Decimal.add(
                                                resources.focus.amount || 0,
                                                10
                                            );
                                        } else {
                                            focusData.currentFocus = "reddit";
                                            resources.focus.amount = 10;
                                        }
                                        const focusMult = Decimal.div(
                                            resources.focus.amount,
                                            100
                                        ).add(1);
                                        resources.time.amount = Decimal.sub(
                                            resources.time.amount || 0,
                                            Decimal.times(30 * 60, focusMult)
                                        );
                                        resources.energy.amount = Decimal.sub(
                                            resources.energy.amount || 0,
                                            Decimal.times(5, focusMult)
                                        );
                                        player.layers.main.boards.main.selectedAction = null;
                                        (node.data as ActionNodeData).log.push(
                                            getRandomEvent(redditEvents)!
                                        );
                                    } else {
                                        player.layers.main.boards.main.selectedAction = this.id;
                                    }
                                },
                                links(node) {
                                    return [
                                        {
                                            from: resources.time.node,
                                            to: node,
                                            stroke: "red",
                                            "stroke-width": 4,
                                            pulsing: true
                                        },
                                        {
                                            from: resources.energy.node,
                                            to: node,
                                            stroke: "green",
                                            "stroke-width": 4,
                                            pulsing: true
                                        },
                                        {
                                            from: resources.focus.node,
                                            to: node,
                                            stroke:
                                                (resources.focus.node?.data as ResourceNodeData)
                                                    .currentFocus === selectedAction.value?.id
                                                    ? "green"
                                                    : "black",
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
                    if (selectedNode.value == null) {
                        return null;
                    }
                    if (selectedNode.value.type === "resource") {
                        const resource = getResource(selectedNode.value)!;
                        if (resource.name in links) {
                            return links[resource.name].map(link => {
                                const linkResource = resources[link.resource];
                                let negativeLink = Decimal.lt(link.amount, 0);
                                if (link.linkType === LinkType.LossOnly) {
                                    negativeLink = !negativeLink;
                                }
                                return {
                                    from: selectedNode.value,
                                    to: linkResource.node,
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
