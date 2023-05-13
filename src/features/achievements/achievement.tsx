import { computed } from "@vue/reactivity";
import { isArray } from "@vue/shared";
import Select from "components/fields/Select.vue";
import AchievementComponent from "features/achievements/Achievement.vue";
import { GenericDecorator } from "features/decorators/common";
import {
    CoercableComponent,
    Component,
    GatherProps,
    GenericComponent,
    OptionsFunc,
    Replace,
    StyleValue,
    Visibility,
    getUniqueID,
    jsx,
    setDefault
} from "features/feature";
import { globalBus } from "game/events";
import "game/notifications";
import type { Persistent } from "game/persistence";
import { persistent } from "game/persistence";
import player from "game/player";
import {
    Requirements,
    createBooleanRequirement,
    createVisibilityRequirement,
    displayRequirements,
    requirementsMet
} from "game/requirements";
import settings, { registerSettingField } from "game/settings";
import { camelToTitle } from "util/common";
import type {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    ProcessedComputable
} from "util/computed";
import { processComputable } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { coerceComponent, isCoercableComponent } from "util/vue";
import { unref, watchEffect } from "vue";
import { useToast } from "vue-toastification";

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
export interface AchievementOptions {
    /** Whether this achievement should be visible. */
    visibility?: Computable<Visibility | boolean>;
    /** The requirement(s) to earn this achievement. Can be left null if using {@link BaseAchievement.complete}. */
    requirements?: Requirements;
    /** The display to use for this achievement. */
    display?: Computable<
        | CoercableComponent
        | {
              /** Description of the requirement(s) for this achievement. If unspecified then the requirements will be displayed automatically based on {@link requirements}. */
              requirement?: CoercableComponent;
              /** Description of what will change (if anything) for achieving this. */
              effectDisplay?: CoercableComponent;
              /** Any additional things to display on this achievement, such as a toggle for it's effect. */
              optionsDisplay?: CoercableComponent;
          }
    >;
    /** Shows a marker on the corner of the feature. */
    mark?: Computable<boolean | string>;
    /** Toggles a smaller design for the feature. */
    small?: Computable<boolean>;
    /** An image to display as the background for this achievement. */
    image?: Computable<string>;
    /** CSS to apply to this feature. */
    style?: Computable<StyleValue>;
    /** Dictionary of CSS classes to apply to this feature. */
    classes?: Computable<Record<string, boolean>>;
    /** Whether or not to display a notification popup when this achievement is earned. */
    showPopups?: Computable<boolean>;
    /** A function that is called when the achievement is completed. */
    onComplete?: VoidFunction;
}

/**
 * The properties that are added onto a processed {@link AchievementOptions} to create an {@link Achievement}.
 */
export interface BaseAchievement {
    /** An auto-generated ID for identifying features that appear in the DOM. Will not persist between refreshes or updates. */
    id: string;
    /** Whether or not this achievement has been earned. */
    earned: Persistent<boolean>;
    /** A function to complete this achievement. */
    complete: VoidFunction;
    /** A symbol that helps identify features of the same type. */
    type: typeof AchievementType;
    /** The Vue component used to render this feature. */
    [Component]: GenericComponent;
    /** A function to gather the props the vue component requires for this feature. */
    [GatherProps]: () => Record<string, unknown>;
}

/** An object that represents a feature with requirements that is passively earned upon meeting certain requirements. */
export type Achievement<T extends AchievementOptions> = Replace<
    T & BaseAchievement,
    {
        visibility: GetComputableTypeWithDefault<T["visibility"], Visibility.Visible>;
        display: GetComputableType<T["display"]>;
        mark: GetComputableType<T["mark"]>;
        image: GetComputableType<T["image"]>;
        style: GetComputableType<T["style"]>;
        classes: GetComputableType<T["classes"]>;
        showPopups: GetComputableTypeWithDefault<T["showPopups"], true>;
    }
>;

/** A type that matches any valid {@link Achievement} object. */
export type GenericAchievement = Replace<
    Achievement<AchievementOptions>,
    {
        visibility: ProcessedComputable<Visibility | boolean>;
        showPopups: ProcessedComputable<boolean>;
    }
>;

/**
 * Lazily creates an achievement with the given options.
 * @param optionsFunc Achievement options.
 */
