import Select from "components/fields/Select.vue";
import { OptionsFunc, Replace, Visibility } from "features/feature";
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
import { ProcessedRefOrGetter, processGetter } from "util/computed";
import { createLazyProxy } from "util/proxies";
import {
    isJSXElement,
    render,
    Renderable,
    VueFeature,
    vueFeatureMixin,
    VueFeatureOptions
} from "util/vue";
import { computed, isRef, MaybeRef, MaybeRefOrGetter, unref, watchEffect } from "vue";
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
    /** The requirement(s) to earn this achievement. Can be left null if using {@link BaseAchievement.complete}. */
    requirements?: Requirements;
    /** The display to use for this achievement. */
    display?:
        | MaybeRefOrGetter<Renderable>
        | {
              /** Description of the requirement(s) for this achievement. If unspecified then the requirements will be displayed automatically based on {@link requirements}. */
              requirement?: MaybeRefOrGetter<Renderable>;
              /** Description of what will change (if anything) for achieving this. */
              effectDisplay?: MaybeRefOrGetter<Renderable>;
              /** Any additional things to display on this achievement, such as a toggle for it's effect. */
              optionsDisplay?: MaybeRefOrGetter<Renderable>;
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

/**
 * The properties that are added onto a processed {@link AchievementOptions} to create an {@link Achievement}.
 */
export interface BaseAchievement extends VueFeature {
    /** Whether or not this achievement has been earned. */
    earned: Persistent<boolean>;
    /** A function to complete this achievement. */
    complete: VoidFunction;
    /** A symbol that helps identify features of the same type. */
    type: typeof AchievementType;
}

/** An object that represents a feature with requirements that is passively earned upon meeting certain requirements. */
export type Achievement = Replace<
    Replace<AchievementOptions, BaseAchievement>,
    {
        display?:
            | MaybeRef<Renderable>
            | {
                  requirement?: MaybeRef<Renderable>;
                  effectDisplay?: MaybeRef<Renderable>;
                  optionsDisplay?: MaybeRef<Renderable>;
              };
        image: ProcessedRefOrGetter<AchievementOptions["image"]>;
        showPopups: MaybeRef<boolean>;
    }
>;

/**
 * Lazily creates an achievement with the given options.
 * @param optionsFunc Achievement options.
 */
export function createAchievement<T extends AchievementOptions>(
    optionsFunc?: OptionsFunc<T, BaseAchievement, Achievement>
) {
    const earned = persistent<boolean>(false, false);
    return createLazyProxy(feature => {
        const options = optionsFunc?.call(feature, feature as Achievement) ?? ({} as T);
        const { requirements, display, small, image, showPopups, onComplete, ...props } = options;

        const vueFeature = vueFeatureMixin("achievement", options, () => (
            <Achievement
                display={achievement.display}
                earned={achievement.earned}
                requirements={achievement.requirements}
                image={achievement.image}
                small={achievement.small}
            />
        ));

        const achievement = {
            type: AchievementType,
            ...(props as Omit<typeof props, keyof VueFeature | keyof AchievementOptions>),
            ...vueFeature,
            visibility: computed(() => {
                const display = unref((achievement as Achievement).display);
                switch (settings.msDisplay) {
                    default:
                    case AchievementDisplay.All:
                        return unref(vueFeature.visibility) ?? true;
                    case AchievementDisplay.Configurable:
                        if (
                            unref(earned) &&
                            !(
                                display != null &&
                                typeof display === "object" &&
                                "optionsDisplay" in display
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
            display:
                display == null
                    ? undefined
                    : isRef(display) ||
                        typeof display === "string" ||
                        typeof display === "function" ||
                        isJSXElement(display)
                      ? processGetter(display)
                      : {
                            requirement: processGetter(display.requirement),
                            effectDisplay: processGetter(display.effectDisplay),
                            optionsDisplay: processGetter(display.optionsDisplay)
                        },
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
                    const display = achievement.display;
                    let Display;
                    if (isRef(display) || typeof display === "string" || isJSXElement(display)) {
                        Display = () => render(display);
                    } else if (display.requirement != null) {
                        Display = () => render(display.requirement!);
                    } else {
                        Display = () => displayRequirements(achievement.requirements ?? []);
                    }
                    toast.info(
                        <div>
                            <h3>Achievement earned!</h3>
                            <div>{Display}</div>
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
