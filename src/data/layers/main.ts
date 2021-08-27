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

export type ActionNodeData = {
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
        { resource: "mental", amount: 1 / (120 * 60), linkType: LinkType.LossOnly }
    ]),
    energy: createResource("energy", "#FFA500", 100, 100),
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
    icon?: string;
    fillColor?: string;
    tooltip?: string;
    events?: Array<{
        event: () => LogEntry;
        weight: number;
    }>;
    baseChanges?: Array<{
        resource: string;
        amount: DecimalSource;
        assign?: boolean;
    }>;
    enabled?: boolean | (() => boolean);
};

const developSteps = [
    "Spring break just started, and I've got no real obligations! Time to start working on a new project! Just gotta keep it scoped small enough this time so I can actually finish before school starts back up.",
    "Created a new repo! I even added a README and LICENSE!",
    "I created an index.html file, and a main.css and main.js",
    "Thought about what the game should actually be about. Robots?",
    `Actually had a better idea: <span style="font-style: italic">Ninjas</span>!`,
    "Ok Ok that was a bit ridiculous. I'm pretty sure I'm actually going to create a game about... game development! It's a perfect and original idea!",
    "Hmm, what if it involved starting in a garage then growing to become a AAA studio?",
    "Or, what if it was more abstract. It could use different development-related features in a sort of tree structure, and the numbers get increasingly absurd!",
    `No, that won't work. What if it got <span style="font-style: italic">too</span> ridiculous? Or got really boring towards the end? What would the end game even be? Probably something silly, that's what`,
    `It could be self-documenting. A game about its own development process? Or maybe its narrated, and following the path of a developer over time. That could be something <a href="https://store.steampowered.com/app/303210/The_Beginners_Guide/">really special</href>.`,
    "Maybe meta games are passé these days. How about I start with some first person shooter",
    "You know what? I'll figure it out as I go along. Let's start with stuff any game would need",
    "Made an options screen!",
    "Made a credits screen! It's just me lol",
    "Added a new option to the options screen! That's adding real value to the game!",
    "Made a fancy title screen, minus the title itself!",
    "I changed around some of the colors in the credits screen. Am I procrastinating?",
    "Thought hard about a core mechanic. Decided it'd be better to just pick a theme that sounds cool and assume the mechanics will follow",
    "Trying to come up with a theme, but I keep thinking of pokémon, and I'm pretty sure Nintendo will sue me if I make a fangame",
    "Screw it I'm making pong",
    "Added a paddle that you can control with the mouse!",
    "Added a ball that bounces off the paddle",
    "Added an enemy paddle - it doesn't move yet",
    "Made the enemy paddle just move up and down in a loop",
    "Added a number at the top that goes up every time your paddle hits the ball",
    "Made the enemy paddle and ball move faster over time",
    "Made the enemy paddle move in the direction of the ball",
    `Thought of what to add next. I can't <span style="font-style: italic">just</span> make pong!`
];

