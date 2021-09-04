import { CacheableFunction } from "@/typings/cacheableFunction";
import { Achievement } from "@/typings/features/achievement";
import { Board } from "@/typings/features/board";
import { Buyable } from "@/typings/features/buyable";
import { Challenge } from "@/typings/features/challenge";
import { Clickable } from "@/typings/features/clickable";
import {
    Feature,
    Features,
    GridFeatures,
    RawFeature,
    RawFeatures,
    RawGridFeatures
} from "@/typings/features/feature";
import { Grid } from "@/typings/features/grid";
import { Hotkey } from "@/typings/features/hotkey";
import { Milestone } from "@/typings/features/milestone";
import { Microtab, Subtab } from "@/typings/features/subtab";
import { Upgrade } from "@/typings/features/upgrade";
import { Layer, RawLayer } from "@/typings/layer";
import { PlayerData } from "@/typings/player";
import { State } from "@/typings/state";
import Decimal, { DecimalSource } from "@/util/bignum";
import { isFunction } from "@/util/common";
import {
    defaultLayerProperties,
    getStartingBoards,
    getStartingBuyables,
    getStartingChallenges,
    getStartingClickables,
    noCache
} from "@/util/layers";
import { createGridProxy, createLayerProxy } from "@/util/proxies";
import { applyPlayerData } from "@/util/save";
import clone from "lodash.clonedeep";
import { isRef } from "vue";
import { ProgressDisplay, Shape } from "./enums";
import { default as playerProxy } from "./player";

export const layers: Record<string, Readonly<Layer>> = {};
export const hotkeys: Hotkey[] = [];
window.layers = layers;

