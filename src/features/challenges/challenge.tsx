import { isArray } from "@vue/shared";
import Toggle from "components/fields/Toggle.vue";
import ChallengeComponent from "features/challenges/Challenge.vue";
import { GenericDecorator } from "features/decorators/common";
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
    Visibility,
    getUniqueID,
    isVisible,
    jsx,
    setDefault
} from "features/feature";
import type { GenericReset } from "features/reset";
import { globalBus } from "game/events";
import type { Persistent } from "game/persistence";
import { persistent } from "game/persistence";
import { Requirements, maxRequirementsMet } from "game/requirements";
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

/** A symbol used to identify {@link Challenge} features. */
export const ChallengeType = Symbol("Challenge");

/**
 * An object that configures a {@link Challenge}.
 */
export interface ChallengeOptions {
    /** Whether this challenge should be visible. */
    visibility?: Computable<Visibility | boolean>;
    /** Whether this challenge can be started. */
    canStart?: Computable<boolean>;
    /** The reset function for this challenge. */
    reset?: GenericReset;
    /** The requirement(s) to complete this challenge. */
    requirements: Requirements;
    /** The maximum number of times the challenge can be completed. */
    completionLimit?: Computable<DecimalSource>;
    /** Shows a marker on the corner of the feature. */
    mark?: Computable<boolean | string>;
    /** Dictionary of CSS classes to apply to this feature. */
    classes?: Computable<Record<string, boolean>>;
    /** CSS to apply to this feature. */
    style?: Computable<StyleValue>;
    /** The display to use for this challenge. */
    display?: Computable<
        | CoercableComponent
        | {
              /** A header to appear at the top of the display. */
              title?: CoercableComponent;
              /** The main text that appears in the display. */
              description: CoercableComponent;
              /** A description of the current goal for this challenge. If unspecified then the requirements will be displayed automatically based on {@link requirements}.  */
              goal?: CoercableComponent;
              /** A description of what will change upon completing this challenge. */
              reward?: CoercableComponent;
              /** A description of the current effect of this challenge. */
              effectDisplay?: CoercableComponent;
          }
    >;
    /** A function that is called when the challenge is completed. */
    onComplete?: VoidFunction;
    /** A function that is called when the challenge is exited. */
    onExit?: VoidFunction;
    /** A function that is called when the challenge is entered. */
    onEnter?: VoidFunction;
}

/**
 * The properties that are added onto a processed {@link ChallengeOptions} to create a {@link Challenge}.
 */
export interface BaseChallenge {
    /** An auto-generated ID for identifying features that appear in the DOM. Will not persist between refreshes or updates. */
    id: string;
    /** The current amount of times this challenge can be completed. */
    canComplete: Ref<DecimalSource>;
    /** The current number of times this challenge has been completed. */
    completions: Persistent<DecimalSource>;
    /** Whether or not this challenge has been completed. */
    completed: Ref<boolean>;
    /** Whether or not this challenge's completion count is at its limit. */
    maxed: Ref<boolean>;
    /** Whether or not this challenge is currently active. */
    active: Persistent<boolean>;
    /** A function to enter or leave the challenge. */
    toggle: VoidFunction;
    /**
     * A function to complete this challenge.
     * @param remainInChallenge - Optional parameter to specify if the challenge should remain active after completion.
     */
    complete: (remainInChallenge?: boolean) => void;
    /** A symbol that helps identify features of the same type. */
    type: typeof ChallengeType;
    /** The Vue component used to render this feature. */
    [Component]: GenericComponent;
    /** A function to gather the props the vue component requires for this feature. */
    [GatherProps]: () => Record<string, unknown>;
}

/** An object that represents a feature that can be entered and exited, and have one or more completions with scaling requirements. */
export type Challenge<T extends ChallengeOptions> = Replace<
    T & BaseChallenge,
    {
        visibility: GetComputableTypeWithDefault<T["visibility"], Visibility.Visible>;
        canStart: GetComputableTypeWithDefault<T["canStart"], true>;
        requirements: GetComputableType<T["requirements"]>;
        completionLimit: GetComputableTypeWithDefault<T["completionLimit"], 1>;
        mark: GetComputableTypeWithDefault<T["mark"], Ref<boolean>>;
        classes: GetComputableType<T["classes"]>;
        style: GetComputableType<T["style"]>;
        display: GetComputableType<T["display"]>;
    }
>;

/** A type that matches any valid {@link Challenge} object. */
export type GenericChallenge = Replace<
    Challenge<ChallengeOptions>,
    {
        visibility: ProcessedComputable<Visibility | boolean>;
        canStart: ProcessedComputable<boolean>;
        completionLimit: ProcessedComputable<DecimalSource>;
        mark: ProcessedComputable<boolean>;
    }
>;

/**
 * Lazily creates a challenge with the given options.
 * @param optionsFunc Challenge options.
 */
export function createChallenge<T extends ChallengeOptions>(
    optionsFunc: OptionsFunc<T, BaseChallenge, GenericChallenge>,
    ...decorators: GenericDecorator[]
): Challenge<T> {
    const completions = persistent(0);
    const active = persistent(false, false);
    const decoratedData = decorators.reduce(
        (current, next) => Object.assign(current, next.getPersistentData?.()),
        {}
    );
    return createLazyProxy(feature => {
        const challenge = optionsFunc.call(feature, feature);

        challenge.id = getUniqueID("challenge-");
        challenge.type = ChallengeType;
        challenge[Component] = ChallengeComponent as GenericComponent;

        for (const decorator of decorators) {
            decorator.preConstruct?.(challenge);
        }

        challenge.completions = completions;
        challenge.active = active;
        Object.assign(challenge, decoratedData);

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
            maxRequirementsMet((challenge as GenericChallenge).requirements)
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

        for (const decorator of decorators) {
            decorator.postConstruct?.(challenge);
        }

        const decoratedProps = decorators.reduce(
            (current, next) => Object.assign(current, next.getGatheredProps?.(challenge)),
            {}
        );
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
                toggle,
                requirements
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
                toggle,
                requirements,
                ...decoratedProps
            };
        };

        return challenge as unknown as Challenge<T>;
    });
}

/**
 * This will automatically complete a challenge when it's requirements are met.
 * @param challenge The challenge to auto-complete
 * @param autoActive Whether or not auto-completing should currently occur
 * @param exitOnComplete Whether or not to exit the challenge after auto-completion
 */
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

/**
 * Utility for taking an array of challenges where only one may be active at a time, and giving a ref to the one currently active (or null if none are active)
 * @param challenges The list of challenges that are mutually exclusive
 */
export function createActiveChallenge(
    challenges: GenericChallenge[]
): Ref<GenericChallenge | null> {
    return computed(() => challenges.find(challenge => challenge.active.value) ?? null);
}

/**
 * Utility for reporting if any challenge in a list is currently active. Intended for preventing entering a challenge if another is already active.
 * @param challenges List of challenges that are mutually exclusive
 */
export function isAnyChallengeActive(
    challenges: GenericChallenge[] | Ref<GenericChallenge | null>
): Ref<boolean> {
    if (isArray(challenges)) {
        challenges = createActiveChallenge(challenges);
    }
    return computed(() => (challenges as Ref<GenericChallenge | null>).value != null);
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
