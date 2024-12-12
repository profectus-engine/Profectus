import Select from "components/fields/Select.vue";
import { Visibility } from "features/feature";
import { globalBus } from "game/events";
import "game/notifications";
import type { Persistent } from "game/persistence";
import { persistent } from "game/persistence";
import player from "game/player";
import {
    createBooleanRequirement,
    createVisibilityRequirement,
    displayRequirements,
    Requirements,
    requirementsMet
} from "game/requirements";
import settings, { registerSettingField } from "game/settings";
import { camelToTitle } from "util/common";
import { MaybeGetter, processGetter } from "util/computed";
import { createLazyProxy } from "util/proxies";
import {
    isJSXElement,
    render,
    Renderable,
    VueFeature,
    vueFeatureMixin,
    VueFeatureOptions
} from "util/vue";
import { computed, MaybeRef, MaybeRefOrGetter, unref, watchEffect } from "vue";
import { useToast } from "vue-toastification";
import Achievement from "./Achievement.vue";

const toast = useToast();

/** A symbol used to identify {@link Achievement} features. */
export const AchievementType = Symbol("Achievement");

/** Modes for only displaying some achievements. */
export enum AchievementDisplay {
    All = "all",
    //Last = "last",
    Configurable = "configurable",
    Incomplete = "incomplete",
    None = "none"
}

/**
 * An object that configures an {@link Achievement}.
 */
export interface AchievementOptions extends VueFeatureOptions {
    /** The requirement(s) to earn this achievement. Can be left null if using {@link Achievement.complete}. */
    requirements?: Requirements;
    /** The display to use for this achievement. */
    display?:
        | MaybeGetter<Renderable>
        | {
              /** Description of the requirement(s) for this achievement. If unspecified then the requirements will be displayed automatically based on {@link requirements}. */
              requirement?: MaybeGetter<Renderable>;
              /** Description of what will change (if anything) for achieving this. */
              effectDisplay?: MaybeGetter<Renderable>;
              /** Any additional things to display on this achievement, such as a toggle for it's effect. */
              optionsDisplay?: MaybeGetter<Renderable>;
          };
    /** Toggles a smaller design for the feature. */
    small?: MaybeRefOrGetter<boolean>;
    /** An image to display as the background for this achievement. */
    image?: MaybeRefOrGetter<string>;
    /** Whether or not to display a notification popup when this achievement is earned. */
    showPopups?: MaybeRefOrGetter<boolean>;
    /** A function that is called when the achievement is completed. */
    onComplete?: VoidFunction;
}

/** An object that represents a feature with requirements that is passively earned upon meeting certain requirements. */
export interface Achievement extends VueFeature {
    /** The requirement(s) to earn this achievement. */
    requirements?: Requirements;
    /** A function that is called when the achievement is completed. */
    onComplete?: VoidFunction;
    /** The display to use for this achievement. */
    display?: MaybeGetter<Renderable>;
    /** Toggles a smaller design for the feature. */
    small?: MaybeRef<boolean>;
    /** An image to display as the background for this achievement. */
    image?: MaybeRef<string>;
    /** Whether or not to display a notification popup when this achievement is earned. */
    showPopups: MaybeRef<boolean>;
    /** Whether or not this achievement has been earned. */
    earned: Persistent<boolean>;
    /** A function to complete this achievement. */
    complete: VoidFunction;
    /** A symbol that helps identify features of the same type. */
    type: typeof AchievementType;
}

/**
 * Lazily creates an achievement with the given options.
 * @param optionsFunc Achievement options.
 */