export function addLayer(layer: RawLayer, player?: Partial<PlayerData>): void {
    player = player || playerProxy;

    // Check for required properties
    if (!("id" in layer)) {
        console.error(`Cannot add layer without a "id" property!`, layer);
        return;
    }
    if (layer.type === "static" || layer.type === "normal") {
        const missingProperty = ["baseAmount", "requires"].find(prop => !(prop in layer));
        if (missingProperty) {
            console.error(`Cannot add layer without a "${missingProperty}" property!`, layer);
            return;
        }
    }

    // Clone object to prevent modifying the original
    layer = clone(layer);

    setDefault(player, "layers", {});
    player.layers[layer.id] = applyPlayerData(
        {
            points: new Decimal(0),
            unlocked: false,
            resetTime: new Decimal(0),
            upgrades: [],
            achievements: [],
            milestones: [],
            infoboxes: {},
            buyables: getStartingBuyables(layer.buyables?.data),
            clickables: getStartingClickables(layer.clickables?.data),
            challenges: getStartingChallenges(layer.challenges?.data),
            boards: player.layers[layer.id]?.boards || getStartingBoards(layer.boards?.data),
            grids: {},
            confirmRespecBuyables: false,
            ...(layer.startData?.() || {})
        },
        player.layers[layer.id]
    );

    // Set default property values
    layer = Object.assign({}, defaultLayerProperties, layer);
    layer.layer = layer.id;
    if (layer.type === "static" && layer.base == undefined) {
        layer.base = 2;
    }

    // Process each feature
    const uncachedProperties = ["startData", "click", "update", "reset", "hardReset"];
    for (const property of uncachedProperties) {
        if (layer[property] && !isRef(layer.property) && isFunction(layer[property])) {
            (layer[property] as CacheableFunction).forceCached = false;
        }
    }
    if (layer.upgrades) {
        setupFeatures<NonNullable<RawLayer["upgrades"]>, Upgrade>(layer.id, layer.upgrades);
        setRowCol(layer.upgrades);
        for (const id in layer.upgrades.data) {
            layer.upgrades.data[id].bought = function() {
                return (
                    !layers[this.layer].deactivated &&
                    playerProxy.layers[this.layer].upgrades.some(
                        (upgrade: string | number) => upgrade == id
                    )
                );
            };
            setDefault(layer.upgrades.data[id], "canAfford", function() {
                if (this.currencyInternalName) {
                    const name = this.currencyInternalName;
                    if (this.currencyLocation) {
                        return !Decimal.lt(this.currencyLocation[name], this.cost);
                    } else if (this.currencyLayer) {
                        return !Decimal.lt(
                            playerProxy.layers[this.currencyLayer][name] as DecimalSource,
                            this.cost
                        );
                    } else {
                        return !Decimal.lt(playerProxy[name] as DecimalSource, this.cost);
                    }
                } else {
                    return !playerProxy.layers[this.layer].points.lt(this.cost);
                }
            });
            setDefault(
                layer.upgrades.data[id],
                "pay",
                function() {
                    if (this.bought || !this.canAfford) {
                        return;
                    }
                    if (this.currencyInternalName) {
                        const name = this.currencyInternalName;
                        if (this.currencyLocation) {
                            if (Decimal.lt(this.currencyLocation[name], this.cost)) {
                                return;
                            }
                            this.currencyLocation[name] = Decimal.sub(
                                this.currencyLocation[name],
                                this.cost
                            );
                        } else if (this.currencyLayer) {
                            const lr = this.currencyLayer;
                            if (
                                Decimal.lt(playerProxy.layers[lr][name] as DecimalSource, this.cost)
                            ) {
                                return;
                            }
                            playerProxy.layers[lr][name] = Decimal.sub(
                                playerProxy.layers[lr][name] as DecimalSource,
                                this.cost
                            );
                        } else {
                            if (Decimal.lt(playerProxy[name] as DecimalSource, this.cost)) {
                                return;
                            }
                            playerProxy[name] = Decimal.sub(
                                playerProxy[name] as DecimalSource,
                                this.cost
                            );
                        }
                    } else {
                        if (playerProxy.layers[this.layer].points.lt(this.cost)) {
                            return;
                        }
                        playerProxy.layers[this.layer].points = playerProxy.layers[
                            this.layer
                        ].points.sub(this.cost);
                    }
                },
                false
            );
            setDefault(
                layer.upgrades.data[id],
                "buy",
                function() {
                    if (this.bought || !this.canAfford) {
                        return;
                    }
                    this.pay();
                    playerProxy.layers[this.layer].upgrades.push(this.id);
                    this.onPurchase?.();
                },
                false
            );
            setDefault(layer.upgrades.data[id], "onPurchase", undefined, false);
        }
    }
    if (layer.achievements) {
        setupFeatures<NonNullable<RawLayer["achievements"]>, Achievement>(
            layer.id,
            layer.achievements
        );
        setRowCol(layer.achievements);
        for (const id in layer.achievements.data) {
            layer.achievements.data[id].earned = function() {
                return (
                    !layers[this.layer].deactivated &&
                    playerProxy.layers[this.layer].achievements.some(
                        (achievement: string | number) => achievement == id
                    )
                );
            };
            setDefault(layer.achievements.data[id], "onComplete", undefined, false);
        }
    }
    if (layer.challenges) {
        setupFeatures<NonNullable<RawLayer["challenges"]>, Challenge>(layer.id, layer.challenges);
        setRowCol(layer.challenges);
        layer.activeChallenge = function() {
            return Object.values(this.challenges!.data).find(
                (challenge: Challenge) => challenge.active
            );
        };
        for (const id in layer.challenges.data) {
            layer.challenges.data[id].shown = function() {
                return (
                    this.unlocked !== false && (playerProxy.hideChallenges === false || !this.maxed)
                );
            };
            layer.challenges.data[id].completed = function() {
                return (
                    !layers[this.layer].deactivated &&
                    playerProxy.layers[this.layer].challenges[id]?.gt(0)
                );
            };
            layer.challenges.data[id].completions = function() {
                return playerProxy.layers[this.layer].challenges[id];
            };
            layer.challenges.data[id].maxed = function() {
                return (
                    !layers[this.layer].deactivated &&
                    Decimal.gte(playerProxy.layers[this.layer].challenges[id], this.completionLimit)
                );
            };
            layer.challenges.data[id].active = function() {
                return (
                    !layers[this.layer].deactivated &&
                    playerProxy.layers[this.layer].activeChallenge === id
                );
            };
            layer.challenges.data[id].toggle = noCache(function(this: Challenge) {
                const exiting = playerProxy.layers[this.layer].activeChallenge === id;
                if (exiting) {
                    if (this.canComplete && !this.maxed) {
                        let completions: boolean | DecimalSource = this.canComplete;
                        if (completions === true) {
                            completions = 1;
                        }
                        playerProxy.layers[this.layer].challenges[id] = Decimal.min(
                            playerProxy.layers[this.layer].challenges[id].add(completions),
                            this.completionLimit
                        );
                        this.onComplete?.();
                    }
                    playerProxy.layers[this.layer].activeChallenge = null;
                    this.onExit?.();
                    layers[this.layer].reset(true);
                } else if (!exiting && this.canStart) {
                    layers[this.layer].reset(true);
                    playerProxy.layers[this.layer].activeChallenge = id;
                    this.onEnter?.();
                }
            });
            setDefault(layer.challenges.data[id], "onComplete", undefined, false);
            setDefault(layer.challenges.data[id], "onEnter", undefined, false);
            setDefault(layer.challenges.data[id], "onExit", undefined, false);
            setDefault(layer.challenges.data[id], "canStart", true);
            setDefault(layer.challenges.data[id], "completionLimit", new Decimal(1));
            setDefault(layer.challenges.data[id], "mark", function() {
                return Decimal.gt(this.completionLimit, 1) && this.maxed;
            });
            setDefault(layer.challenges.data[id], "canComplete", function() {
                if (!this.active) {
                    return false;
                }
                if (this.currencyInternalName) {
                    const name = this.currencyInternalName;
                    if (this.currencyLocation) {
                        return !Decimal.lt(this.currencyLocation[name], this.goal);
                    } else if (this.currencyLayer) {
                        const lr = this.currencyLayer;
                        return !Decimal.lt(
                            playerProxy.layers[lr][name] as DecimalSource,
                            this.goal
                        );
                    } else {
                        return !Decimal.lt(playerProxy[name] as DecimalSource, this.goal);
                    }
                } else {
                    return !playerProxy.points.lt(this.goal);
                }
            });
        }
    }
    if (layer.buyables) {
        setupFeatures<NonNullable<RawLayer["buyables"]>, Buyable>(layer.id, layer.buyables);
        setRowCol(layer.buyables);
        setDefault(layer.buyables, "respec", undefined, false);
        setDefault(
            layer.buyables,
            "reset",
            function(this: NonNullable<Layer["buyables"]>) {
                playerProxy.layers[this.layer].buyables = getStartingBuyables(layer.buyables?.data);
            },
            false
        );
        for (const id in layer.buyables.data) {
            layer.buyables.data[id].amount = function() {
                return playerProxy.layers[this.layer].buyables[id];
            };
            layer.buyables.data[id].amountSet = function(amount: Decimal) {
                playerProxy.layers[this.layer].buyables[id] = amount;
            };
            layer.buyables.data[id].canBuy = function() {
                return (
                    !layers[this.layer].deactivated &&
                    this.unlocked !== false &&
                    this.canAfford !== false &&
                    Decimal.lt(playerProxy.layers[this.layer].buyables[id], this.purchaseLimit)
                );
            };
            setDefault(layer.buyables.data[id], "purchaseLimit", new Decimal(Infinity));
            setDefault(layer.buyables.data[id], "sellOne", undefined, false);
            setDefault(layer.buyables.data[id], "sellAll", undefined, false);
            if (layer.buyables.data[id].cost != undefined) {
                setDefault(
                    layer.buyables.data[id],
                    "buy",
                    function() {
                        if (this.canBuy) {
                            playerProxy.layers[this.layer].points = playerProxy.layers[
                                this.layer
                            ].points.sub(this.cost!);
                            this.amount = this.amount.add(1);
                        }
                    },
                    false
                );
            }
        }
    }
    if (layer.clickables) {
        setupFeatures<NonNullable<RawLayer["clickables"]>, Clickable>(layer.id, layer.clickables);
        setRowCol(layer.clickables);
        setDefault(layer.clickables, "masterButtonClick", undefined, false);
        if (layer.clickables.masterButtonDisplay != undefined) {
            setDefault(layer.clickables, "showMasterButton", true);
        }
        for (const id in layer.clickables.data) {
            layer.clickables.data[id].state = function() {
                return playerProxy.layers[this.layer].clickables[id];
            };
            layer.clickables.data[id].stateSet = function(state: State) {
                playerProxy.layers[this.layer].clickables[id] = state;
            };
            setDefault(layer.clickables.data[id], "canClick", true);
            setDefault(layer.clickables.data[id], "click", undefined, false);
            setDefault(layer.clickables.data[id], "hold", undefined, false);
        }
    }
    if (layer.milestones) {
        setupFeatures<NonNullable<RawLayer["milestones"]>, Milestone>(layer.id, layer.milestones);
        for (const id in layer.milestones.data) {
            layer.milestones.data[id].earned = function() {
                return (
                    !layer.deactivated &&
                    playerProxy.layers[this.layer].milestones.some(
                        (milestone: string | number) => milestone == id
                    )
                );
            };
            layer.milestones.data[id].shown = function() {
                if (!this.unlocked) {
                    return false;
                }
                switch (playerProxy.msDisplay) {
                    default:
                    case "all":
                        return true;
                    case "last":
                        return (
                            this.optionsDisplay ||
                            !this.earned ||
                            playerProxy.layers[this.layer].milestones[
                                playerProxy.layers[this.layer].milestones.length - 1
                            ] === this.id
                        );
                    case "configurable":
                        return this.optionsDisplay || !this.earned;
                    case "incomplete":
                        return !this.earned;
                    case "none":
                        return false;
                }
            };
            setDefault(layer.milestones.data[id], "done", false);
        }
    }
    if (layer.grids) {
        setupFeatures<NonNullable<RawLayer["grids"]>, Grid>(layer.id, layer.grids);
        for (const id in layer.grids.data) {
            setDefault(player.layers[layer.id].grids, id, {});
            layer.grids.data[id].getData = function(cell): State {
                if (playerProxy.layers[this.layer].grids[id][cell] != undefined) {
                    return playerProxy.layers[this.layer].grids[id][cell];
                }
                if (isFunction(this.getStartData)) {
                    return (this.getStartData as (this: Grid, cell: string | number) => State)(
                        cell
                    );
                }
                return this.getStartData;
            };
            layer.grids.data[id].setData = function(cell, data) {
                playerProxy.layers[this.layer].grids[id][cell] = data;
            };
            setDefault(layer.grids.data[id], "getUnlocked", true, false);
            setDefault(layer.grids.data[id], "getCanClick", true, false);
            setDefault(layer.grids.data[id], "getStartData", "", false);
            setDefault(layer.grids.data[id], "getStyle", undefined, false);
            setDefault(layer.grids.data[id], "click", undefined, false);
            setDefault(layer.grids.data[id], "hold", undefined, false);
            setDefault(layer.grids.data[id], "getTitle", undefined, false);
            layer.grids.data[id] = createGridProxy(layer.grids.data[id]) as Grid;
        }
    }
    if (layer.boards) {
        setupFeatures<NonNullable<RawLayer["boards"]>, Board>(layer.id, layer.boards);
        for (const id in layer.boards.data) {
            setDefault(layer.boards.data[id], "width", "100%");
            setDefault(layer.boards.data[id], "height", "400px");
            setDefault(layer.boards.data[id], "nodes", function() {
                return playerProxy.layers[this.layer].boards[this.id].nodes;
            });
            setDefault(layer.boards.data[id], "selectedNode", function() {
                return playerProxy.layers[this.layer].boards[this.id].nodes.find(
                    node => node.id === playerProxy.layers[this.layer].boards[this.id].selectedNode
                );
            });
            setDefault(layer.boards.data[id], "selectedAction", function() {
                if (this.selectedNode == null) {
                    return null;
                }
                const nodeType = layers[this.layer].boards!.data[this.id].types[
                    this.selectedNode.type
                ];
                if (nodeType.actions === null) {
                    return null;
                }
                const actions =
                    typeof nodeType.actions === "function"
                        ? nodeType.actions(this.selectedNode)
                        : nodeType.actions;
                return actions?.find(
                    action =>
                        action.id === playerProxy.layers[this.layer].boards[this.id].selectedAction
                );
            });
            setDefault(layer.boards.data[id], "links", function() {
                if (this.selectedAction == null) {
                    return null;
                }
                if (this.selectedAction.links) {
                    if (typeof this.selectedAction.links === "function") {
                        return this.selectedAction.links(this.selectedNode);
                    }
                    return this.selectedAction.links;
                }
                return null;
            });
            for (const nodeType in layer.boards.data[id].types) {
                layer.boards.data[id].types[nodeType].layer = layer.id;
                layer.boards.data[id].types[nodeType].id = id;
                layer.boards.data[id].types[nodeType].type = nodeType;
                setDefault(layer.boards.data[id].types[nodeType], "size", 50);
                setDefault(layer.boards.data[id].types[nodeType], "draggable", false);
                setDefault(layer.boards.data[id].types[nodeType], "shape", Shape.Circle);
                setDefault(layer.boards.data[id].types[nodeType], "canAccept", false);
                setDefault(layer.boards.data[id].types[nodeType], "actionDistance", Math.PI / 6);
                setDefault(
                    layer.boards.data[id].types[nodeType],
                    "progressDisplay",
                    ProgressDisplay.Fill
                );
                setDefault(layer.boards.data[id].types[nodeType], "nodes", function() {
                    return playerProxy.layers[this.layer].boards[this.id].nodes.filter(
                        node => node.type === this.type
                    );
                });
                setDefault(layer.boards.data[id].types[nodeType], "onClick", function(node) {
                    playerProxy.layers[this.layer].boards[this.id].selectedNode = node.id;
                });
            }
        }
    }
    if (layer.subtabs) {
        layer.activeSubtab = function() {
            if (
                layers[this.layer].subtabs![playerProxy.subtabs[this.layer].mainTabs!] &&
                layers[this.layer].subtabs![playerProxy.subtabs[this.layer].mainTabs!].unlocked !==
                    false
            ) {
                return layers[this.layer].subtabs![playerProxy.subtabs[this.layer].mainTabs!];
            }
            // Default to first unlocked tab
            return Object.values(layers[this.layer].subtabs!).find(
                (subtab: Subtab) => subtab.unlocked !== false
            );
        };
        setDefault(player, "subtabs", {});
        setDefault(player.subtabs, layer.id, {});
        setDefault(player.subtabs[layer.id], "mainTabs", Object.keys(layer.subtabs)[0]);
        for (const id in layer.subtabs) {
            layer.subtabs[id].active = function() {
                return playerProxy.subtabs[this.layer].mainTabs === this.id;
            };
        }
    }
    if (layer.microtabs) {
        setDefault(player, "subtabs", {});
        setDefault(player.subtabs, layer.id, {});
        for (const family in layer.microtabs) {
            if (Object.keys(layer.microtabs[family]).length === 0) {
                console.warn(
                    "Cannot create microtab family with 0 tabs",
                    layer.id,
                    family,
                    layer.microtabs[family]
                );
                continue;
            }
            layer.microtabs[family].activeMicrotab = function() {
                if (
                    this.data[playerProxy.subtabs[this.layer as string][family]] &&
                    this.data[playerProxy.subtabs[this.layer as string][family]].unlocked !== false
                ) {
                    return this[playerProxy.subtabs[this.layer as string][family]];
                }
                // Default to first unlocked tab
                const firstUnlocked: string | undefined = Object.keys(this).find(
                    microtab =>
                        microtab !== "activeMicrotab" && this.data[microtab].unlocked !== false
                );
                return firstUnlocked != undefined ? this[firstUnlocked] : undefined;
            };
            setDefault(
                player.subtabs[layer.id],
                family,
                Object.keys(layer.microtabs[family]).find(tab => tab !== "activeMicrotab")!
            );
            layer.microtabs[family].layer = layer.id;
            layer.microtabs[family].family = family;
            for (const id in layer.microtabs[family].data) {
                const microtab: RawFeature<Microtab> = layer.microtabs[family].data[id];
                microtab.layer = layer.id;
                microtab.family = family;
                microtab.id = id;
                microtab.active = function() {
                    return playerProxy.subtabs[this.layer][this.family] === this.id;
                };
            }
        }
    }
    if (layer.hotkeys) {
        for (const id in layer.hotkeys) {
            setDefault(layer.hotkeys[id], "press", undefined, false);
            setDefault(layer.hotkeys[id], "unlocked", function() {
                return layers[this.layer].unlocked;
            });
        }
    }

    // Create layer proxy
    layer = createLayerProxy(layer) as Layer;

    // Register layer
    layers[layer.id] = layer as Layer;

    // Register hotkeys
    if (layers[layer.id].hotkeys) {
        for (const hotkey of layers[layer.id].hotkeys!) {
            hotkeys.push(hotkey);
        }
    }
}

