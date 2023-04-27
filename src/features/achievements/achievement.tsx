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
import { Computable, Defaults, ProcessedFeature, convertComputable } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { coerceComponent, isCoercableComponent } from "util/vue";
import { ComputedRef, unref, watchEffect } from "vue";
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
    /** Whether this achievement should be visible. */
    visibility: ComputedRef<Visibility | boolean>;
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

export type Achievement<T extends AchievementOptions> = BaseAchievement &
    ProcessedFeature<AchievementOptions, Exclude<T, BaseAchievement>> &
    Defaults<
        Exclude<T, BaseAchievement>,
        {
            showPopups: true;
        }
    >;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GenericAchievement = Achievement<any>;

export function createAchievement<T extends AchievementOptions>(
    optionsFunc?: OptionsFunc<T, GenericAchievement>,
    ...decorators: GenericDecorator[]
): Achievement<T> {
    const earned = persistent<boolean>(false, false);
    const decoratedData = decorators.reduce(
        (current, next) => Object.assign(current, next.getPersistentData?.()),
        {}
    );
    return createLazyProxy(feature => {
        const { visibility, display, mark, small, image, style, classes, showPopups, ...options } =
            optionsFunc?.call(feature, feature) ??
            ({} as ReturnType<NonNullable<typeof optionsFunc>>);

        const optionsVisibility = convertComputable(visibility, feature) ?? Visibility.Visible;
        const processedVisibility = computed(() => {
            const display = unref(achievement.display);
            switch (settings.msDisplay) {
                default:
                case AchievementDisplay.All:
                    return unref(optionsVisibility);
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
                    return unref(optionsVisibility);
                case AchievementDisplay.Incomplete:
                    if (unref(achievement.earned)) {
                        return Visibility.None;
                    }
                    return unref(optionsVisibility);
                case AchievementDisplay.None:
                    return Visibility.None;
            }
        });

        const achievement = {
            id: getUniqueID("achievement-"),
            visibility: processedVisibility,
            earned,
            complete,
            type: AchievementType,
            [Component]: AchievementComponent as GenericComponent,
            [GatherProps]: gatherProps,
            display: convertComputable(display, feature),
            mark: convertComputable(mark, feature),
            small: convertComputable(small, feature),
            image: convertComputable(image, feature),
            style: convertComputable(style, feature),
            classes: convertComputable(classes, feature),
            showPopups: convertComputable(showPopups, feature) ?? true,
            ...options
        } satisfies Partial<Achievement<T>>;

        for (const decorator of decorators) {
            decorator.preConstruct?.(achievement);
        }
        Object.assign(achievement, decoratedData);
        for (const decorator of decorators) {
            decorator.postConstruct?.(achievement);
        }
        const decoratedProps = decorators.reduce(
            (current, next) => Object.assign(current, next.getGatheredProps?.(achievement)),
            {}
        );

        function complete() {
            earned.value = true;
            achievement.onComplete?.();
            if (achievement.display != null && unref(achievement.showPopups) === true) {
                const display = unref(achievement.display);
                let Display;
                if (isCoercableComponent(display)) {
                    Display = coerceComponent(display);
                } else if (display.requirement != null) {
                    Display = coerceComponent(display.requirement);
                } else {
                    Display = displayRequirements(achievement.requirements ?? []);
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
        }

        function gatherProps(this: GenericAchievement): Record<string, unknown> {
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
        }

        if (achievement.requirements != null) {
            const requirements = [
                createVisibilityRequirement(achievement),
                createBooleanRequirement(() => !earned.value),
                ...(isArray(achievement.requirements)
                    ? achievement.requirements
                    : [achievement.requirements])
            ];
            watchEffect(() => {
                if (settings.active !== player.id) return;
                if (requirementsMet(requirements)) {
                    achievement.complete();
                }
            });
        }

        return achievement;
    });
}

const ach = createAchievement(ach => ({
    image: "",
    showPopups: computed(() => false),
    small: () => true,
    foo: "bar",
    bar: () => "foo"
}));
ach;
ach.image; // string
ach.showPopups; // ComputedRef<false>
ach.small; // ComputedRef<true>
ach.foo; // "bar"
ach.bar; // () => "foo"
ach.mark; // TS should yell about this not existing (or at least mark it undefined)
ach.visibility; // ComputedRef<Visibility | boolean>

const badAch = createAchievement(() => ({
    requirements: "foo"
}));

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
