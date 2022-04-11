import Select from "components/fields/Select.vue";
import {
    CoercableComponent,
    Component,
    OptionsFunc,
    GatherProps,
    getUniqueID,
    jsx,
    Replace,
    setDefault,
    StyleValue,
    Visibility
} from "features/feature";
import MilestoneComponent from "features/milestones/Milestone.vue";
import { globalBus } from "game/events";
import "game/notifications";
import { persistent, Persistent, PersistentState } from "game/persistence";
import settings, { registerSettingField } from "game/settings";
import { camelToTitle } from "util/common";
import {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    processComputable,
    ProcessedComputable
} from "util/computed";
import { createLazyProxy } from "util/proxies";
import { coerceComponent, isCoercableComponent } from "util/vue";
import { computed, Ref, unref, watchEffect } from "vue";
import { useToast } from "vue-toastification";

const toast = useToast();

export const MilestoneType = Symbol("Milestone");

export enum MilestoneDisplay {
    All = "all",
    //Last = "last",
    Configurable = "configurable",
    Incomplete = "incomplete",
    None = "none"
}

export interface MilestoneOptions {
    visibility?: Computable<Visibility>;
    shouldEarn?: () => boolean;
    style?: Computable<StyleValue>;
    classes?: Computable<Record<string, boolean>>;
    display?: Computable<
        | CoercableComponent
        | {
              requirement: CoercableComponent;
              effectDisplay?: CoercableComponent;
              optionsDisplay?: CoercableComponent;
          }
    >;
    onComplete?: VoidFunction;
}

export interface BaseMilestone extends Persistent<boolean> {
    id: string;
    earned: Ref<boolean>;
    complete: VoidFunction;
    type: typeof MilestoneType;
    [Component]: typeof MilestoneComponent;
    [GatherProps]: () => Record<string, unknown>;
}

export type Milestone<T extends MilestoneOptions> = Replace<
    T & BaseMilestone,
    {
        visibility: GetComputableTypeWithDefault<T["visibility"], Visibility.Visible>;
        style: GetComputableType<T["style"]>;
        classes: GetComputableType<T["classes"]>;
        display: GetComputableType<T["display"]>;
    }
>;

export type GenericMilestone = Replace<
    Milestone<MilestoneOptions>,
    {
        visibility: ProcessedComputable<Visibility>;
    }
>;

export function createMilestone<T extends MilestoneOptions>(
    optionsFunc: OptionsFunc<T, Milestone<T>, BaseMilestone>
): Milestone<T> {
    return createLazyProxy(persistent => {
        const milestone = Object.assign(persistent, optionsFunc());
        milestone.id = getUniqueID("milestone-");
        milestone.type = MilestoneType;
        milestone[Component] = MilestoneComponent;

        milestone.earned = milestone[PersistentState];
        milestone.complete = function () {
            milestone[PersistentState].value = true;
        };

        processComputable(milestone as T, "visibility");
        setDefault(milestone, "visibility", Visibility.Visible);
        const visibility = milestone.visibility as ProcessedComputable<Visibility>;
        milestone.visibility = computed(() => {
            const display = unref((milestone as GenericMilestone).display);
            switch (settings.msDisplay) {
                default:
                case MilestoneDisplay.All:
                    return unref(visibility);
                case MilestoneDisplay.Configurable:
                    if (
                        unref(milestone.earned) &&
                        !(
                            display != null &&
                            typeof display == "object" &&
                            "optionsDisplay" in (display as Record<string, unknown>)
                        )
                    ) {
                        return Visibility.None;
                    }
                    return unref(visibility);
                case MilestoneDisplay.Incomplete:
                    if (unref(milestone.earned)) {
                        return Visibility.None;
                    }
                    return unref(visibility);
                case MilestoneDisplay.None:
                    return Visibility.None;
            }
        });

        processComputable(milestone as T, "style");
        processComputable(milestone as T, "classes");
        processComputable(milestone as T, "display");

        milestone[GatherProps] = function (this: GenericMilestone) {
            const { visibility, display, style, classes, earned, id } = this;
            return { visibility, display, style: unref(style), classes, earned, id };
        };

        if (milestone.shouldEarn) {
            const genericMilestone = milestone as GenericMilestone;
            watchEffect(() => {
                if (
                    !genericMilestone.earned.value &&
                    unref(genericMilestone.visibility) === Visibility.Visible &&
                    genericMilestone.shouldEarn?.()
                ) {
                    genericMilestone.earned.value = true;
                    genericMilestone.onComplete?.();
                    if (genericMilestone.display) {
                        const display = unref(genericMilestone.display);
                        const Display = coerceComponent(
                            isCoercableComponent(display) ? display : display.requirement
                        );
                        toast(
                            <>
                                <h3>Milestone earned!</h3>
                                <div>
                                    {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                                    {/* @ts-ignore */}
                                    <Display />
                                </div>
                            </>
                        );
                    }
                }
            });
        }

        return milestone as unknown as Milestone<T>;
    }, persistent<boolean>(false));
}

declare module "game/settings" {
    interface Settings {
        msDisplay: MilestoneDisplay;
    }
}

globalBus.on("loadSettings", settings => {
    setDefault(settings, "msDisplay", MilestoneDisplay.All);
});

const msDisplayOptions = Object.values(MilestoneDisplay).map(option => ({
    label: camelToTitle(option),
    value: option
}));

registerSettingField(
    jsx(() => (
        <Select
            title="Show Milestones"
            options={msDisplayOptions}
            onUpdate:modelValue={value => (settings.msDisplay = value as MilestoneDisplay)}
            modelValue={settings.msDisplay}
        />
    ))
);
