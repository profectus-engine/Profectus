import { isArray } from "@vue/shared";
import Toggle from "components/fields/Toggle.vue";
import ChallengeComponent from "features/challenges/Challenge.vue";
import type { CoercableComponent, OptionsFunc, Replace, StyleValue } from "features/feature";
import { Component, GatherProps, getUniqueID, jsx, setDefault, Visibility } from "features/feature";
import type { GenericReset } from "features/reset";
import type { Resource } from "features/resources/resource";
import { globalBus } from "game/events";
import type { Persistent } from "game/persistence";
import { persistent } from "game/persistence";
import settings, { registerSettingField } from "game/settings";
import type { DecimalSource } from "util/bignum";
import Decimal from "util/bignum";
import type {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    ProcessedComputable
} from "util/computed";
import { processComputable } from "util/computed";
import { createLazyProxy } from "util/proxies";
import type { Ref, WatchStopHandle } from "vue";
import { computed, unref, watch } from "vue";

export const ChallengeType = Symbol("ChallengeType");

export interface ChallengeOptions {
    visibility?: Computable<Visibility>;
    canStart?: Computable<boolean>;
    reset?: GenericReset;
    canComplete?: Computable<boolean | DecimalSource>;
    completionLimit?: Computable<DecimalSource>;
    mark?: Computable<boolean | string>;
    resource?: Resource;
    goal?: Computable<DecimalSource>;
    classes?: Computable<Record<string, boolean>>;
    style?: Computable<StyleValue>;
    display?: Computable<
        | CoercableComponent
        | {
              title?: CoercableComponent;
              description: CoercableComponent;
              goal?: CoercableComponent;
              reward?: CoercableComponent;
              effectDisplay?: CoercableComponent;
          }
    >;
    onComplete?: VoidFunction;
    onExit?: VoidFunction;
    onEnter?: VoidFunction;
}

export interface BaseChallenge {
    id: string;
    completions: Persistent<DecimalSource>;
    completed: Ref<boolean>;
    maxed: Ref<boolean>;
    active: Persistent<boolean>;
    toggle: VoidFunction;
    complete: (remainInChallenge?: boolean) => void;
    type: typeof ChallengeType;
    [Component]: typeof ChallengeComponent;
    [GatherProps]: () => Record<string, unknown>;
}

export type Challenge<T extends ChallengeOptions> = Replace<
    T & BaseChallenge,
    {
        visibility: GetComputableTypeWithDefault<T["visibility"], Visibility.Visible>;
        canStart: GetComputableTypeWithDefault<T["canStart"], true>;
        canComplete: GetComputableTypeWithDefault<T["canComplete"], Ref<boolean>>;
        completionLimit: GetComputableTypeWithDefault<T["completionLimit"], 1>;
        mark: GetComputableTypeWithDefault<T["mark"], Ref<boolean>>;
        goal: GetComputableType<T["goal"]>;
        classes: GetComputableType<T["classes"]>;
        style: GetComputableType<T["style"]>;
        display: GetComputableType<T["display"]>;
    }
>;

export type GenericChallenge = Replace<
    Challenge<ChallengeOptions>,
    {
        visibility: ProcessedComputable<Visibility>;
        canStart: ProcessedComputable<boolean>;
        canComplete: ProcessedComputable<boolean | DecimalSource>;
        completionLimit: ProcessedComputable<DecimalSource>;
        mark: ProcessedComputable<boolean>;
    }
>;

