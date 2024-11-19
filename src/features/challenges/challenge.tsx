import Toggle from "components/fields/Toggle.vue";
import type { OptionsFunc, Replace } from "features/feature";
import { isVisible } from "features/feature";
import type { Reset } from "features/reset";
import { globalBus } from "game/events";
import type { Persistent } from "game/persistence";
import { persistent } from "game/persistence";
import { Requirements, maxRequirementsMet } from "game/requirements";
import settings, { registerSettingField } from "game/settings";
import type { DecimalSource } from "util/bignum";
import Decimal from "util/bignum";
import { processGetter } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { Renderable, VueFeature, VueFeatureOptions, vueFeatureMixin } from "util/vue";
import type { MaybeRef, MaybeRefOrGetter, Ref, WatchStopHandle } from "vue";
import { computed, unref, watch } from "vue";
import Challenge from "./Challenge.vue";

/** A symbol used to identify {@link Challenge} features. */
export const ChallengeType = Symbol("Challenge");

/**
 * An object that configures a {@link Challenge}.
 */
export interface ChallengeOptions extends VueFeatureOptions {
    /** Whether this challenge can be started. */
    canStart?: MaybeRefOrGetter<boolean>;
    /** The reset function for this challenge. */
    reset?: Reset;
    /** The requirement(s) to complete this challenge. */
    requirements: Requirements;
    /** The maximum number of times the challenge can be completed. */
    completionLimit?: MaybeRefOrGetter<DecimalSource>;
    /** The display to use for this challenge. */
    display?:
        | MaybeRefOrGetter<Renderable>
        | {
              /** A header to appear at the top of the display. */
              title?: MaybeRefOrGetter<Renderable>;
              /** The main text that appears in the display. */
              description: MaybeRefOrGetter<Renderable>;
              /** A description of the current goal for this challenge. If unspecified then the requirements will be displayed automatically based on {@link requirements}.  */
              goal?: MaybeRefOrGetter<Renderable>;
              /** A description of what will change upon completing this challenge. */
              reward?: MaybeRefOrGetter<Renderable>;
              /** A description of the current effect of this challenge. */
              effectDisplay?: MaybeRefOrGetter<Renderable>;
          };
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
export interface BaseChallenge extends VueFeature {
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
}

/** An object that represents a feature that can be entered and exited, and have one or more completions with scaling requirements. */
export type Challenge = Replace<
    Replace<ChallengeOptions, BaseChallenge>,
    {
        canStart: MaybeRef<boolean>;
        completionLimit: MaybeRef<DecimalSource>;
        display?:
            | MaybeRef<Renderable>
            | {
                  title?: MaybeRef<Renderable>;
                  description: MaybeRef<Renderable>;
                  goal?: MaybeRef<Renderable>;
                  reward?: MaybeRef<Renderable>;
                  effectDisplay?: MaybeRef<Renderable>;
              };
    }
>;

/**
 * Lazily creates a challenge with the given options.
 * @param optionsFunc Challenge options.
 */
export function createChallenge<T extends ChallengeOptions>(
    optionsFunc: OptionsFunc<T, BaseChallenge, Challenge>
) {
    const completions = persistent<DecimalSource>(0);
    const active = persistent<boolean>(false, false);
    return createLazyProxy(feature => {
        const options = optionsFunc.call(feature, feature as Challenge);
        const {
            requirements,
            canStart,
            completionLimit,
            display,
            reset,
            onComplete,
            onEnter,
            onExit,
            ...props
        } = options;

        const vueFeature = vueFeatureMixin("challenge", options, () => (
            <Challenge
                active={challenge.active}
                maxed={challenge.maxed}
                canComplete={challenge.canComplete}
                display={challenge.display}
                requirements={challenge.requirements}
                completed={challenge.completed}
                canStart={challenge.canStart}
                toggle={challenge.toggle}
            />
        ));

        const challenge = {
            type: ChallengeType,
            ...(props as Omit<typeof props, keyof VueFeature | keyof ChallengeOptions>),
            ...vueFeature,
            completions,
            active,
            completed: computed(() => Decimal.gt(completions.value, 0)),
            canComplete: computed(() => maxRequirementsMet(requirements)),
            maxed: computed((): boolean =>
                Decimal.gte(completions.value, unref(challenge.completionLimit))
            ),
            canStart: processGetter(canStart) ?? true,
            completionLimit: processGetter(completionLimit) ?? 1,
            requirements,
            reset,
            onComplete,
            onEnter,
            onExit,
            display:
                display == null
                    ? undefined
                    : typeof display === "object" && "description" in display
                      ? {
                            title: processGetter(display.title),
                            description: processGetter(display.description),
                            goal: processGetter(display.goal),
                            reward: processGetter(display.reward),
                            effectDisplay: processGetter(display.effectDisplay)
                        }
                      : processGetter(display),
            toggle: function () {
                if (active.value) {
                    if (
                        Decimal.gt(unref(challenge.canComplete), 0) &&
                        !unref<boolean>(challenge.maxed)
                    ) {
                        const newCompletions = unref(challenge.canComplete);
                        completions.value = Decimal.min(
                            Decimal.add(challenge.completions.value, newCompletions),
                            unref(challenge.completionLimit)
                        );
                        onComplete?.();
                    }
                    active.value = false;
                    onExit?.();
                    reset?.reset();
                } else if (
                    unref<boolean>(challenge.canStart) &&
                    isVisible(unref(challenge.visibility) ?? true) &&
                    !unref<boolean>(challenge.maxed)
                ) {
                    challenge.reset?.reset();
                    active.value = true;
                    onEnter?.();
                }
            },
            complete: function (remainInChallenge?: boolean) {
                const newCompletions = unref(challenge.canComplete);
                if (
                    active.value &&
                    Decimal.gt(newCompletions, 0) &&
                    !unref<boolean>(challenge.maxed)
                ) {
                    completions.value = Decimal.min(
                        Decimal.add(challenge.completions.value, newCompletions),
                        unref(challenge.completionLimit)
                    );
                    onComplete?.();
                    if (remainInChallenge !== true) {
                        active.value = false;
                        onExit?.();
                        reset?.reset();
                    }
                }
            }
        } satisfies Challenge;

        if (challenge.reset != null) {
            globalBus.on("reset", currentReset => {
                if (currentReset === challenge.reset && active.value) {
                    challenge.toggle();
                }
            });
        }

        return challenge;
    });
}

/**
 * This will automatically complete a challenge when it's requirements are met.
 * @param challenge The challenge to auto-complete
 * @param autoActive Whether or not auto-completing should currently occur
 * @param exitOnComplete Whether or not to exit the challenge after auto-completion
 */
export function setupAutoComplete(
    challenge: Challenge,
    autoActive: MaybeRefOrGetter<boolean> = true,
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
export function createActiveChallenge(challenges: Challenge[]): Ref<Challenge | null> {
    return computed(() => challenges.find(challenge => challenge.active.value) ?? null);
}

/**
 * Utility for reporting if any challenge in a list is currently active. Intended for preventing entering a challenge if another is already active.
 * @param challenges List of challenges that are mutually exclusive
 */
export function isAnyChallengeActive(
    challenges: Challenge[] | Ref<Challenge | null>
): Ref<boolean> {
    if (Array.isArray(challenges)) {
        challenges = createActiveChallenge(challenges);
    }
    return computed(() => (challenges as Ref<Challenge | null>).value != null);
}

declare module "game/settings" {
    interface Settings {
        hideChallenges: boolean;
    }
}

globalBus.on("loadSettings", settings => {
    settings.hideChallenges ??= false;
});

globalBus.on("setupVue", () =>
    registerSettingField(() => (
        <Toggle
            title={
                <span class="option-title">
                    Hide maxed challenges
                    <desc>Hide challenges that have been fully completed.</desc>
                </span>
            }
            onUpdate:modelValue={value => (settings.hideChallenges = value)}
            modelValue={settings.hideChallenges}
        />
    ))
);
