import { layers } from "@/game/layers";
import { GridCell } from "@/typings/features/grid";
import { State } from "@/typings/state";
import Decimal, { DecimalSource } from "@/util/bignum";

export function hasUpgrade(layer: string, id: string | number): boolean | undefined {
    return layers[layer].upgrades?.data[id].bought;
}

export function hasMilestone(layer: string, id: string | number): boolean | undefined {
    return layers[layer].milestones?.data[id].earned;
}

export function hasAchievement(layer: string, id: string | number): boolean | undefined {
    return layers[layer].achievements?.data[id].earned;
}

export function hasChallenge(layer: string, id: string | number): boolean | undefined {
    return layers[layer].challenges?.data[id].completed;
}

export function maxedChallenge(layer: string, id: string | number): boolean | undefined {
    return layers[layer].challenges?.data[id].maxed;
}

export function challengeCompletions(
    layer: string,
    id: string | number
): DecimalSource | undefined {
    return layers[layer].challenges?.data[id].completions;
}

export function inChallenge(layer: string, id: string | number): boolean | undefined {
    return layers[layer].challenges?.data[id].active;
}

export function getBuyableAmount(layer: string, id: string | number): Decimal | undefined {
    return layers[layer].buyables?.data[id].amount;
}

export function setBuyableAmount(layer: string, id: string | number, amt: Decimal): void {
    if (layers[layer].buyables?.data[id]) {
        layers[layer].buyables!.data[id].amount = amt;
    }
}

export function getClickableState(layer: string, id: string | number): State | undefined {
    return layers[layer].clickables?.data[id].state;
}

export function setClickableState(layer: string, id: string | number, state: State): void {
    if (layers[layer].clickables?.data[id]) {
        layers[layer].clickables!.data[id].state = state;
    }
}

export function getGridData(layer: string, id: string | number, cell: string): State | undefined {
    return (layers[layer].grids?.data[id][cell] as GridCell).effect;
}

export function setGridData(layer: string, id: string | number, cell: string, data: State): void {
    if (layers[layer].grids?.data[id][cell]) {
        layers[layer].grids!.data[id][cell] = data;
    }
}

export function upgradeEffect(layer: string, id: string | number): State | undefined {
    return layers[layer].upgrades?.data[id].effect;
}

export function challengeEffect(layer: string, id: string | number): State | undefined {
    return layers[layer].challenges?.data[id].effect;
}

export function buyableEffect(layer: string, id: string | number): State | undefined {
    return layers[layer].buyables?.data[id].effect;
}

export function clickableEffect(layer: string, id: string | number): State | undefined {
    return layers[layer].clickables?.data[id].effect;
}

export function achievementEffect(layer: string, id: string | number): State | undefined {
    return layers[layer].achievements?.data[id].effect;
}

export function gridEffect(layer: string, id: string, cell: string | number): State | undefined {
    return (layers[layer].grids?.data[id][cell] as GridCell).effect;
}