export function createAchievement<T extends AchievementOptions>(optionsFunc?: () => T) {
    const earned = persistent<boolean>(false, false);
    return createLazyProxy(() => {
        const options = optionsFunc?.() ?? ({} as T);
        const {
            requirements,
            display: _display,
            small,
            image,
            showPopups,
            onComplete,
            ...props
        } = options;

        const vueFeature = vueFeatureMixin("achievement", options, () => (
            <Achievement
                display={achievement.display}
                earned={achievement.earned}
                requirements={achievement.requirements}
                image={achievement.image}
                small={achievement.small}
            />
        ));

        let display: MaybeGetter<Renderable> | undefined = undefined;
        if (typeof _display === "object" && !isJSXElement(_display)) {
            const { requirement, effectDisplay, optionsDisplay } = _display;
            display = () => (
                <span>
                    {requirement == null
                        ? displayRequirements(requirements ?? [])
                        : render(requirement, el => <h3>{el}</h3>)}
                    {effectDisplay == null ? null : (
                        <div>
                            {render(effectDisplay, el => (
                                <b>{el}</b>
                            ))}
                        </div>
                    )}
                    {optionsDisplay != null ? (
                        <div class="equal-spaced">{render(optionsDisplay)}</div>
                    ) : null}
                </span>
            );
        } else if (_display != null) {
            display = _display;
        }

        const achievement = {
            type: AchievementType,
            ...(props as Omit<typeof props, keyof VueFeature | keyof AchievementOptions>),
            ...vueFeature,
            visibility: computed(() => {
                switch (settings.msDisplay) {
                    default:
                    case AchievementDisplay.All:
                        return unref(vueFeature.visibility) ?? true;
                    case AchievementDisplay.Configurable:
                        if (
                            unref(earned) &&
                            !(
                                _display != null &&
                                typeof _display === "object" &&
                                !isJSXElement(_display)
                            )
                        ) {
                            return Visibility.None;
                        }
                        return unref(vueFeature.visibility) ?? true;
                    case AchievementDisplay.Incomplete:
                        if (unref(earned)) {
                            return Visibility.None;
                        }
                        return unref(vueFeature.visibility) ?? true;
                    case AchievementDisplay.None:
                        return Visibility.None;
                }
            }),
            earned,
            onComplete,
            small: processGetter(small),
            image: processGetter(image),
            showPopups: processGetter(showPopups) ?? true,
            display,
            requirements:
                requirements == null
                    ? undefined
                    : [
                          createVisibilityRequirement(vueFeature.visibility ?? true),
                          createBooleanRequirement(() => !earned.value),
                          ...(Array.isArray(requirements) ? requirements : [requirements])
                      ],
            complete() {
                if (earned.value) {
                    return;
                }
                earned.value = true;
                achievement.onComplete?.();
                if (achievement.display != null && unref(achievement.showPopups) === true) {
                    let display = achievement.display;
                    if (typeof _display === "object" && !isJSXElement(_display)) {
                        if (_display.requirement != null) {
                            display = _display.requirement;
                        } else {
                            display = displayRequirements(requirements ?? []);
                        }
                    }
                    toast.info(
                        <div>
                            <h3>Achievement earned!</h3>
                            <div>{render(display)}</div>
                        </div>
                    );
                }
            }
        } satisfies Achievement;

        if (achievement.requirements != null) {
            watchEffect(() => {
                if (settings.active !== player.id) return;
                if (requirementsMet(achievement.requirements ?? [])) {
                    achievement.complete();
                }
            });
        }

        return achievement;
    });
}

declare module "game/settings" {
    interface Settings {
        msDisplay: AchievementDisplay;
    }
}

globalBus.on("loadSettings", settings => {
    settings.msDisplay ??= AchievementDisplay.All;
});

const msDisplayOptions = Object.values(AchievementDisplay).map(option => ({
    label: camelToTitle(option),
    value: option
}));

globalBus.on("setupVue", () =>
    registerSettingField(() => (
        <Select
            title={
                <span class="option-title">
                    Show achievements
                    <desc>Select which achievements to display based on criterias.</desc>
                </span>
            }
            options={msDisplayOptions}
            onUpdate:modelValue={value => (settings.msDisplay = value as AchievementDisplay)}
            modelValue={settings.msDisplay}
        />
    ))
);
