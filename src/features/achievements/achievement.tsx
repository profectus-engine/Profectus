import AchievementComponent from "features/achievements/Achievement.vue";
import {
    CoercableComponent,
    Component,
    findFeatures,
    GatherProps,
    getUniqueID,
    Replace,
    setDefault,
    StyleValue,
    Visibility
} from "features/feature";
import { globalBus } from "game/events";
import "game/notifications";
import { Persistent, makePersistent, PersistentState } from "game/persistence";
import {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    processComputable,
    ProcessedComputable
} from "util/computed";
import { createLazyProxy } from "util/proxies";
import { coerceComponent } from "util/vue";
import { Unsubscribe } from "nanoevents";
import { Ref, unref } from "vue";
import { useToast } from "vue-toastification";

export const AchievementType = Symbol("Achievement");

export interface AchievementOptions {
    visibility?: Computable<Visibility>;
    shouldEarn?: Computable<boolean>;
    display?: Computable<CoercableComponent>;
    mark?: Computable<boolean | string>;
    image?: Computable<string>;
    style?: Computable<StyleValue>;
    classes?: Computable<Record<string, boolean>>;
    onComplete?: VoidFunction;
}

interface BaseAchievement extends Persistent<boolean> {
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
        shouldEarn: GetComputableType<T["shouldEarn"]>;
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
    optionsFunc: () => T & ThisType<Achievement<T>>
): Achievement<T> {
    return createLazyProxy(() => {
        const achievement: T & Partial<BaseAchievement> = optionsFunc();
        makePersistent<boolean>(achievement, false);
        achievement.id = getUniqueID("achievement-");
        achievement.type = AchievementType;
        achievement[Component] = AchievementComponent;

        achievement.earned = achievement[PersistentState];
        achievement.complete = function () {
            achievement[PersistentState].value = true;
        };

        processComputable(achievement as T, "visibility");
        setDefault(achievement, "visibility", Visibility.Visible);
        processComputable(achievement as T, "shouldEarn");
        processComputable(achievement as T, "display");
        processComputable(achievement as T, "mark");
        processComputable(achievement as T, "image");
        processComputable(achievement as T, "style");
        processComputable(achievement as T, "classes");

        achievement[GatherProps] = function (this: GenericAchievement) {
            const { visibility, display, earned, image, style, classes, mark, id } = this;
            return { visibility, display, earned, image, style, classes, mark, id };
        };

        return achievement as unknown as Achievement<T>;
    });
}

const toast = useToast();

const listeners: Record<string, Unsubscribe | undefined> = {};
globalBus.on("addLayer", layer => {
    const achievements: GenericAchievement[] = (
        findFeatures(layer, AchievementType) as GenericAchievement[]
    ).filter(ach => ach.shouldEarn != null);
    if (achievements.length) {
        listeners[layer.id] = layer.on("postUpdate", () => {
            achievements.forEach(achievement => {
                if (
                    unref(achievement.visibility) === Visibility.Visible &&
                    !unref(achievement.earned) &&
                    unref(achievement.shouldEarn)
                ) {
                    achievement[PersistentState].value = true;
                    achievement.onComplete?.();
                    if (achievement.display) {
                        const Display = coerceComponent(unref(achievement.display));
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
        });
    }
});
globalBus.on("removeLayer", layer => {
    // unsubscribe from postUpdate
    listeners[layer.id]?.();
    listeners[layer.id] = undefined;
});
