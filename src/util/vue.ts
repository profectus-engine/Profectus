import { hasWon, pointGain } from "@/data/mod";
import { layers } from "@/game/layers";
import player from "@/game/player";
import { Feature, Features, GridFeatures } from "@/typings/features/feature";
import { Layer } from "@/typings/layer";
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
    return { Decimal, player, layers, hasWon, pointGain, ...numberUtils };
};
export function coerceComponent(
    component: string | ComponentOptions,
    defaultWrapper = "span"
): Component | string {
    if (typeof component === "string") {
        component = component.trim();
        if (!(component in vue._context.components)) {
            if (component.charAt(0) !== "<") {
                component = `<${defaultWrapper}>${component}</${defaultWrapper}>`;
            }

            return defineComponent({
                template: component,
                data,
                inject: ["tab"],
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

export function mapState(properties: Array<string> = []): Record<string, unknown> {
    return properties.reduce((acc: Record<string, unknown>, curr: string): Record<
        string,
        unknown
    > => {
        acc[curr] = () => player[curr];
        return acc;
    }, {});
}

export const InjectLayerMixin = {
    props: {
        layer: {
            type: String,
            default(): string {
                return (inject("tab") as { layer: string }).layer;
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
        filtered: () => Record<string, T> | undefined;
        rows: () => number | undefined;
        cols: () => number | undefined;
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
            filtered(this: { layer: string; [feature]: string[] }) {
                return (
                    (layers[this.layer][feature] as Features<T> | undefined) &&
                    getFiltered((layers[this.layer][feature] as Features<T>).data, this[feature])
                );
            },
            rows(this: { layer: string }) {
                return (
                    (layers[this.layer][feature] as Features<T> | undefined) &&
                    (layers[this.layer][feature] as Features<T> | GridFeatures<T>).rows
                );
            },
            cols(this: { layer: string }) {
                return (
                    (layers[this.layer][feature] as Features<T> | undefined) &&
                    (layers[this.layer][feature] as Features<T> | GridFeatures<T>).cols
                );
            }
        }
    };
}