export function createAchievement<T extends AchievementOptions>(
    optionsFunc?: OptionsFunc<T, BaseAchievement, GenericAchievement>,
    ...decorators: GenericDecorator[]
): Achievement<T> {
    const earned = persistent<boolean>(false, false);
    const decoratedData = decorators.reduce(
        (current, next) => Object.assign(current, next.getPersistentData?.()),
        {}
    );
    return createLazyProxy(feature => {
        const achievement =
            optionsFunc?.call(feature, feature) ??
            ({} as ReturnType<NonNullable<typeof optionsFunc>>);
        achievement.id = getUniqueID("achievement-");
        achievement.type = AchievementType;
        achievement[Component] = AchievementComponent as GenericComponent;

        for (const decorator of decorators) {
            decorator.preConstruct?.(achievement);
        }

        achievement.earned = earned;
        achievement.complete = function () {
            if (earned.value) {
                return;
            }
            earned.value = true;
            const genericAchievement = achievement as GenericAchievement;
            genericAchievement.onComplete?.();
            if (
                genericAchievement.display != null &&
                unref(genericAchievement.showPopups) === true
            ) {
                const display = unref(genericAchievement.display);
                let Display;
                if (isCoercableComponent(display)) {
                    Display = coerceComponent(display);
                } else if (display.requirement != null) {
                    Display = coerceComponent(display.requirement);
                } else {
                    Display = displayRequirements(genericAchievement.requirements ?? []);
                }
                toast.info(
                    <div>
                        <h3>Achievement earned!</h3>
                        <div>
                            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                            {/* @ts-ignore */}
                            <Display />
                        </div>
                    </div>
                );
            }
        };

        Object.assign(achievement, decoratedData);

        processComputable(achievement as T, "visibility");
        setDefault(achievement, "visibility", Visibility.Visible);
        const visibility = achievement.visibility as ProcessedComputable<Visibility | boolean>;
        achievement.visibility = computed(() => {
            const display = unref((achievement as GenericAchievement).display);
            switch (settings.msDisplay) {
                default:
                case AchievementDisplay.All:
                    return unref(visibility);
                case AchievementDisplay.Configurable:
                    if (
                        unref(achievement.earned) &&
                        !(
                            display != null &&
                            typeof display == "object" &&
                            "optionsDisplay" in (display as Record<string, unknown>)
                        )
                    ) {
                        return Visibility.None;
                    }
                    return unref(visibility);
                case AchievementDisplay.Incomplete:
                    if (unref(achievement.earned)) {
                        return Visibility.None;
                    }
                    return unref(visibility);
                case AchievementDisplay.None:
                    return Visibility.None;
            }
        });

        processComputable(achievement as T, "display");
        processComputable(achievement as T, "mark");
        processComputable(achievement as T, "small");
        processComputable(achievement as T, "image");
        processComputable(achievement as T, "style");
        processComputable(achievement as T, "classes");
        processComputable(achievement as T, "showPopups");
        setDefault(achievement, "showPopups", true);

        for (const decorator of decorators) {
            decorator.postConstruct?.(achievement);
        }

        const decoratedProps = decorators.reduce(
            (current, next) => Object.assign(current, next.getGatheredProps?.(achievement)),
            {}
        );
        achievement[GatherProps] = function (this: GenericAchievement) {
            const {
                visibility,
                display,
                requirements,
                earned,
                image,
                style,
                classes,
                mark,
                small,
                id
            } = this;
            return {
                visibility,
                display,
                requirements,
                earned,
                image,
                style: unref(style),
                classes,
                mark,
                small,
                id,
                ...decoratedProps
            };
        };

        if (achievement.requirements) {
            const genericAchievement = achievement as GenericAchievement;
            const requirements = [
                createVisibilityRequirement(genericAchievement),
                createBooleanRequirement(() => !genericAchievement.earned.value),
                ...(isArray(achievement.requirements)
                    ? achievement.requirements
                    : [achievement.requirements])
            ];
            watchEffect(() => {
                if (settings.active !== player.id) return;
                if (requirementsMet(requirements)) {
                    genericAchievement.complete();
                }
            });
        }

        return achievement as unknown as Achievement<T>;
    });
}

declare module "game/settings" {
    interface Settings {
        msDisplay: AchievementDisplay;
    }
}

globalBus.on("loadSettings", settings => {
    setDefault(settings, "msDisplay", AchievementDisplay.All);
});

const msDisplayOptions = Object.values(AchievementDisplay).map(option => ({
    label: camelToTitle(option),
    value: option
}));

registerSettingField(
    jsx(() => (
        <Select
            title={jsx(() => (
                <span class="option-title">
                    Show achievements
                    <desc>Select which achievements to display based on criterias.</desc>
                </span>
            ))}
            options={msDisplayOptions}
            onUpdate:modelValue={value => (settings.msDisplay = value as AchievementDisplay)}
            modelValue={settings.msDisplay}
        />
    ))
);
