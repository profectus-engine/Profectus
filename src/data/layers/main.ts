import { ProgressDisplay, Shape } from "@/game/enums";
import { layers } from "@/game/layers";
import player from "@/game/player";
import Decimal, { DecimalSource } from "@/lib/break_eternity";
import {
    Board,
    BoardNode,
    BoardNodeAction,
    BoardNodeLink,
    NodeType
} from "@/typings/features/board";
import { RawFeature } from "@/typings/features/feature";
import { RawLayer } from "@/typings/layer";
import { formatTime } from "@/util/bignum";
import { format, formatWhole } from "@/util/break_eternity";
import { camelToTitle } from "@/util/common";
import { getUniqueNodeID } from "@/util/features";
import { computed, watch } from "vue";
import themes from "../themes";
import Main from "./Main.vue";

type ResourceNodeData = {
    resourceType: string;
    amount: DecimalSource;
    [key: string]: unknown;
};

type ItemNodeData = {
    resource: string;
    amount: DecimalSource;
    display: string;
};

type ActionNodeData = {
    actionType: string;
    log: LogEntry[];
};

enum LinkType {
    LossOnly,
    GainOnly,
    Both
}

// Links cause gain/loss of one resource to also affect other resources
type ResourceLink = {
    resource: string;
    amount: DecimalSource;
    linkType: LinkType;
};

type Resource = {
    readonly name: string;
    readonly color: string;
    readonly node: BoardNode;
    readonly links?: ResourceLink[];
    readonly maxAmount: DecimalSource;
    amount: DecimalSource;
};

const resources = {
    time: createResource("time", "#3EB489", 24 * 60 * 60, 24 * 60 * 60, [
        { resource: "social", amount: 1 / (60 * 60), linkType: LinkType.LossOnly },
        { resource: "mental", amount: 1 / (120 * 60), linkType: LinkType.LossOnly }
    ]),
    energy: createResource("energy", "#FFA500", 100, 100),
    social: createResource("social", "#800080", 100, 100),
    mental: createResource("mental", "#32CD32", 100, 100),
    focus: createResource("focus", "#0000FF", 100, 0)
} as Record<string, Resource>;

function createResource(
    name: string,
    color: string,
    maxAmount: DecimalSource,
    defaultAmount: DecimalSource,
    links?: ResourceLink[]
): Resource {
    const node = computed(() =>
        player.layers.main?.boards.main.nodes.find(
            node =>
                node.type === "resource" && (node.data as ResourceNodeData).resourceType === name
        )
    );
    return {
        name,
        color,
        links,
        get node() {
            // Should only run once, but this tricks TS into knowing node.value exists
            while (node.value == null) {
                player.layers.main.boards.main.nodes.push({
                    id: getUniqueNodeID(layers.main.boards!.data.main),
                    position: { x: 0, y: 150 }, // TODO function to get nearest unoccupied space
                    type: "resource",
                    data: {
                        resourceType: name,
                        amount: defaultAmount
                    }
                });
            }
            return node.value;
        },
        get amount() {
            return node.value ? (node.value.data as ResourceNodeData).amount : defaultAmount;
        },
        set amount(amount: DecimalSource) {
            (this.node.data as ResourceNodeData).amount = Decimal.clamp(amount, 0, maxAmount);
        },
        maxAmount
    };
}

function getResource(node: BoardNode): Resource {
    const resource = Object.values(resources).find(resource => resource.node === node);
    if (resource == null) {
        console.error("No resource associated with node", node);
        throw Error();
    }
    return resource;
}

const selectedNode = computed(() => layers.main?.boards?.data.main.selectedNode);
const selectedAction = computed(() => layers.main?.boards?.data.main.selectedAction);
const focusMult = computed(() => Decimal.div(resources.focus.amount, 100).add(1));

export type LogEntry = {
    description: string;
    effectDescription?: string;
};

export type WeightedEvent = {
    event: () => LogEntry;
    weight: number;
};

