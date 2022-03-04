import Select from "components/fields/Select.vue";
import {
    CoercableComponent,
    Component,
    findFeatures,
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
import { makePersistent, Persistent, PersistentState } from "game/persistence";
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
import { Unsubscribe } from "nanoevents";
import { computed, Ref, unref } from "vue";
import { useToast } from "vue-toastification";

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
    shouldEarn: Computable<boolean>;
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

interface BaseMilestone extends Persistent<boolean> {
    id: string;
    earned: Ref<boolean>;
    type: typeof MilestoneType;
    [Component]: typeof MilestoneComponent;
    [GatherProps]: () => Record<string, unknown>;
}

export type Milestone<T extends MilestoneOptions> = Replace<
    T & BaseMilestone,
    {
        visibility: GetComputableTypeWithDefault<T["visibility"], Visibility.Visible>;
        shouldEarn: GetComputableType<T["shouldEarn"]>;
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
    optionsFunc: () => T & ThisType<Milestone<T>>
): Milestone<T> {
    return createLazyProxy(() => {
        const milestone: T & Partial<BaseMilestone> = optionsFunc();
        makePersistent<boolean>(milestone, false);
        milestone.id = getUniqueID("milestone-");
        milestone.type = MilestoneType;
        milestone[Component] = MilestoneComponent;

        milestone.earned = milestone[PersistentState];
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

        processComputable(milestone as T, "shouldEarn");
        processComputable(milestone as T, "style");
        processComputable(milestone as T, "classes");
        processComputable(milestone as T, "display");

        milestone[GatherProps] = function (this: GenericMilestone) {
            const { visibility, display, style, classes, earned, id } = this;
            return { visibility, display, style, classes, earned, id };
        };

        return milestone as unknown as Milestone<T>;
    });
}

const toast = useToast();

const listeners: Record<string, Unsubscribe | undefined> = {};
globalBus.on("addLayer", layer => {
    const milestones: GenericMilestone[] = (
        findFeatures(layer, MilestoneType) as GenericMilestone[]
    ).filter(milestone => milestone.shouldEarn != null);
    listeners[layer.id] = layer.on("postUpdate", () => {
        milestones.forEach(milestone => {
            if (
                unref(milestone.visibility) === Visibility.Visible &&
                !milestone.earned.value &&
                unref(milestone.shouldEarn)
            ) {
                milestone[PersistentState].value = true;
                milestone.onComplete?.();
                if (milestone.display) {
                    const display = unref(milestone.display);
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
    });
});
globalBus.on("removeLayer", layer => {
    // unsubscribe from postUpdate
    listeners[layer.id]?.();
    listeners[layer.id] = undefined;
});

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
