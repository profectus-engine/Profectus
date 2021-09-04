import { hotkeys, layers } from "@/game/layers";
import player from "@/game/player";
import { CacheableFunction } from "@/typings/cacheableFunction";
import { Board, BoardData, BoardNode, RawBoard } from "@/typings/features/board";
import { Buyable } from "@/typings/features/buyable";
import { Challenge } from "@/typings/features/challenge";
import { Clickable } from "@/typings/features/clickable";
import { RawFeature } from "@/typings/features/feature";
import { MicrotabFamily, Subtab } from "@/typings/features/subtab";
import { Layer, RawLayer } from "@/typings/layer";
import { State } from "@/typings/state";
import Decimal from "./bignum";

export function resetLayer(layer: string, force = false): void {
    layers[layer].reset(force);
}

export function hardReset(layer: string, keep: Array<string> = []): void {
    layers[layer].hardReset(keep);
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function cache<T extends CacheableFunction | Function>(func: T): T & CacheableFunction {
    return Object.assign(func, { forceCached: true });
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function noCache<T extends CacheableFunction | Function>(func: T): T & CacheableFunction {
    return Object.assign(func, { forceCached: false });
}

export function getStartingBuyables(
    buyables?: Record<string, Buyable> | Record<string, RawFeature<Buyable>> | undefined
): Record<string, Decimal> {
    return buyables
        ? Object.keys(buyables).reduce((acc: Record<string, Decimal>, curr: string): Record<
              string,
              Decimal
          > => {
              acc[curr] = new Decimal(0);
              return acc;
          }, {})
        : {};
}

export function getStartingClickables(
    clickables?: Record<string, Clickable> | Record<string, RawFeature<Clickable>> | undefined
): Record<string, State> {
    return clickables
        ? Object.keys(clickables).reduce((acc: Record<string, State>, curr: string): Record<
              string,
              State
          > => {
              acc[curr] = "";
              return acc;
          }, {})
        : {};
}

export function getStartingChallenges(
    challenges?: Record<string, Challenge> | Record<string, RawFeature<Challenge>> | undefined
): Record<string, Decimal> {
    return challenges
        ? Object.keys(challenges).reduce((acc: Record<string, Decimal>, curr: string): Record<
              string,
              Decimal
          > => {
              acc[curr] = new Decimal(0);
              return acc;
          }, {})
        : {};
}

export function getStartingBoards(
    boards?: Record<string, Board> | Record<string, RawBoard> | undefined
): Record<string, BoardData> {
    return boards
        ? Object.keys(boards).reduce((acc: Record<string, BoardData>, curr: string): Record<
              string,
              BoardData
          > => {
              const nodes = boards[curr].startNodes?.() || [];
              acc[curr] = {
                  nodes: nodes.map((node, index) => ({
                      id: index,
                      ...node
                  })),
                  selectedNode: null,
                  selectedAction: null
              } as BoardData;
              return acc;
          }, {})
        : {};
}

export function resetLayerData(layer: string, keep: Array<string> = []): void {
    keep.push("unlocked", "forceTooltip", "noRespecConfirm");
    const keptData = keep.reduce((acc: Record<string, any>, curr: string): Record<string, any> => {
        acc[curr] = player.layers[layer][curr];
        return acc;
    }, {});

    player.upgrades = [];
    player.achievements = [];
    player.milestones = [];
    player.infoboxes = {};

    player.layers[layer].buyables = getStartingBuyables(layers[layer].buyables?.data);
    player.layers[layer].clickables = getStartingClickables(layers[layer].clickables?.data);
    player.layers[layer].challenges = getStartingChallenges(layers[layer].challenges?.data);

    Object.assign(player.layers[layer], layers[layer].startData?.());

    for (const item in keptData) {
        player.layers[layer][item] = keptData[item];
    }
}

export function resetRow(row: string | number | undefined, ignore?: string): void {
    Object.values(layers)
        .filter(layer => layer.row === row && layer.layer !== ignore)
        .forEach(layer => layer.hardReset());
}

export const defaultLayerProperties = {
    type: "none",
    shown: true,
    layerShown: true,
    glowColor: "red",
    minWidth: 640,
    displayRow() {
        return this.row;
    },
    symbol() {
        return this.id;
    },
    unlocked() {
        if (player.layers[this.id].unlocked) {
            return true;
        }
        if (this.type !== "none" && this.canReset && this.layerShown) {
            return true;
        }
        return false;
    },
    trueGlowColor() {
        if (this.subtabs) {
            for (const subtab of Object.values<Subtab>(this.subtabs)) {
                if (subtab.notify) {
                    return subtab.glowColor || "red";
                }
            }
        }
        if (this.microtabs) {
            for (const microtabFamily of Object.values<MicrotabFamily>(this.microtabs)) {
                for (const microtab of Object.values(microtabFamily.data)) {
                    if (microtab.notify) {
                        return microtab.glowColor || "red";
                    }
                }
            }
        }
        return this.glowColor || "red";
    },
    resetGain() {
        if (this.type === "none" || this.type === "custom") {
            return new Decimal(0);
        }
        if (this.gainExp && Decimal.eq(this.gainExp, 0)) {
            return new Decimal(0);
        }
        if (Decimal.lt(this.baseAmount!, this.requires!)) {
            return new Decimal(0);
        }
        if (this.type === "static") {
            if (!this.canBuyMax) {
                return new Decimal(1);
            }
            let gain = Decimal.div(this.baseAmount!, this.requires!)
                .div(this.gainMult || 1)
                .max(1)
                .log(this.base!)
                .times(this.gainExp || 1)
                .pow(Decimal.pow(this.exponent || 1, -1));
            gain = gain.times(this.directMult || 1);
            return gain
                .floor()
                .sub(player.layers[this.layer].points)
                .add(1)
                .max(1);
        }
        if (this.type === "normal") {
            let gain = Decimal.div(this.baseAmount!, this.requires!)
                .pow(this.exponent || 1)
                .times(this.gainMult || 1)
                .pow(this.gainExp || 1);
            if (this.softcap && this.softcapPower && gain.gte(this.softcap)) {
                gain = gain
                    .pow(this.softcapPower)
                    .times(Decimal.pow(this.softcap, Decimal.sub(1, this.softcapPower)));
            }
            gain = gain.times(this.directMult || 1);
            return gain.floor().max(0);
        }
        // Unknown prestige type
        return new Decimal(0);
    },
    nextAt() {
        if (this.type === "none" || this.type === "custom") {
            return new Decimal(Infinity);
        }
        if (
            (this.gainMult && Decimal.lte(this.gainMult, 0)) ||
            (this.gainExp && Decimal.lte(this.gainExp, 0))
        ) {
            return new Decimal(Infinity);
        }
        if (this.type === "static") {
            const amount = player.layers[this.layer].points.div(this.directMult || 1);
            const extraCost = Decimal.pow(
                this.base!,
                amount.pow(this.exponent || 1).div(this.gainExp || 1)
            ).times(this.gainMult || 1);
            let cost = extraCost.times(this.requires!).max(this.requires!);
            if (this.roundUpCost) {
                cost = cost.ceil();
            }
            return cost;
        }
        if (this.type === "normal") {
            let next = this.resetGain.add(1).div(this.directMult || 1);
            if (this.softcap && this.softcapPower && next.gte(this.softcap)) {
                next = next
                    .div(Decimal.pow(this.softcap, Decimal.sub(1, this.softcapPower)))
                    .pow(Decimal.div(1, this.softcapPower));
            }
            next = next
                .root(this.gainExp || 1)
                .div(this.gainMult || 1)
                .root(this.exponent || 1)
                .times(this.requires!)
                .max(this.requires!);
            if (this.roundUpCost) {
                next = next.ceil();
            }
            return next;
        }
        // Unknown prestige type
        return new Decimal(0);
    },
    nextAtMax() {
        if (!this.canBuyMax || this.type !== "static") {
            return this.nextAt;
        }
        const amount = player.layers[this.layer].points
            .plus(this.resetGain)
            .div(this.directMult || 1);
        const extraCost = Decimal.pow(
            this.base!,
            amount.pow(this.exponent || 1).div(this.gainExp || 1)
        ).times(this.gainMult || 1);
        let cost = extraCost.times(this.requires!).max(this.requires!);
        if (this.roundUpCost) {
            cost = cost.ceil();
        }
        return cost;
    },
    canReset() {
        if (this.type === "normal") {
            return Decimal.gte(this.baseAmount!, this.requires!);
        }
        if (this.type === "static") {
            return Decimal.gte(this.baseAmount!, this.nextAt);
        }
        return false;
    },
    notify() {
        if (this.upgrades) {
            if (
                Object.values(this.upgrades.data).some(
                    upgrade => upgrade.canAfford && !upgrade.bought && upgrade.unlocked
                )
            ) {
                return true;
            }
        }
        if (this.activeChallenge?.canComplete) {
            return true;
        }
        if (this.subtabs) {
            if (Object.values(this.subtabs).some(subtab => subtab.notify)) {
                return true;
            }
        }
        if (this.microtabs) {
            for (const microtabFamily of Object.values(this.microtabs)) {
                if (Object.values(microtabFamily.data).some(subtab => subtab.notify)) {
                    return true;
                }
            }
        }

        return false;
    },
    resetNotify() {
        if (this.subtabs) {
            if (Object.values(this.subtabs).some(subtab => subtab.prestigeNotify)) {
                return true;
            }
        }
        if (this.microtabs) {
            for (const microtabFamily of Object.values(this.microtabs)) {
                if (Object.values(microtabFamily.data).some(subtab => subtab.prestigeNotify)) {
                    return true;
                }
            }
        }
        if (this.autoPrestige || this.passiveGeneration) {
            return false;
        }
        if (this.type === "static") {
            return this.canReset;
        }
        if (this.type === "normal") {
            return this.canReset && this.resetGain.gte(player.layers[this.layer].points.div(10));
        }
        return false;
    },
    reset(force = false) {
        if (this.type === "none") {
            return;
        }
        if (!force) {
            if (!this.canReset) {
                return;
            }
            this.onPrestige?.(this.resetGain);
            if (player.layers[this.layer].points != undefined) {
                player.layers[this.layer].points = player.layers[this.layer].points.add(
                    this.resetGain
                );
            }
            if (!player.layers[this.layer].unlocked) {
                player.layers[this.layer].unlocked = true;
                if (this.increaseUnlockOrder) {
                    for (const layer in this.increaseUnlockOrder) {
                        player.layers[layer].unlockOrder =
                            (player.layers[layer].unlockOrder || 0) + 1;
                    }
                }
            }
        }

        if (this.resetsNothing) {
            return;
        }

        Object.values(layers)
            .filter(layer => typeof layer.row === "number")
            .forEach(layer => {
                if ((this.row as number) >= (layer.row as number) && (!force || this !== layer)) {
                    this.activeChallenge?.toggle();
                }
            });

        player.points = new Decimal(0);

        Object.values(layers)
            .sort((a, b) => {
                if (typeof a.row !== "number" || typeof b.row !== "number") {
                    return 0;
                }
                return a.row - b.row;
            })
            .forEach(layer => layer.onReset(this.layer));

        if (player.layers[this.layer].resetTime != undefined) {
            player.layers[this.layer].resetTime = new Decimal(0);
        }
    },
    onReset(resettingLayer: string) {
        if (
            typeof layers[resettingLayer].row === "number" &&
            typeof this.row === "number" &&
            (layers[resettingLayer].row as number) > this.row
        ) {
            this.hardReset();
        }
    },
    hardReset(keep = []) {
        if (!isNaN(Number(this.row))) {
            resetLayerData(this.layer, keep);
        }
    }
} as Omit<RawLayer, "id"> & Partial<Pick<RawLayer, "id">> & ThisType<Layer>;

document.onkeydown = function(e) {
    if (player.hasWon && !player.keepGoing) {
        return;
    }
    let key = e.key;
    if (e.shiftKey) {
        key = "shift+" + key;
    }
    if (e.ctrlKey) {
        key = "ctrl+" + key;
    }
    const hotkey = hotkeys.find(hotkey => hotkey.key === key);
    if (hotkey && hotkey.unlocked) {
        e.preventDefault();
        hotkey.press?.();
    }
};