function createItem(resource: string, amount: DecimalSource, display?: string) {
    display = display || camelToTitle(resource);
    const item = {
        id: getUniqueNodeID(layers.main.boards!.data.main),
        position: { x: 0, y: 150 }, // TODO function to get nearest unoccupied space
        type: "item",
        data: { resource, amount, display } as ItemNodeData
    };
    player.layers.main.boards.main.nodes.push(item);
    return item;
}

type Action = {
    icon: string;
    fillColor?: string;
    tooltip?: string;
    events: Array<{
        event: () => LogEntry;
        weight: number;
    }>;
    baseChanges: Array<{
        resource: string;
        amount: DecimalSource;
        assign?: boolean;
    }>;
};

const actions = {
    reddit: {
        icon: "reddit",
        tooltip: "Browse Reddit",
        events: [
            {
                event: () => ({
                    description: "You blink and half an hour has passed before you know it."
                }),
                weight: 1
            },
            {
                event: () => {
                    createItem("time", 15 * 60, "Speed");
                    return {
                        description:
                            "You found some funny memes and actually feel a bit refreshed.",
                        effectDescription: `Added <span style="color: #0FF;">Speed</span> node`
                    };
                },
                weight: 0.5
            }
        ],
        baseChanges: [
            { resource: "time", amount: -30 * 60 },
            { resource: "energy", amount: 5 }
        ]
    },
    sleep: {
        icon: "bed",
        tooltip: "Sleep",
        events: [
            {
                event: () => ({ description: "You have a normal evening of undisturbed sleep" }),
                weight: 90
            },
            {
                event: () => {
                    resources.energy.amount = 50;
                    return {
                        description: "You had a very restless sleep filled with nightmares :(",
                        effectDescription: `50% <span style="color: ${resources.energy.color};">Energy</span>`
                    };
                },
                weight() {
                    return Decimal.sub(100, resources.mental.amount || 100);
                }
            },
            {
                event: () => {
                    createItem("energy", 25, "Refreshed");
                    return {
                        description:
                            "You dreamt of your future and woke up feeling extra refreshed",
                        effectDescription: `Added <span style="color: ${resources.energy.color};">Refreshed</span> node`
                    };
                },
                weight() {
                    return Decimal.sub(resources.mental.amount || 100, 75).max(5);
                }
            }
        ],
        baseChanges: [
            { resource: "time", amount: -8 * 30 * 60 },
            { resource: "energy", amount: 100, assign: true }
        ]
    },
    rest: {
        icon: "chair",
        tooltip: "Rest",
        events: [
            {
                event: () => {
                    resources.energy.amount = Decimal.sub(
                        resources.energy.amount || 100,
                        Decimal.times(10, focusMult.value)
                    );
                    return { description: "You rest your eyes for a bit and wake up rejuvenated" };
                },
                weight: 90
            },
            {
                event: () => ({
                    description:
                        "You close your eyes and it feels like no time has gone by before you wake up with a start, slightly less rested than you feel you should be given the time that's passed",
                    effectDescription: `-25% effective <span style="color: ${resources.energy.color};">Energy</span> restoration`
                }),
                weight: 5
            },
            {
                event: () => {
                    resources.energy.amount = Decimal.add(
                        resources.energy.amount,
                        Decimal.times(20, focusMult.value)
                    );
                    return {
                        description:
                            "You take an incredible power nap and wake up significantly more refreshed",
                        effectDescription: `+50% effectvie <span style="color: ${resources.energy.color};">Energy</span> restoration`
                    };
                },
                weight: 5
            }
        ],
        baseChanges: [
            { resource: "time", amount: -4 * 30 * 60 },
            // 30 is the lowest it can be from any event
            // typically you'll get 40 though
            { resource: "energy", amount: 30 }
        ]
    }
} as Record<string, Action>;

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

const logAction = {
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
} as BoardNodeAction;

type ActionNode = {
    actions: string[];
    display: string;
};

const actionNodes = {
    web: {
        actions: ["reddit"],
        display: "Web"
    },
    bed: {
        actions: ["sleep", "rest"],
        display: "Bed"
    }
} as Record<string, ActionNode>;

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