export function removeLayer(layer: string): void {
    // Un-set hotkeys
    if (layers[layer].hotkeys) {
        for (const hotkey of Object.values(layers[layer].hotkeys!)) {
            const index = hotkeys.indexOf(hotkey);
            if (index >= 0) {
                hotkeys.splice(index, 1);
            }
        }
    }

    delete layers[layer];
}

export function reloadLayer(layer: Layer): void {
    removeLayer(layer.id);

    // Re-create layer
    addLayer(layer);
}

function setRowCol<T extends GridFeatures<S>, S extends Feature>(features: RawGridFeatures<T, S>) {
    if (features.rows && features.cols) {
        return;
    }
    let maxRow = 0;
    let maxCol = 0;
    for (const id in features) {
        const index = Number(id);
        if (!isNaN(index)) {
            if (Math.floor(index / 10) > maxRow) {
                maxRow = Math.floor(index / 10);
            }
            if (index % 10 > maxCol) {
                maxCol = index % 10;
            }
        }
    }
    features.rows = maxRow;
    features.cols = maxCol;
}

function setupFeatures<
    T extends RawFeatures<R, S, unknown>,
    S extends Feature,
    R extends Features<S> = Features<S>
>(layer: string, features: T) {
    features.layer = layer;
    for (const id in features.data) {
        const feature = features.data[id];
        (feature as S).id = id;
        (feature as S).layer = layer;
        if ((feature as S).unlocked == undefined) {
            (feature as S).unlocked = true;
        }
    }
}

function setDefault<T, K extends keyof T>(
    object: T,
    key: K,
    value: T[K],
    forceCached?: boolean
): asserts object is Exclude<T, K> & Required<Pick<T, K>> {
    if (object[key] === undefined && value != undefined) {
        object[key] = value;
    }
    if (object[key] != undefined && isFunction(object[key]) && forceCached != undefined) {
        Object.assign(object[key], { forceCached });
    }
}