export function createChallenge<T extends ChallengeOptions>(
    optionsFunc: OptionsFunc<T, BaseChallenge, GenericChallenge>
): Challenge<T> {
    const completions = persistent(0);
    const active = persistent(false);
    return createLazyProxy(() => {
        const challenge = optionsFunc();

        if (
            challenge.canComplete == null &&
            (challenge.resource == null || challenge.goal == null)
        ) {
            console.warn(
                "Cannot create challenge without a canComplete property or a resource and goal property",
                challenge
            );
            throw "Cannot create challenge without a canComplete property or a resource and goal property";
        }

        challenge.id = getUniqueID("challenge-");
        challenge.type = ChallengeType;
        challenge[Component] = ChallengeComponent;

        challenge.completions = completions;
        challenge.active = active;
        challenge.completed = computed(() =>
            Decimal.gt((challenge as GenericChallenge).completions.value, 0)
        );
        challenge.maxed = computed(() =>
            Decimal.gte(
                (challenge as GenericChallenge).completions.value,
                unref((challenge as GenericChallenge).completionLimit)
            )
        );
        challenge.toggle = function () {
            const genericChallenge = challenge as GenericChallenge;
            if (genericChallenge.active.value) {
                if (unref(genericChallenge.canComplete) && !genericChallenge.maxed.value) {
                    let completions: boolean | DecimalSource = unref(genericChallenge.canComplete);
                    if (typeof completions === "boolean") {
                        completions = 1;
                    }
                    genericChallenge.completions.value = Decimal.min(
                        Decimal.add(genericChallenge.completions.value, completions),
                        unref(genericChallenge.completionLimit)
                    );
                    genericChallenge.onComplete?.();
                }
                genericChallenge.active.value = false;
                genericChallenge.onExit?.();
                genericChallenge.reset?.reset();
            } else if (
                unref(genericChallenge.canStart) &&
                unref(genericChallenge.visibility) === Visibility.Visible &&
                !genericChallenge.maxed.value
            ) {
                genericChallenge.reset?.reset();
                genericChallenge.active.value = true;
                genericChallenge.onEnter?.();
            }
        };
        challenge.complete = function (remainInChallenge?: boolean) {
            const genericChallenge = challenge as GenericChallenge;
            let completions: boolean | DecimalSource = unref(genericChallenge.canComplete);
            if (
                genericChallenge.active.value &&
                completions !== false &&
                (completions === true || Decimal.neq(0, completions)) &&
                !genericChallenge.maxed.value
            ) {
                if (typeof completions === "boolean") {
                    completions = 1;
                }
                genericChallenge.completions.value = Decimal.min(
                    Decimal.add(genericChallenge.completions.value, completions),
                    unref(genericChallenge.completionLimit)
                );
                genericChallenge.onComplete?.();
                if (remainInChallenge !== true) {
                    genericChallenge.active.value = false;
                    genericChallenge.onExit?.();
                    genericChallenge.reset?.reset();
                }
            }
        };
        processComputable(challenge as T, "visibility");
        setDefault(challenge, "visibility", Visibility.Visible);
        const visibility = challenge.visibility as ProcessedComputable<Visibility>;
        challenge.visibility = computed(() => {
            if (settings.hideChallenges === true && unref(challenge.maxed)) {
                return Visibility.None;
            }
            return unref(visibility);
        });
        if (challenge.canComplete == null) {
            challenge.canComplete = computed(() => {
                const genericChallenge = challenge as GenericChallenge;
                if (
                    !genericChallenge.active.value ||
                    genericChallenge.resource == null ||
                    genericChallenge.goal == null
                ) {
                    return false;
                }
                return Decimal.gte(genericChallenge.resource.value, unref(genericChallenge.goal));
            });
        }
        if (challenge.mark == null) {
            challenge.mark = computed(
                () =>
                    Decimal.gt(unref((challenge as GenericChallenge).completionLimit), 1) &&
                    !!unref(challenge.maxed)
            );
        }

        processComputable(challenge as T, "canStart");
        setDefault(challenge, "canStart", true);
        processComputable(challenge as T, "canComplete");
        processComputable(challenge as T, "completionLimit");
        setDefault(challenge, "completionLimit", 1);
        processComputable(challenge as T, "mark");
        processComputable(challenge as T, "goal");
        processComputable(challenge as T, "classes");
        processComputable(challenge as T, "style");
        processComputable(challenge as T, "display");

        if (challenge.reset != null) {
            globalBus.on("reset", currentReset => {
                if (currentReset === challenge.reset && (challenge.active as Ref<boolean>).value) {
                    (challenge.toggle as VoidFunction)();
                }
            });
        }

        challenge[GatherProps] = function (this: GenericChallenge) {
            const {
                active,
                maxed,
                canComplete,
                display,
                visibility,
                style,
                classes,
                completed,
                canStart,
                mark,
                id,
                toggle
            } = this;
            return {
                active,
                maxed,
                canComplete,
                display,
                visibility,
                style: unref(style),
                classes,
                completed,
                canStart,
                mark,
                id,
                toggle
            };
        };

        return challenge as unknown as Challenge<T>;
    });
}

export function setupAutoComplete(
    challenge: GenericChallenge,
    autoActive: Computable<boolean> = true,
    exitOnComplete = true
): WatchStopHandle {
    const isActive = typeof autoActive === "function" ? computed(autoActive) : autoActive;
    return watch([challenge.canComplete, isActive], ([canComplete, isActive]) => {
        if (canComplete && isActive) {
            challenge.complete(!exitOnComplete);
        }
    });
}

export function createActiveChallenge(
    challenges: GenericChallenge[]
): Ref<GenericChallenge | undefined> {
    return computed(() => challenges.find(challenge => challenge.active.value));
}

export function isAnyChallengeActive(
    challenges: GenericChallenge[] | Ref<GenericChallenge | undefined>
): Ref<boolean> {
    if (isArray(challenges)) {
        challenges = createActiveChallenge(challenges);
    }
    return computed(() => (challenges as Ref<GenericChallenge | undefined>).value != null);
}

declare module "game/settings" {
    interface Settings {
        hideChallenges: boolean;
    }
}

globalBus.on("loadSettings", settings => {
    setDefault(settings, "hideChallenges", false);
});

registerSettingField(
    jsx(() => (
        <Toggle
            title="Hide Maxed Challenges"
            onUpdate:modelValue={value => (settings.hideChallenges = value)}
            modelValue={settings.hideChallenges}
        />
    ))
);