for (const id in resources) {
    const resource = resources[id];
    watch(
        () => resource.amount,
        (amount, oldAmount) => {
            if (amount == null || oldAmount == null) {
                return;
            }
            const resourceGain = Decimal.sub(amount, oldAmount);
            resource.links?.forEach(link => {
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

const resourceNodeType = {
    title(node) {
        return (node.data as ResourceNodeData).resourceType;
    },
    label(node) {
        const resource = getResource(node);
        if (selectedNode.value != node && selectedAction.value != null) {
            if (resource.name === "focus") {
                const currentFocus =
                    (resource.node.data as ResourceNodeData).currentFocus ===
                    selectedAction.value?.id;
                return {
                    text: currentFocus ? "10%" : "X",
                    color: currentFocus ? "green" : "white",
                    pulsing: true
                };
            }
            const action = actions[selectedAction.value.id];
            const change = action.baseChanges.find(change => change.resource === resource.name);
            if (change != null) {
                let text;
                if (resource.name === "time") {
                    text = formatTime(change.amount);
                } else if (Decimal.eq(resource.maxAmount, 100)) {
                    text = formatWhole(change.amount) + "%";
                } else {
                    text = format(change.amount);
                }
                let color;
                if (change.assign) {
                    color = "white";
                } else {
                    color = Decimal.gt(change.amount, 0) ? "green" : "red";
                }
                return { text, color, pulsing: true };
            }
        }

        if (
            selectedNode.value != node &&
            selectedNode.value != null &&
            selectedNode.value.type === "resource"
        ) {
            const selectedResource = getResource(selectedNode.value);
            if (selectedResource.links) {
                const link = selectedResource.links.find(link => link.resource === resource.name);
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
                return { text: formatTime(data.amount), color: resource.color };
            }
            if (Decimal.eq(resource.maxAmount, 100)) {
                return {
                    text: formatWhole(data.amount) + "%",
                    color: resource.color
                };
            }
            return { text: format(data.amount), color: resource.color };
        }
    },
    draggable: true,
    progress(node) {
        const resource = getResource(node);
        return Decimal.div(resource.amount, resource.maxAmount).toNumber();
    },
    fillColor() {
        return themes[player.theme].variables["--background"];
    },
    progressColor(node) {
        return getResource(node).color;
    },
    canAccept(node, otherNode) {
        return (
            otherNode.type === "item" &&
            (otherNode.data as ItemNodeData).resource === getResource(node).name
        );
    },
    onDrop(node, otherNode) {
        const resource = getResource(node);
        const index = player.layers[this.layer].boards[this.id].nodes.indexOf(otherNode);
        player.layers[this.layer].boards[this.id].nodes.splice(index, 1);
        resource.amount = Decimal.add(resource.amount, (otherNode.data as ItemNodeData).amount);
    },
    actions: [pinAction]
} as RawFeature<NodeType>;

const actionNodeType = {
    title(node) {
        return actionNodes[(node.data as ActionNodeData).actionType].display;
    },
    label(node) {
        if (selectedNode.value == node && selectedAction.value != null) {
            return { text: selectedAction.value.tooltip, color: "#000" };
        }
    },
    fillColor: "#000",
    draggable: true,
    shape: Shape.Diamond,
    progressColor: "#000",
    progressDisplay: ProgressDisplay.Outline,
    actions(node) {
        const actionNode = actionNodes[(node.data as ActionNodeData).actionType];
        return [
            logAction,
            ...actionNode.actions.map(id => {
                const action = actions[id];
                return {
                    id,
                    icon: action.icon,
                    tooltip: action.tooltip,
                    fillColor: action.fillColor,
                    onClick(node) {
                        if (selectedAction.value?.id === this.id) {
                            const focusData = resources.focus.node.data as ResourceNodeData;
                            if (focusData.currentFocus === id) {
                                resources.focus.amount = Decimal.add(resources.focus.amount, 10);
                            } else {
                                focusData.currentFocus = id;
                                resources.focus.amount = 10;
                            }
                            for (const change of action.baseChanges) {
                                if (change.assign) {
                                    resources[change.resource].amount = change.amount;
                                } else if (change.resource === "time") {
                                    // Time isn't affected by focus multiplier
                                    resources.time.amount = Decimal.add(
                                        resources.time.amount,
                                        change.amount
                                    );
                                } else {
                                    resources.time.amount = Decimal.add(
                                        resources.time.amount,
                                        Decimal.times(change.amount, focusMult.value)
                                    );
                                }
                            }
                            player.layers.main.boards.main.selectedAction = null;
                            const logEntry = getRandomEvent(action.events);
                            if (logEntry) {
                                (node.data as ActionNodeData).log.push(logEntry);
                            }
                        } else {
                            player.layers.main.boards.main.selectedAction = this.id;
                        }
                    },
                    links(node) {
                        return [
                            {
                                from: resources.focus.node,
                                to: node,
                                stroke:
                                    (resources.focus.node.data as ResourceNodeData).currentFocus ===
                                    selectedAction.value?.id
                                        ? "green"
                                        : "white",
                                "stroke-width": 4,
                                pulsing: true
                            },
                            ...action.baseChanges.map(change => {
                                let color;
                                if (change.assign) {
                                    color = "white";
                                } else {
                                    color = Decimal.gt(change.amount, 0) ? "green" : "red";
                                }
                                return {
                                    from: resources[change.resource].node,
                                    to: node,
                                    stroke: color,
                                    "stroke-width": 4,
                                    pulsing: true
                                } as BoardNodeLink;
                            })
                        ];
                    }
                } as BoardNodeAction;
            })
        ];
    }
} as RawFeature<NodeType>;

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
                            } as ResourceNodeData
                        },
                        {
                            position: { x: 300, y: 0 },
                            type: "resource",
                            data: {
                                resourceType: "mental",
                                amount: new Decimal(100)
                            } as ResourceNodeData
                        },
                        {
                            position: { x: 150, y: 0 },
                            type: "resource",
                            data: {
                                resourceType: "social",
                                amount: new Decimal(100)
                            } as ResourceNodeData
                        },
                        {
                            position: { x: -150, y: 0 },
                            type: "resource",
                            data: {
                                resourceType: "focus",
                                amount: new Decimal(0),
                                currentFocus: ""
                            } as ResourceNodeData
                        },
                        {
                            position: { x: -300, y: 0 },
                            type: "resource",
                            data: {
                                resourceType: "energy",
                                amount: new Decimal(100)
                            } as ResourceNodeData
                        },
                        {
                            position: { x: -150, y: 150 },
                            type: "action",
                            data: {
                                actionType: "web",
                                log: []
                            } as ActionNodeData
                        },
                        {
                            position: { x: 150, y: 150 },
                            type: "action",
                            data: {
                                actionType: "bed",
                                log: []
                            } as ActionNodeData
                        }
                    ];
                },
                types: {
                    resource: resourceNodeType,
                    action: actionNodeType,
                    item: {
                        title(node) {
                            return (node.data as ItemNodeData).display;
                        },
                        label(node) {
                            if (selectedNode.value == node || node.pinned) {
                                const data = node.data as ItemNodeData;
                                const resource = resources[data.resource];
                                let text;
                                if (data.resource === "time") {
                                    text = formatTime(data.amount);
                                } else if (Decimal.eq(100, resource.maxAmount)) {
                                    text = format(data.amount) + "%";
                                }
                                return { text, color: resource.color };
                            }
                        },
                        draggable: true,
                        actions: [pinAction]
                    }
                },
                links(this: Board) {
                    if (this.selectedNode && this.selectedAction?.links) {
                        if (typeof this.selectedAction.links === "function") {
                            return this.selectedAction.links(this.selectedNode);
                        }
                        return this.selectedAction.links;
                    }
                    if (selectedNode.value == null) {
                        return null;
                    }
                    if (selectedNode.value.type === "resource") {
                        const resource = getResource(selectedNode.value);
                        if (resource.links) {
                            return resource.links.map(link => {
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