const actions = {
    develop: {
        icon: "code",
        tooltip: "Develop",
        events: [
            {
                event() {
                    const description = developSteps[player.devStep as number];
                    (player.devStep as number)++;
                    return { description };
                },
                weight: 1
            }
        ],
        baseChanges: [
            { resource: "time", amount: -60 * 60 },
            { resource: "energy", amount: -5 }
        ]
    },
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
        icon: "mode_night",
        tooltip: "Sleep",
        events: [
            {
                event: () => {
                    player.day = (player.day as Decimal).add(1);
                    return { description: "You have a normal evening of undisturbed sleep" };
                },
                weight: 90
            },
            {
                event: () => {
                    player.day = (player.day as Decimal).add(1);
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
                    player.day = (player.day as Decimal).add(1);
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
            { resource: "time", amount: 16 * 60 * 60, assign: true },
            { resource: "energy", amount: 100, assign: true }
        ]
    },
    forcedSleep: {
        events: [
            {
                event: () => {
                    const amount = resources.time.amount;
                    resources.time.amount = 16 * 60 * 60;
                    resources.energy.amount = Decimal.sub(100, Decimal.div(amount, 6 * 60));
                    resources.mental.amount = Decimal.sub(resources.mental.amount, 10);
                    player.day = (player.day as Decimal).add(1);
                    return {
                        description: `You passed out! That was <span style="font-style: italicize">not</span> a good night's sleep`
                    };
                },
                weight: 1
            }
        ],
        baseChanges: [{ resource: "mental", amount: -10 }]
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
                        effectDescription: `+50% effective <span style="color: ${resources.energy.color};">Energy</span> restoration`
                    };
                },
                weight: 5
            }
        ],
        baseChanges: [
            { resource: "time", amount: -4 * 60 * 60 },
            // 30 is the lowest it can be from any event
            // typically you'll get 40 though
            { resource: "energy", amount: 30 }
        ]
    },
    forcedRest: {
        events: [
            {
                event: () => ({
                    description: `You drag yourself to the couch before collapsing. You wake back up but still feel oddly drained`
                }),
                weight: 1
            }
        ],
        baseChanges: [
            { resource: "time", amount: -6 * 60 * 60 },
            { resource: "energy", amount: 30 },
            { resource: "mental", amount: -5 }
        ]
    },
    makeBed: {
        icon: "king_bed",
        tooltip: "Make Bed",
        enabled: () =>
            Decimal.lt(player.lastDayBedMade as DecimalSource, player.day as DecimalSource),
        events: [
            {
                event: () => {
                    player.lastDayBedMade = player.day;
                    return {
                        description: `It's a small thing, but you feel better after making your bed`
                    };
                },
                weight: 1
            }
        ],
        baseChanges: [
            { resource: "time", amount: -10 * 60 },
            { resource: "energy", amount: -5 },
            { resource: "mental", amount: 5 }
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
    pc: {
        actions: ["develop", "reddit"],
        display: "PC"
    },
    bed: {
        actions: ["sleep", "rest", "makeBed"],
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
                    text: "10%",
                    color: currentFocus ? "green" : "white",
                    pulsing: true
                };
            }
            const action = actions[selectedAction.value.id];
            const change = action.baseChanges?.find(change => change.resource === resource.name);
            if (change != null) {
                let text = Decimal.gt(change.amount, 0) ? "+" : "";
                if (resource.name === "time") {
                    text += formatTime(Decimal.div(change.amount, focusMult.value));
                } else if (Decimal.eq(resource.maxAmount, 100)) {
                    text += formatWhole(change.amount) + "%";
                } else {
                    text += format(change.amount);
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

function performAction(id: string, action: Action, node: BoardNode) {
    if (
        player.layers.main.forcedAction &&
        (player.layers.main.forcedAction as { action: string }).action !== id
    ) {
        return;
    }
    const focusData = resources.focus.node.data as ResourceNodeData;
    if (focusData.currentFocus === id) {
        resources.focus.amount = Decimal.add(resources.focus.amount, 10);
    } else {
        focusData.currentFocus = id;
        resources.focus.amount = 10;
    }
    if (action.baseChanges) {
        for (const change of action.baseChanges) {
            if (change.assign) {
                resources[change.resource].amount = change.amount;
            } else if (change.resource === "time") {
                resources.time.amount = Decimal.add(
                    resources.time.amount,
                    Decimal.div(change.amount, focusMult.value)
                );
            } else {
                resources[change.resource].amount = Decimal.add(
                    resources[change.resource].amount,
                    change.amount
                );
            }
        }
    }
    player.layers.main.boards.main.selectedAction = null;
    if (action.events) {
        const logEntry = getRandomEvent(action.events);
        if (logEntry) {
            (node.data as ActionNodeData).log.push(logEntry);
        }
    }
}

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
    progress(node) {
        const forcedAction = player.layers.main.forcedAction as {
            resource: string;
            node: number;
            action: string;
            progress: number;
        } | null;
        if (forcedAction && node.id === forcedAction.node) {
            return forcedAction.progress;
        }
    },
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
                    onClick: node => {
                        if (selectedAction.value?.id === id) {
                            performAction(id, action, node);
                        } else {
                            player.layers.main.boards.main.selectedAction = id;
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
                            ...(action.baseChanges || []).map(change => {
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
                    },
                    enabled: action.enabled
                } as BoardNodeAction;
            })
        ];
    }
} as RawFeature<NodeType>;

function registerResourceDepletedAction(resource: string, nodeID: string, action: string) {
    watch(
        () => ({
            amount: resources[resource].amount,
            forcedAction: player.layers.main?.forcedAction
        }),
        ({ amount, forcedAction }) => {
            if (Decimal.eq(amount, 0) && forcedAction == null) {
                player.layers.main.forcedAction = {
                    resource,
                    node: layers.main.boards!.data.main.nodes.find(
                        node =>
                            node.type === "action" &&
                            (node.data as ActionNodeData).actionType === nodeID
                    )!.id,
                    action,
                    progress: 0
                };
            }
        }
    );
}

registerResourceDepletedAction("time", "bed", "forcedSleep");
registerResourceDepletedAction("energy", "bed", "forcedRest");

export default {
    id: "main",
    display: Main,
    minWidth: undefined,
    startData() {
        return {
            openNode: null,
            showModal: false,
            forcedAction: null
        } as {
            openNode: string | null;
            showModal: boolean;
            forcedAction: {
                resource: string;
                node: number;
                action: string;
                progress: number;
            } | null;
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
    update(diff) {
        const forcedAction = player.layers.main.forcedAction as {
            resource: string;
            node: number;
            action: string;
            progress: number;
        } | null;
        if (forcedAction) {
            forcedAction.progress += new Decimal(diff).div(4).toNumber();
            if (forcedAction.progress >= 1) {
                performAction(
                    forcedAction.action,
                    actions[forcedAction.action],
                    this.boards!.data.main.nodes.find(node => node.id === forcedAction.node)!
                );
                player.layers.main.forcedAction = null;
            }
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
                                actionType: "pc",
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
                    const links: BoardNodeLink[] = [];
                    const forcedAction = player.layers.main.forcedAction as {
                        resource: string;
                        node: number;
                        action: string;
                        progress: number;
                    } | null;
                    if (forcedAction) {
                        links.push({
                            from: resources[forcedAction.resource].node,
                            to: this.nodes.find(node => node.id === forcedAction.node)!,
                            stroke: "black",
                            "stroke-width": 4
                        });
                    }
                    if (this.selectedNode && this.selectedAction?.links) {
                        if (typeof this.selectedAction.links === "function") {
                            return this.selectedAction.links(this.selectedNode);
                        }
                        links.push(...this.selectedAction.links);
                    }
                    if (selectedNode.value && selectedNode.value.type === "resource") {
                        const resource = getResource(selectedNode.value);
                        if (resource.links) {
                            links.push(
                                ...resource.links.map(link => {
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
                                    } as BoardNodeLink;
                                })
                            );
                        }
                    }
                    return links;
                }
            }
        }
    }
} as RawLayer;
