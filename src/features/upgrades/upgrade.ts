import { isArray } from "@vue/shared";
import type {
    CoercableComponent,
    GenericComponent,
    OptionsFunc,
    Replace,
    StyleValue
} from "features/feature";
import {
    Component,
    findFeatures,
    GatherProps,
    getUniqueID,
    setDefault,
    Visibility
} from "features/feature";
import UpgradeComponent from "features/upgrades/Upgrade.vue";
import type { GenericLayer } from "game/layers";
import type { Persistent } from "game/persistence";
import { persistent } from "game/persistence";
import {
    createVisibilityRequirement,
    payRequirements,
    Requirements,
    requirementsMet
} from "game/requirements";
import { isFunction } from "util/common";
import type {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    ProcessedComputable
} from "util/computed";
import { processComputable } from "util/computed";
import { createLazyProxy } from "util/proxies";
import type { Ref } from "vue";
import { computed, unref } from "vue";

export const UpgradeType = Symbol("Upgrade");

export interface UpgradeOptions {
    visibility?: Computable<Visibility | boolean>;
    classes?: Computable<Record<string, boolean>>;
    style?: Computable<StyleValue>;
    display?: Computable<
        | CoercableComponent
        | {
              title?: CoercableComponent;
              description: CoercableComponent;
              effectDisplay?: CoercableComponent;
          }
    >;
    requirements: Requirements;
    mark?: Computable<boolean | string>;
    onPurchase?: VoidFunction;
}

export interface BaseUpgrade {
    id: string;
    bought: Persistent<boolean>;
    canPurchase: Ref<boolean>;
    purchase: VoidFunction;
    type: typeof UpgradeType;
    [Component]: typeof UpgradeComponent;
    [GatherProps]: () => Record<string, unknown>;
}

export type Upgrade<T extends UpgradeOptions> = Replace<
    T & BaseUpgrade,
    {
        visibility: GetComputableTypeWithDefault<T["visibility"], Visibility.Visible>;
        classes: GetComputableType<T["classes"]>;
        style: GetComputableType<T["style"]>;
        display: GetComputableType<T["display"]>;
        requirements: GetComputableType<T["requirements"]>;
        mark: GetComputableType<T["mark"]>;
    }
>;

export type GenericUpgrade = Replace<
    Upgrade<UpgradeOptions>,
    {
        visibility: ProcessedComputable<Visibility | boolean>;
    }
>;

export function createUpgrade<T extends UpgradeOptions>(
    optionsFunc: OptionsFunc<T, BaseUpgrade, GenericUpgrade>
): Upgrade<T> {
    const bought = persistent<boolean>(false, false);
    return createLazyProxy(() => {
        const upgrade = optionsFunc();
        upgrade.id = getUniqueID("upgrade-");
        upgrade.type = UpgradeType;
        upgrade[Component] = UpgradeComponent;

        upgrade.bought = bought;
        upgrade.canPurchase = computed(() => requirementsMet(upgrade.requirements));
        upgrade.purchase = function () {
            const genericUpgrade = upgrade as GenericUpgrade;
            if (!unref(genericUpgrade.canPurchase)) {
                return;
            }
            payRequirements(upgrade.requirements);
            bought.value = true;
            genericUpgrade.onPurchase?.();
        };

        const visibilityRequirement = createVisibilityRequirement(upgrade as GenericUpgrade);
        if (isArray(upgrade.requirements)) {
            upgrade.requirements.unshift(visibilityRequirement);
        } else {
            upgrade.requirements = [visibilityRequirement, upgrade.requirements];
        }

        processComputable(upgrade as T, "visibility");
        setDefault(upgrade, "visibility", Visibility.Visible);
        processComputable(upgrade as T, "classes");
        processComputable(upgrade as T, "style");
        processComputable(upgrade as T, "display");
        processComputable(upgrade as T, "mark");

        upgrade[GatherProps] = function (this: GenericUpgrade) {
            const {
                display,
                visibility,
                style,
                classes,
                requirements,
                canPurchase,
                bought,
                mark,
                id,
                purchase
            } = this;
            return {
                display,
                visibility,
                style: unref(style),
                classes,
                requirements,
                canPurchase,
                bought,
                mark,
                id,
                purchase
            };
        };

        return upgrade as unknown as Upgrade<T>;
    });
}

export function setupAutoPurchase(
    layer: GenericLayer,
    autoActive: Computable<boolean>,
    upgrades: GenericUpgrade[] = []
): void {
    upgrades =
        upgrades.length === 0 ? (findFeatures(layer, UpgradeType) as GenericUpgrade[]) : upgrades;
    const isAutoActive: ProcessedComputable<boolean> = isFunction(autoActive)
        ? computed(autoActive)
        : autoActive;
    layer.on("update", () => {
        if (unref(isAutoActive)) {
            upgrades.forEach(upgrade => upgrade.purchase());
        }
    });
}
