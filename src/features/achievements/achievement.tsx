import AchievementComponent from "features/achievements/Achievement.vue";
import {
    CoercableComponent,
    Component,
    OptionsFunc,
    GatherProps,
    getUniqueID,
    Replace,
    setDefault,
    StyleValue,
    Visibility
} from "features/feature";
import "game/notifications";
import { Persistent, PersistentState, persistent } from "game/persistence";
import {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    processComputable,
    ProcessedComputable
} from "util/computed";
import { createLazyProxy } from "util/proxies";
import { coerceComponent } from "util/vue";
import { Ref, unref, watchEffect } from "vue";
import { useToast } from "vue-toastification";

const toast = useToast();

export const AchievementType = Symbol("Achievement");

export interface AchievementOptions {
    visibility?: Computable<Visibility>;
    shouldEarn?: () => boolean;
    display?: Computable<CoercableComponent>;
    mark?: Computable<boolean | string>;
    image?: Computable<string>;
    style?: Computable<StyleValue>;
    classes?: Computable<Record<string, boolean>>;
    onComplete?: VoidFunction;
}

export interface BaseAchievement extends Persistent<boolean> {
    id: string;
    earned: Ref<boolean>;
    complete: VoidFunction;
    type: typeof AchievementType;
    [Component]: typeof AchievementComponent;
    [GatherProps]: () => Record<string, unknown>;
}

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

export type GenericAchievement = Replace<
    Achievement<AchievementOptions>,
    {
        visibility: ProcessedComputable<Visibility>;
    }
>;

export function createAchievement<T extends AchievementOptions>(
    optionsFunc: OptionsFunc<T, Achievement<T>, BaseAchievement>
): Achievement<T> {
    return createLazyProxy(persistent => {
        const achievement = Object.assign(persistent, optionsFunc());
        achievement.id = getUniqueID("achievement-");
        achievement.type = AchievementType;
        achievement[Component] = AchievementComponent;

        achievement.earned = achievement[PersistentState];
        achievement.complete = function () {
            achievement[PersistentState].value = true;
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

        if (achievement.shouldEarn) {
            const genericAchievement = achievement as GenericAchievement;
            watchEffect(() => {
                if (
                    !genericAchievement.earned.value &&
                    unref(genericAchievement.visibility) === Visibility.Visible &&
                    genericAchievement.shouldEarn?.()
                ) {
                    genericAchievement.earned.value = true;
                    genericAchievement.onComplete?.();
                    if (genericAchievement.display) {
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
                }
            });
        }

        return achievement as unknown as Achievement<T>;
    }, persistent<boolean>(false));
}
