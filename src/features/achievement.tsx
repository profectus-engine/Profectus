import AchievementComponent from "@/components/features/Achievement.vue";
import {
    CoercableComponent,
    Component,
    findFeatures,
    getUniqueID,
    makePersistent,
    Persistent,
    PersistentState,
    Replace,
    setDefault,
    StyleValue,
    Visibility
} from "@/features/feature";
import { globalBus } from "@/game/events";
import "@/game/notifications";
import {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    processComputable,
    ProcessedComputable
} from "@/util/computed";
import { createProxy } from "@/util/proxies";
import { coerceComponent } from "@/util/vue";
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
    tooltip?: Computable<CoercableComponent>;
    onComplete?: VoidFunction;
}

interface BaseAchievement extends Persistent<boolean> {
    id: string;
    earned: Ref<boolean>;
    complete: VoidFunction;
    type: typeof AchievementType;
    [Component]: typeof AchievementComponent;
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
        tooltip: GetComputableTypeWithDefault<T["tooltip"], GetComputableType<T["display"]>>;
    }
>;

export type GenericAchievement = Replace<
    Achievement<AchievementOptions>,
    {
        visibility: ProcessedComputable<Visibility>;
    }
>;

export function createAchievement<T extends AchievementOptions>(
    options: T & ThisType<Achievement<T>>
): Achievement<T> {
    const achievement: T & Partial<BaseAchievement> = options;
    makePersistent<boolean>(achievement, false);
    achievement.id = getUniqueID("achievement-");
    achievement.type = AchievementType;
    achievement[Component] = AchievementComponent;

    achievement.earned = achievement[PersistentState];
    achievement.complete = function () {
        proxy[PersistentState].value = true;
    };

    processComputable(achievement as T, "visibility");
    setDefault(achievement, "visibility", Visibility.Visible);
    processComputable(achievement as T, "shouldEarn");
    processComputable(achievement as T, "display");
    processComputable(achievement as T, "mark");
    processComputable(achievement as T, "image");
    processComputable(achievement as T, "style");
    processComputable(achievement as T, "classes");
    processComputable(achievement as T, "tooltip");
    setDefault(achievement, "tooltip", achievement.display);

    const proxy = createProxy(achievement as unknown as Achievement<T>);
    return proxy;
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
                        const display = unref(achievement.display);
                        toast.info(
                            <template>
                                <h2>Milestone earned!</h2>
                                <div>{coerceComponent(display)}</div>
                            </template>
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
