import { isArray } from "@vue/shared";
import AchievementComponent from "features/achievements/Achievement.vue";
import {
    CoercableComponent,
    Component,
    GatherProps,
    GenericComponent,
    getUniqueID,
    OptionsFunc,
    Replace,
    setDefault,
    StyleValue,
    Visibility
} from "features/feature";
import "game/notifications";
import type { Persistent } from "game/persistence";
import { persistent } from "game/persistence";
import player from "game/player";
import {
    createBooleanRequirement,
    createVisibilityRequirement,
    Requirements,
    requirementsMet
} from "game/requirements";
import settings from "game/settings";
import type {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    ProcessedComputable
} from "util/computed";
import { processComputable } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { coerceComponent } from "util/vue";
import { unref, watchEffect } from "vue";
import { useToast } from "vue-toastification";

const toast = useToast();

/** A symbol used to identify {@link Achievement} features. */
export const AchievementType = Symbol("Achievement");

/**
 * An object that configures an {@link Achievement}.
 */
export interface AchievementOptions {
    /** Whether this achievement should be visible. */
    visibility?: Computable<Visibility | boolean>;
    /** The requirement(s) to earn this achievement. Can be left null if using {@link BaseAchievement.complete}. */
    requirements?: Requirements;
    /** The display to use for this achievement. */
    display?: Computable<CoercableComponent>;
    /** Shows a marker on the corner of the feature. */
    mark?: Computable<boolean | string>;
    /** An image to display as the background for this achievement. */
    image?: Computable<string>;
    /** CSS to apply to this feature. */
    style?: Computable<StyleValue>;
    /** Dictionary of CSS classes to apply to this feature. */
    classes?: Computable<Record<string, boolean>>;
    /** A function that is called when the achievement is completed. */
    onComplete?: VoidFunction;
}

/**
 * The properties that are added onto a processed {@link AchievementOptions} to create an {@link Achievement}.
 */
export interface BaseAchievement {
    /** An auto-generated ID for identifying achievements that appear in the DOM. Will not persist between refreshes or updates. */
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

/** An object that represents a feature with that is passively earned upon meeting certain requirements. */
export type Achievement<T extends AchievementOptions> = Replace<
    T & BaseAchievement,
    {
        visibility: GetComputableTypeWithDefault<T["visibility"], Visibility.Visible>;
        display: GetComputableType<T["display"]>;
        mark: GetComputableType<T["mark"]>;
        image: GetComputableType<T["image"]>;
        style: GetComputableType<T["style"]>;
        classes: GetComputableType<T["classes"]>;
    }
>;

/** A type that matches any valid {@link Achievement} object. */
export type GenericAchievement = Replace<
    Achievement<AchievementOptions>,
    {
        visibility: ProcessedComputable<Visibility | boolean>;
    }
>;

/**
 * Lazily creates a achievement with the given options.
 * @param optionsFunc Achievement options.
 */
export function createAchievement<T extends AchievementOptions>(
    optionsFunc?: OptionsFunc<T, BaseAchievement, GenericAchievement>
): Achievement<T> {
    const earned = persistent<boolean>(false, false);
    return createLazyProxy(() => {
        const achievement = optionsFunc?.() ?? ({} as ReturnType<NonNullable<typeof optionsFunc>>);
        achievement.id = getUniqueID("achievement-");
        achievement.type = AchievementType;
        achievement[Component] = AchievementComponent as GenericComponent;

        achievement.earned = earned;
        achievement.complete = function () {
            earned.value = true;
            const genericAchievement = achievement as GenericAchievement;
            genericAchievement.onComplete?.();
            if (genericAchievement.display != null) {
                const Display = coerceComponent(unref(genericAchievement.display));
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

        processComputable(achievement as T, "visibility");
        setDefault(achievement, "visibility", Visibility.Visible);
        processComputable(achievement as T, "display");
        processComputable(achievement as T, "mark");
        processComputable(achievement as T, "image");
        processComputable(achievement as T, "style");
        processComputable(achievement as T, "classes");

        achievement[GatherProps] = function (this: GenericAchievement) {
            const { visibility, display, earned, image, style, classes, mark, id } = this;
            return { visibility, display, earned, image, style: unref(style), classes, mark, id };
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
