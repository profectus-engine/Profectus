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
import { coerceComponent } from "@/util/vue";
import { computed, watch } from "vue";
import { useToast } from "vue-toastification";
import themes from "../themes";
import Main from "./Main.vue";

const toast = useToast();

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
    amount: DecimalSource | (() => DecimalSource);
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
        { resource: "mental", amount: 1 / (120 * 60), linkType: LinkType.LossOnly },
        { resource: "hunger", amount: -1 / (15 * 60), linkType: LinkType.LossOnly }
    ]),
    energy: createResource("energy", "#FFA500", 100),
    mental: createResource("mental", "#800080", 100),
    focus: createResource("focus", "#0000FF", 100, 0),
    hunger: createResource("hunger", "#FFFF00", 100, 0, [
        {
            resource: "focus",
            amount() {
                // the higher hunger goes, the more focus it consumes
                // the idea being the amount lost is the area under the y=x line
                // that's right, using calculus in a video game :sunglasses:
                return new Decimal(resources.hunger.amount)
                    .div(10)
                    .pow(1.5)
                    .div(1.5)
                    .neg();
            },
            linkType: LinkType.GainOnly
        }
    ]),
    money: createResource("money", "#32CD32", 1000, 0)
} as Record<string, Resource>;

function createResource(
    name: string,
    color: string,
    maxAmount: DecimalSource,
    defaultAmount?: DecimalSource,
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
            if (node.value) {
                return (node.value.data as ResourceNodeData).amount;
            }
            return defaultAmount == null ? maxAmount : defaultAmount;
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
const chapter = computed(() => ((player.devSteps as number) >= chapterOne.length ? 2 : 1));

export type LogEntry = {
    description: string;
    effectDescription?: string;
};

export type WeightedEvent = {
    event: () => LogEntry;
    weight: number | (() => number);
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
    events?: Array<WeightedEvent>;
    baseChanges?:
        | Array<{
              resource: string;
              amount: DecimalSource;
              assign?: boolean;
          }>
        | (() => Array<{
              resource: string;
              amount: DecimalSource;
              assign?: boolean;
          }>);
    enabled?: boolean | (() => boolean);
};

const chapterOne = [
    "Spring break just started, and I've got no real obligations! Time to start working on a new project! Just gotta keep it scoped small enough this time so I can actually finish before school starts back up.",
    "Created a new repo! I even added a README and LICENSE!",
    "I created an index.html file, and a main.css and main.js",
    "Thought about what the game should actually be about. Robots?",
    `Actually had a better idea: <span style="font-style: italic">Ninjas</span>!`,
    "Ok Ok that was a bit ridiculous. I'm pretty sure I'm actually going to create a game about... game development! It's a perfect and original idea!",
    "Hmm, what if it involved starting in a garage then growing to become a AAA studio?",
    "Or, what if it was more abstract. It could use different development-related features in a sort of tree structure, and the numbers get increasingly absurd!",
    `No, that won't work. What if it got <span style="font-style: italic">too</span> ridiculous? Or got really boring towards the end? What would the end game even be? Probably something silly, that's what`,
    `It could be self-documenting. A game about its own development process? Or maybe its narrated, and following the path of a developer over time. That could be something <a href="https://store.steampowered.com/app/303210/The_Beginners_Guide/">really special</a>.`,
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

// Y'all ready for a stream of conciousness?
const chapterTwo = [
    "Aw geeze. Break ended... but I don't want to stop developing! I think it'll be okay if I just continue working on it a bit after school... Otherwise, how would I be able to add all the new features I currently and have always intended on adding!",
    "So I have to level with you. Dev to player. This was intended to be the chapter where you unlock a school node with actions about going to class. It'd take tons of time but give you experience, and not doing it by EOD would cause a fight with your parents, causing a mental health penalty",
    "Buuuut, I don't think the game is really hard enough right now. The experience was supposed to be a buff and overall you wouldn't get nerfed that hard",
    "The plan for a chapter 3 was having your parents tell you to start paying for food and rent, so you'd have to start working as well. That was when the difficulty would ramp up: you'd have to take fewer classes per day and sleeping and food would cost money now",
    "Due to a lack of time, I've cut the school mechanic and adapted the money mechanic so it could be implemented in a reasonable amount of time",
    "Unfortunately I don't have a good way of making the story work, and I've never been good at writing anyways, so I'm making this in-universe devlog a meta one instead",
    "This also means I don't have to spend time explaining what got cut due to time separately in the game description or something :sunglasses:",
    "I know the sunglasses emoji didn't appear in the last message, I just like typing stuff like that. I do it in my markdown notes a lot",
    "I spent way too long working on the board itself. Which is fine - I really like the board, and will use it in other projects",
    "Like Kronos. I know its taking a long time to make but it'll be worth it, trust me :)",
    "Let's just hope my writing skills improve in that game :sweat_smile:",
    "Does anyone else not like the name of :sweat_smile:? It's a good emoji but man typing it out is kinda gross",
    "I think it's ironic that I keep wanting to make more narratively driven games, despite how slow I am at writing, and my insecurities about any story I've written. But I love narratively driven games, so its only natural to want to make one myself, right?",
    "Anyways. I don't actually have many regrets on how I spent my time these last two weeks. I've been incredibly productive, I actually think. The project was a bit ambitious",
    "And let me tell you: the work does not stop here! After this jam I need to massively refactor this project, or at least how boards work",
    "Did you know most of the code for this is in a single 1300+ LoC file? It's a mess to find the section of code I need. And all the actions are in one massive object!",
    'Speaking of, eventually I wanted to have a "refactor" action on the PC node.',
    `I'm wondering if I'll need some sort of dependency injection to get around cyclical dependencies, which sounds like a whole mess that'll just make it <span style="font-style: italic">more</span> complicated, but I'd love to have each mechanic in its own file`,
    "e.g. a file could register the energy resource, bed node, and its various actions. That would be really nice, and avoid this massive nest of a file where every mechanic appears in several spread out parts",
    "kinda like how the new Composition API in Vue 3 is supposed to make code relating to a specific thing able to be kept close to itself, versus the Options API where it all gets spread out",
    "I actually used the composition API in this game, although TMT-X itself mainly uses the Options API still. That'll probably change at some point, I really like the Composition API",
    "I think my stream of conciousness is just about running out of things to say, so I guess the game should end soon",
    "heh, I said the theme of the jam in that last message. If you didn't notice, you can read it by opening the log in the PC action. I maybe should have mentioned that earlier",
    "Ah well. It's not like I have a tutorial anyways",
    "Before I go, I have to say one last thing: If I had a bit more time, I would've liked to restyle these notifications",
    `I used a nice library that was super easy to implement and use, but the notifications look <span style="font-style: italic">so</span> out of place`,
    "I also wanted to add more random events, especially to the browsing the web action. Imagine finding a plant store page that adds an action to buy said plant, which you could then care for each day. Stuff like that.",
    "Anyways. I guess that's it. I hope you enjoyed this experience. Once TMT-X is closer to public release I'll probably use it to finish/continue this game.",
    "Or not. Historically I don't really return to my game jam games.",
    `Although the mod loader made for Lit (<a href="https://qq1010903229.github.io/lit/">Lit+</a>) is fantastic, and makes me want to work on that game more. It's probably my favorite TMT mod, apart from Kronos.`,
    "I actually hadn't told anyone about this publicly yet, but since you've been reading thse I guess it won't hurt:",
    "Loader gave me permission to use his content if/when I port Lit to TMT. Lit+ will become part of the base game! I'm very excited to do that. :D",
    `So yeah. Thanks for playing. See you in the remake of this game. <span style="font-style: italic">oh god I'll have to rewrite all of this</span> `
];

const actions = {
    develop: {
        icon: "code",
        tooltip: "Develop",
        events: [
            {
                event() {
                    const step = player.devStep as number;
                    let description;
                    if (step < chapterOne.length) {
                        description = chapterOne[step];
                    } else {
                        if (step === chapterOne.length) {
                            player.layers.main.boards.main.nodes.push({
                                id: getUniqueNodeID(layers.main.boards!.data.main),
                                position: { x: 0, y: 0 },
                                type: "resource",
                                data: {
                                    resourceType: "money",
                                    amount: 10
                                } as ResourceNodeData
                            });
                            player.layers.main.boards.main.nodes.push({
                                id: getUniqueNodeID(layers.main.boards!.data.main),
                                position: { x: -300, y: 150 },
                                type: "action",
                                data: {
                                    actionType: "job",
                                    log: []
                                } as ActionNodeData
                            });
                            player.layers.main.boards.main.nodes.push({
                                id: getUniqueNodeID(layers.main.boards!.data.main),
                                position: { x: 300, y: 150 },
                                type: "action",
                                data: {
                                    actionType: "home",
                                    log: []
                                } as ActionNodeData
                            });
                        }
                        description = chapterTwo[step - chapterOne.length];
                    }
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
                        effectDescription: `50% <span style="color: ${resources.energy.color};">Energy</span> `
                    };
                },
                weight() {
                    return Decimal.sub(100, resources.mental.amount);
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
                    return Decimal.sub(resources.mental.amount, 75).max(5);
                }
            }
        ],
        baseChanges: () => {
            if (chapter.value === 1) {
                return [
                    { resource: "time", amount: 16 * 60 * 60, assign: true },
                    { resource: "energy", amount: 100, assign: true },
                    { resource: "hunger", amount: 20 }
                ];
            } else {
                return [
                    { resource: "time", amount: 16 * 60 * 60, assign: true },
                    { resource: "energy", amount: 100, assign: true },
                    { resource: "hunger", amount: 20 },
                    { resource: "money", amount: -25 }
                ];
            }
        }
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
                        description: `You passed out! That was <span style="font-style: italic">not</span> a good night's sleep`
                    };
                },
                weight: 1
            }
        ],
        baseChanges: () => {
            if (chapter.value === 1) {
                return [
                    { resource: "mental", amount: -10 },
                    { resource: "hunger", amount: 20 }
                ];
            } else {
                return [
                    { resource: "mental", amount: -10 },
                    { resource: "hunger", amount: 20 },
                    { resource: "money", amount: -25 }
                ];
            }
        }
    },
    rest: {
        icon: "chair",
        tooltip: "Rest",
        events: [
            {
                event: () => {
                    resources.energy.amount = Decimal.add(resources.energy.amount, 10);
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
                    resources.energy.amount = Decimal.add(resources.energy.amount, 20);
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
    },
    eat: {
        icon: "restaurant",
        tooltip: "Eat meal",
        events: [
            {
                event: () => ({ description: `You eat a delicious meal. Nice!` }),
                weight: 8
            },
            {
                event: () => {
                    resources.mental.amount = Decimal.add(resources.mental.amount, 10);
                    return {
                        description: `This is your favorite meal! Oh, what a treat!`,
                        effectDescription: `+10% <span style="color: ${resources.mental.color}">Mental</span> `
                    };
                },
                weight: 1
            },
            {
                event: () => {
                    resources.energy.amount = Decimal.sub(resources.energy.amount, 10);
                    resources.hunger.amount = Decimal.add(resources.hunger.amount, 25);
                    return {
                        description: `Oh no, I'm not sure that food was still good`,
                        effectDescription: `-10% <span style="color: ${resources.energy.color}">Energy</span>, -25% <span style="color: ${resources.hunger.color}">Hunger</span> depletion `
                    };
                },
                weight: 1
            }
        ],
        baseChanges: () => {
            if (chapter.value === 1) {
                return [
                    { resource: "time", amount: -30 * 60 },
                    { resource: "energy", amount: 10 },
                    { resource: "hunger", amount: -70 }
                ];
            } else {
                return [
                    { resource: "time", amount: -30 * 60 },
                    { resource: "energy", amount: 10 },
                    { resource: "hunger", amount: -70 },
                    { resource: "money", amount: 10 }
                ];
            }
        }
    },
    snack: {
        icon: "icecream",
        tooltip: "Eat snack",
        events: [
            {
                event: () => ({ description: `You have a nice, small snack. Nice!` }),
                weight: 8
            },
            {
                event: () => {
                    resources.energy.amount = Decimal.add(resources.energy.amount, 10);
                    return {
                        description: `You chose a healthy, delicious snack. You feel really good!`,
                        effectDescription: `+10% <span style="color: ${resources.energy.color}">Energy</span> `
                    };
                },
                weight: 1
            },
            {
                event: () => {
                    resources.mental.amount = Decimal.sub(resources.mental.amount, 5);
                    resources.hunger.amount = Decimal.add(resources.hunger.amount, 10);
                    return {
                        description: `You gorge yourself on unhealthy foods, and don't feel so good`,
                        effectDescription: `-5% <span style="color: ${resources.mental.color}">Mental</span>, -10% <span style="color: ${resources.hunger.color}">Hunger</span> depletion `
                    };
                },
                weight: 1
            }
        ],
        baseChanges: () => {
            if (chapter.value === 1) {
                return [
                    { resource: "time", amount: -20 * 60 },
                    { resource: "mental", amount: 2 },
                    { resource: "hunger", amount: -25 }
                ];
            } else {
                return [
                    { resource: "time", amount: -20 * 60 },
                    { resource: "mental", amount: 2 },
                    { resource: "hunger", amount: -25 },
                    { resource: "money", amount: 5 }
                ];
            }
        }
    },
    forcedSnack: {
        events: [
            {
                event: () => {
                    resources.mental.amount = Decimal.sub(resources.mental.amount, 15);
                    return {
                        description: `You scarf down anything and everything around you. That can't be good for you.`,
                        effectDescription: `-15% <span style="color: ${resources.mental.color}">Mental</span> `
                    };
                },
                weight: 1
            }
        ],
        baseChanges: () => {
            if (chapter.value === 1) {
                return [
                    { resource: "time", amount: -20 * 60 },
                    { resource: "hunger", amount: -25 }
                ];
            } else {
                return [
                    { resource: "time", amount: -20 * 60 },
                    { resource: "hunger", amount: -25 },
                    { resource: "money", amount: 5 }
                ];
            }
        }
    },
    brush: {
        icon: "mood",
        tooltip: "Brush Teeth",
        enabled: () =>
            Decimal.lt(player.lastDayBrushed as DecimalSource, player.day as DecimalSource),
        events: [
            {
                event: () => {
                    player.lastDayBrushed = player.day;
                    return {
                        description: `Brushing once a day is 33% of the way towards keeping the dentist at bay`
                    };
                },
                weight: 1
            }
        ],
        baseChanges: [
            { resource: "time", amount: -5 * 60 },
            { resource: "energy", amount: -2 },
            { resource: "mental", amount: 2 }
        ]
    },
    work: {
        icon: "work",
        tooltip: "Work",
        events: [
            {
                event: () => ({ description: "Work was... tolerable... today" }),
                weight: 8
            },
            {
                event: () => {
                    resources.mental.amount = Decimal.sub(resources.mental.amount, 12);
                    return {
                        description: `Work was a nightmare today. You're pretty sure the shades of red on your boss' angry face aren't healthy`,
                        effectDescription: `-12% <span style="color: ${resources.mental.color}">Mental</span> `
                    };
                },
                weight: 1
            },
            {
                event: () => {
                    resources.mental.amount = Decimal.add(resources.mental.amount, 4);
                    resources.money.amount = Decimal.add(resources.money.amount, 20);
                    return {
                        description:
                            "You were so productive today! The boss even handed you a below-the-table bonus at the end of the day. Wow!",
                        effectDescription: `+4% <span style="color: ${resources.mental.color}">Mental</span>, +$20 <span style="color: ${resources.money.color}">Money</span> `
                    };
                },
                weight: 1
            }
        ],
        baseChanges: [
            { resource: "time", amount: -9 * 60 * 60 },
            { resource: "hunger", amount: -50 },
            { resource: "money", amount: 40 },
            { resource: "energy", amount: -70 }
        ]
    },
    promote: {
        icon: "badge",
        tooltip: "Ask for promotion",
        events: [
            {
                event: () => {
                    resources.mental.amount = Decimal.sub(resources.mental.amount, 10);
                    return {
                        description:
                            "I didn't get promoted :( This could be bad luck or the result of the develop not having enough time to implement experience lol",
                        effectDescription: `-10% <span style="color: ${resources.mental.color}">Mental</span> `
                    };
                },
                weight: 1
            }
        ],
        baseChanges: [
            { resource: "time", amount: -60 * 60 },
            { resource: "energy", amount: -20 }
        ]
    },
    money: {
        icon: "attach_money",
        tooltip: "Ask parents for money",
        events: [
            {
                event: () => {
                    resources.mental.amount = Decimal.sub(
                        resources.mental.amount,
                        Decimal.times(5, Decimal.add(player.moneyRequests as DecimalSource, 1))
                    );
                    player.moneyRequests = Decimal.add(player.moneyRequests as DecimalSource, 1);
                    return {
                        description:
                            "I asked my parents for money and got $100. That should help, but every time I ask I feel guiltier",
                        effectDescription: `-${Decimal.times(
                            5,
                            player.moneyRequests as DecimalSource
                        )}% <span style="color: ${resources.mental.color}">Mental</span> `
                    };
                },
                weight: 1
            }
        ],
        baseChanges: [{ resource: "money", amount: 100 }]
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
    },
    food: {
        actions: ["eat", "snack", "brush"],
        display: "Food"
    },
    job: {
        actions: ["work", "promote"],
        display: "Job"
    },
    home: {
        actions: ["money"],
        display: "Home"
    }
} as Record<string, ActionNode>;

function getRandomEvent(events: WeightedEvent[]): LogEntry | null {
    if (events.length === 0) {
        return null;
    }
    const totalWeight = events.reduce((acc, curr) => {
        let weight = curr.weight;
        if (typeof weight === "function") {
            weight = weight();
        }
        return Decimal.add(acc, weight);
    }, new Decimal(0));
    const random = Decimal.times(Math.random(), totalWeight);

    let weight = new Decimal(0);
    for (const outcome of events) {
        weight = Decimal.add(
            weight,
            typeof outcome.weight === "function" ? outcome.weight() : outcome.weight
        );
        if (Decimal.lte(random, weight)) {
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
            if (amount == null || oldAmount == null || player.justLoaded) {
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
                    const amount = typeof link.amount === "function" ? link.amount() : link.amount;
                    resource.amount = Decimal.add(
                        resource.amount,
                        Decimal.times(amount, resourceGain)
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
            const baseChanges =
                action.baseChanges &&
                (typeof action.baseChanges === "function"
                    ? action.baseChanges()
                    : action.baseChanges);
            const change = baseChanges?.find(change => change.resource === resource.name);
            if (change != null) {
                let text = Decimal.gt(change.amount, 0) ? "+" : "";
                if (resource.name === "time") {
                    // TODO only apply focusMult if focus is on this action
                    text += formatTime(Decimal.div(change.amount, focusMult.value));
                } else if (resource.name === "money") {
                    text = "$" + formatWhole(change.amount);
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
                    const amount = new Decimal(
                        typeof link.amount === "function" ? link.amount() : link.amount
                    ).neg();
                    if (resource.name === "time") {
                        text = formatTime(amount);
                    } else if (resource.name === "money") {
                        text = "$" + formatWhole(resource.amount);
                    } else if (Decimal.eq(resource.maxAmount, 100)) {
                        text = formatWhole(amount) + "%";
                    } else {
                        text = format(amount);
                    }
                    let negativeLink = Decimal.gt(amount, 0);
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
            if (resource.name === "money") {
                return { text: "$" + formatWhole(resource.amount), color: resource.color };
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
        const baseChanges =
            typeof action.baseChanges === "function" ? action.baseChanges() : action.baseChanges;
        for (const change of baseChanges) {
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
            toast.info(coerceComponent(logEntry.description));
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
                        const baseChanges =
                            action.baseChanges &&
                            (typeof action.baseChanges === "function"
                                ? action.baseChanges()
                                : action.baseChanges);
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
                            ...(baseChanges || []).map(change => {
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

function registerResourceDepletedAction(
    resource: string,
    nodeID: string,
    action: string,
    threshold: 0 | 100 = 0
) {
    watch(
        () => ({
            amount: resources[resource].amount,
            forcedAction: player.layers.main?.forcedAction,
            node: layers.main?.boards?.data.main.nodes.find(
                node =>
                    node.type === "action" && (node.data as ActionNodeData).actionType === nodeID
            )
        }),
        ({ amount, forcedAction, node }) => {
            if (Decimal.eq(amount, threshold) && forcedAction == null && node != null) {
                toast.error(
                    coerceComponent(
                        `${camelToTitle(resources[resource].name)} depleted!`,
                        "span",
                        false
                    )
                );
                player.layers.main.forcedAction = {
                    resource,
                    node: node.id,
                    action,
                    progress: 0
                };
            }
        }
    );
}

registerResourceDepletedAction("time", "bed", "forcedSleep");
registerResourceDepletedAction("energy", "bed", "forcedRest");
registerResourceDepletedAction("hunger", "food", "forcedSnack", 100);
registerResourceDepletedAction("money", "home", "money");

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
                            position: { x: 0, y: -150 },
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
                            position: { x: 150, y: 0 },
                            type: "resource",
                            data: {
                                resourceType: "hunger",
                                amount: new Decimal(0)
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
                            position: { x: 0, y: 150 },
                            type: "action",
                            data: {
                                actionType: "bed",
                                log: []
                            } as ActionNodeData
                        },
                        {
                            position: { x: 150, y: 150 },
                            type: "action",
                            data: {
                                actionType: "food",
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
                                if (resource.name === "time") {
                                    text = formatTime(data.amount);
                                } else if (resource.name === "money") {
                                    text = "$" + formatWhole(resource.amount);
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
                                    const amount =
                                        typeof link.amount === "function"
                                            ? link.amount()
                                            : link.amount;
                                    return {
                                        from: selectedNode.value,
                                        to: linkResource.node,
                                        stroke: Decimal.gt(amount, 0) ? "red" : "green",
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
