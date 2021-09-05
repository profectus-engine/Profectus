import { hasWon, pointGain } from "@/data/mod";
import { layers } from "@/game/layers";
import player from "@/game/player";
import settings from "@/game/settings";
import state from "@/game/state";
import { Feature, Features, GridFeatures } from "@/typings/features/feature";
import { Layer } from "@/typings/layer";
import { PlayerData } from "@/typings/player";
import { Settings } from "@/typings/settings";
import { Transient } from "@/typings/transient";
import { App, Component, ComponentOptions, defineComponent, inject, PropType } from "vue";
import Decimal, * as numberUtils from "./bignum";
import {
    achievementEffect,
    buyableEffect,
    challengeCompletions,
    challengeEffect,
    clickableEffect,
    getBuyableAmount,
    getClickableState,
    getGridData,
    gridEffect,
    hasAchievement,
    hasChallenge,
    hasMilestone,
    hasUpgrade,
    inChallenge,
    maxedChallenge,
    setBuyableAmount,
    setClickableState,
    setGridData,
    upgradeEffect
} from "./features";

let vue: App;
export function setVue(vm: App): void {
    vue = vm;
}

// Pass in various data that the template could potentially use
const data = function(): Record<string, unknown> {
    return { Decimal, player, state, settings, layers, hasWon, pointGain, ...numberUtils };
};
export function coerceComponent(
    component: string | ComponentOptions | Component,
    defaultWrapper = "span",
    allowComponentNames = true
): Component | string {
    if (typeof component === "string") {
        component = component.trim();
        if (!allowComponentNames || !(component in vue._context.components)) {
            if (component.charAt(0) !== "<") {
                component = `<${defaultWrapper}>${component}</${defaultWrapper}>`;
            }

            return defineComponent({
                template: component,
                data,
                mixins: [InjectLayerMixin],
                methods: {
                    hasUpgrade,
                    hasMilestone,
                    hasAchievement,
                    hasChallenge,
                    maxedChallenge,
                    challengeCompletions,
                    inChallenge,
                    getBuyableAmount,
                    setBuyableAmount,
                    getClickableState,
                    setClickableState,
                    getGridData,
                    setGridData,
                    upgradeEffect,
                    challengeEffect,
                    buyableEffect,
                    clickableEffect,
                    achievementEffect,
                    gridEffect
                }
            });
        }
    }
    return component;
}

export function getFiltered<T>(
    objects: Record<string, T>,
    filter?: Array<string>
): Record<string, T> {
    if (filter != null) {
        filter = filter.map(v => v.toString());
        return Object.keys(objects)
            .filter(key => filter!.includes(key))
            .reduce((acc: Record<string, T>, curr: string) => {
                acc[curr] = objects[curr];
                return acc;
            }, {});
    }
    return objects;
}

type OmitIndex<T> = {
    [K in keyof T as unknown extends Record<K, 1> ? never : K]: T[K];
};

export function mapPlayer<K extends keyof OmitIndex<PlayerData>>(
    properties: K[] = []
): {
    [P in K]: () => PlayerData[P];
} {
    return properties.reduce((acc, curr: keyof PlayerData) => {
        acc[curr] = () => player[curr];
        return acc;
    }, {} as any);
}

export function mapSettings<K extends keyof OmitIndex<Settings>>(
    properties: K[] = []
): {
    [P in K]: () => Settings[P];
} {
    return properties.reduce((acc, curr: keyof Settings) => {
        acc[curr] = () => settings[curr];
        return acc;
    }, {} as any);
}

export function mapState<K extends keyof OmitIndex<Transient>>(
    properties: K[] = []
): {
    [P in K]: () => Transient[P];
} {
    return properties.reduce((acc, curr: keyof Transient) => {
        acc[curr] = () => state[curr];
        return acc;
    }, {} as any);
}

export const InjectLayerMixin = {
    props: {
        layer: {
            type: String,
            default(): string {
                return (inject("tab", { layer: "" }) as { layer: string }).layer;
            }
        }
    }
};

export function FilteredFeaturesMixin<T extends Feature>(
    feature: keyof Layer
): {
    mixins: [typeof InjectLayerMixin];
    props: {
        [feature]: {
            type: PropType<Array<string>>;
        };
    };
    computed: {
        filtered: (this: { layer: string; [feature]: string[] }) => Record<string, T> | undefined;
        rows: (this: { layer: string }) => number | undefined;
        cols: (this: { layer: string }) => number | undefined;
    };
} {
    return {
        mixins: [InjectLayerMixin],
        props: {
            [feature]: {
                type: Object as PropType<Array<string>>
            }
        },
        computed: {
            filtered() {
                return (
                    (layers[this.layer][feature] as Features<T> | undefined) &&
                    getFiltered((layers[this.layer][feature] as Features<T>).data, this[feature])
                );
            },
            rows() {
                return (
                    (layers[this.layer][feature] as Features<T> | undefined) &&
                    (layers[this.layer][feature] as Features<T> | GridFeatures<T>).rows
                );
            },
            cols() {
                return (
                    (layers[this.layer][feature] as Features<T> | undefined) &&
                    (layers[this.layer][feature] as Features<T> | GridFeatures<T>).cols
                );
            }
        }
    };
}
