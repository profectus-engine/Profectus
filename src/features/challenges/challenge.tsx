import { isArray } from "@vue/shared";
import Toggle from "components/fields/Toggle.vue";
import ChallengeComponent from "features/challenges/Challenge.vue";
import type {
    CoercableComponent,
    GenericComponent,
    OptionsFunc,
    Replace,
    StyleValue
} from "features/feature";
import {
    Component,
    GatherProps,
    getUniqueID,
    isVisible,
    jsx,
    setDefault,
    Visibility
} from "features/feature";
import type { GenericReset } from "features/reset";
import { globalBus } from "game/events";
import type { Persistent } from "game/persistence";
import { persistent } from "game/persistence";
import { maxRequirementsMet, Requirements } from "game/requirements";
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
    visibility?: Computable<Visibility | boolean>;
    canStart?: Computable<boolean>;
    reset?: GenericReset;
    requirements: Requirements;
    maximize?: Computable<boolean>;
    completionLimit?: Computable<DecimalSource>;
    mark?: Computable<boolean | string>;
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
    canComplete: Ref<DecimalSource>;
    completions: Persistent<DecimalSource>;
    completed: Ref<boolean>;
    maxed: Ref<boolean>;
    active: Persistent<boolean>;
    toggle: VoidFunction;
    complete: (remainInChallenge?: boolean) => void;
    type: typeof ChallengeType;
    [Component]: GenericComponent;
    [GatherProps]: () => Record<string, unknown>;
}

export type Challenge<T extends ChallengeOptions> = Replace<
    T & BaseChallenge,
    {
        visibility: GetComputableTypeWithDefault<T["visibility"], Visibility.Visible>;
        canStart: GetComputableTypeWithDefault<T["canStart"], true>;
        requirements: GetComputableType<T["requirements"]>;
        maximize: GetComputableType<T["maximize"]>;
        completionLimit: GetComputableTypeWithDefault<T["completionLimit"], 1>;
        mark: GetComputableTypeWithDefault<T["mark"], Ref<boolean>>;
        classes: GetComputableType<T["classes"]>;
        style: GetComputableType<T["style"]>;
        display: GetComputableType<T["display"]>;
    }
>;

export type GenericChallenge = Replace<
    Challenge<ChallengeOptions>,
    {
        visibility: ProcessedComputable<Visibility | boolean>;
        canStart: ProcessedComputable<boolean>;
        completionLimit: ProcessedComputable<DecimalSource>;
        mark: ProcessedComputable<boolean>;
    }
>;

export function createChallenge<T extends ChallengeOptions>(
    optionsFunc: OptionsFunc<T, BaseChallenge, GenericChallenge>
): Challenge<T> {
    const completions = persistent(0);
    const active = persistent(false, false);
    return createLazyProxy(() => {
        const challenge = optionsFunc();

        challenge.id = getUniqueID("challenge-");
        challenge.type = ChallengeType;
        challenge[Component] = ChallengeComponent as GenericComponent;

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
                if (
                    Decimal.gt(unref(genericChallenge.canComplete), 0) &&
                    !genericChallenge.maxed.value
                ) {
                    const completions = unref(genericChallenge.canComplete);
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
                isVisible(genericChallenge.visibility) &&
                !genericChallenge.maxed.value
            ) {
                genericChallenge.reset?.reset();
                genericChallenge.active.value = true;
                genericChallenge.onEnter?.();
            }
        };
        challenge.canComplete = computed(() =>
            Decimal.max(
                maxRequirementsMet((challenge as GenericChallenge).requirements),
                unref((challenge as GenericChallenge).maximize) ? Decimal.dInf : 1
            )
        );
        challenge.complete = function (remainInChallenge?: boolean) {
            const genericChallenge = challenge as GenericChallenge;
            const completions = unref(genericChallenge.canComplete);
            if (
                genericChallenge.active.value &&
                Decimal.gt(completions, 0) &&
                !genericChallenge.maxed.value
            ) {
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
        const visibility = challenge.visibility as ProcessedComputable<Visibility | boolean>;
        challenge.visibility = computed(() => {
            if (settings.hideChallenges === true && unref(challenge.maxed)) {
                return Visibility.None;
            }
            return unref(visibility);
        });
        if (challenge.mark == null) {
            challenge.mark = computed(
                () =>
                    Decimal.gt(unref((challenge as GenericChallenge).completionLimit), 1) &&
                    !!unref(challenge.maxed)
            );
        }

        processComputable(challenge as T, "canStart");
        setDefault(challenge, "canStart", true);
        processComputable(challenge as T, "maximize");
        processComputable(challenge as T, "completionLimit");
        setDefault(challenge, "completionLimit", 1);
        processComputable(challenge as T, "mark");
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
    return watch(
        [challenge.canComplete as Ref<DecimalSource>, isActive as Ref<boolean>],
        ([canComplete, isActive]) => {
            if (Decimal.gt(canComplete, 0) && isActive) {
                challenge.complete(!exitOnComplete);
            }
        }
    );
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
            title={jsx(() => (
                <span class="option-title">
                    Hide maxed challenges
                    <desc>Hide challenges that have been fully completed.</desc>
                </span>
            ))}
            onUpdate:modelValue={value => (settings.hideChallenges = value)}
            modelValue={settings.hideChallenges}
        />
    ))
);
