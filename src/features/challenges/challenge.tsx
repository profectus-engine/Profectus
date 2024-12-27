import Toggle from "components/fields/Toggle.vue";
import { isVisible } from "features/feature";
import type { Reset } from "features/reset";
import { globalBus } from "game/events";
import type { Persistent } from "game/persistence";
import { persistent } from "game/persistence";
import { Requirements, displayRequirements, maxRequirementsMet } from "game/requirements";
import settings, { registerSettingField } from "game/settings";
import type { DecimalSource } from "util/bignum";
import Decimal from "util/bignum";
import { MaybeGetter, processGetter } from "util/computed";
import { createLazyProxy } from "util/proxies";
import {
    Renderable,
    VueFeature,
    VueFeatureOptions,
    isJSXElement,
    render,
    vueFeatureMixin
} from "util/vue";
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
        | MaybeGetter<Renderable>
        | {
              /** A header to appear at the top of the display. */
              title?: MaybeGetter<Renderable>;
              /** The main text that appears in the display. */
              description: MaybeGetter<Renderable>;
              /** A description of the current goal for this challenge. If unspecified then the requirements will be displayed automatically based on {@link requirements}.  */
              goal?: MaybeGetter<Renderable>;
              /** A description of what will change upon completing this challenge. */
              reward?: MaybeGetter<Renderable>;
              /** A description of the current effect of this challenge. */
              effectDisplay?: MaybeGetter<Renderable>;
          };
    /** A function that is called when the challenge is completed. */
    onComplete?: VoidFunction;
    /** A function that is called when the challenge is exited. */
    onExit?: VoidFunction;
    /** A function that is called when the challenge is entered. */
    onEnter?: VoidFunction;
}

/** An object that represents a feature that can be entered and exited, and have one or more completions with scaling requirements. */
export interface Challenge extends VueFeature {
    /** The reset function for this challenge. */
    reset?: Reset;
    /** The requirement(s) to complete this challenge. */
    requirements: Requirements;
    /** A function that is called when the challenge is completed. */
    onComplete?: VoidFunction;
    /** A function that is called when the challenge is exited. */
    onExit?: VoidFunction;
    /** A function that is called when the challenge is entered. */
    onEnter?: VoidFunction;
    /** Whether this challenge can be started. */
    canStart?: MaybeRef<boolean>;
    /** The maximum number of times the challenge can be completed. */
    completionLimit?: MaybeRef<DecimalSource>;
    /** The display to use for this challenge. */
    display?: MaybeGetter<Renderable>;
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

/**
 * Lazily creates a challenge with the given options.
 * @param optionsFunc Challenge options.
 */
export function createChallenge<T extends ChallengeOptions>(optionsFunc: () => T) {
    const completions = persistent<DecimalSource>(0);
    const active = persistent<boolean>(false, false);
    return createLazyProxy(() => {
        const options = optionsFunc();
        const {
            requirements,
            canStart,
            completionLimit,
            display: _display,
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
                onToggle={challenge.toggle}
            />
        ));

        let display: MaybeGetter<Renderable> | undefined = undefined;
        if (typeof _display === "object" && !isJSXElement(_display)) {
            const { title, description, goal, reward, effectDisplay } = _display;
            display = () => (
                <span>
                    {title != null ? (
                        <div>
                            {render(title, el => (
                                <h3>{el}</h3>
                            ))}
                        </div>
                    ) : null}
                    {render(description, el => (
                        <div>{el}</div>
                    ))}
                    <div>
                        <br />
                        Goal:{" "}
                        {goal == null
                            ? displayRequirements(challenge.requirements)
                            : render(goal, el => <h3>{el}</h3>)}
                    </div>
                    {reward != null ? (
                        <div>
                            <br />
                            Reward: {render(reward)}
                        </div>
                    ) : null}
                    {effectDisplay != null ? <div>Currently: {render(effectDisplay)}</div> : null}
                </span>
            );
        } else if (_display != null) {
            display = _display;
        }

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
            display,
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
