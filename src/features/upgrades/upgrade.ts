import type { CoercableComponent, OptionsFunc, Replace, StyleValue } from "features/feature";
import {
    Component,
    findFeatures,
    GatherProps,
    getUniqueID,
    setDefault,
    Visibility
} from "features/feature";
import type { Resource } from "features/resources/resource";
import UpgradeComponent from "features/upgrades/Upgrade.vue";
import type { GenericLayer } from "game/layers";
import type { Persistent } from "game/persistence";
import { persistent } from "game/persistence";
import type { DecimalSource } from "util/bignum";
import Decimal from "util/bignum";
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
    visibility?: Computable<Visibility>;
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
    mark?: Computable<boolean | string>;
    cost?: Computable<DecimalSource>;
    resource?: Resource;
    canAfford?: Computable<boolean>;
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
        mark: GetComputableType<T["mark"]>;
        cost: GetComputableType<T["cost"]>;
        canAfford: GetComputableTypeWithDefault<T["canAfford"], Ref<boolean>>;
    }
>;

export type GenericUpgrade = Replace<
    Upgrade<UpgradeOptions>,
    {
        visibility: ProcessedComputable<Visibility>;
        canPurchase: ProcessedComputable<boolean>;
    }
>;

export function createUpgrade<T extends UpgradeOptions>(
    optionsFunc: OptionsFunc<T, BaseUpgrade, GenericUpgrade>
): Upgrade<T> {
    const bought = persistent<boolean>(false);
    return createLazyProxy(() => {
        const upgrade = optionsFunc();
        upgrade.id = getUniqueID("upgrade-");
        upgrade.type = UpgradeType;
        upgrade[Component] = UpgradeComponent;

        if (upgrade.canAfford == null && (upgrade.resource == null || upgrade.cost == null)) {
            console.warn(
                "Error: can't create upgrade without a canAfford property or a resource and cost property",
                upgrade
            );
        }

        upgrade.bought = bought;
        if (upgrade.canAfford == null) {
            upgrade.canAfford = computed(() => {
                const genericUpgrade = upgrade as GenericUpgrade;
                return (
                    genericUpgrade.resource != null &&
                    genericUpgrade.cost != null &&
                    Decimal.gte(genericUpgrade.resource.value, unref(genericUpgrade.cost))
                );
            });
        } else {
            processComputable(upgrade as T, "canAfford");
        }
        upgrade.canPurchase = computed(
            () =>
                unref((upgrade as GenericUpgrade).visibility) === Visibility.Visible &&
                unref((upgrade as GenericUpgrade).canAfford) &&
                !unref(upgrade.bought)
        );
        upgrade.purchase = function () {
            const genericUpgrade = upgrade as GenericUpgrade;
            if (!unref(genericUpgrade.canPurchase)) {
                return;
            }
            if (genericUpgrade.resource != null && genericUpgrade.cost != null) {
                genericUpgrade.resource.value = Decimal.sub(
                    genericUpgrade.resource.value,
                    unref(genericUpgrade.cost)
                );
            }
            bought.value = true;
            genericUpgrade.onPurchase?.();
        };

        processComputable(upgrade as T, "visibility");
        setDefault(upgrade, "visibility", Visibility.Visible);
        processComputable(upgrade as T, "classes");
        processComputable(upgrade as T, "style");
        processComputable(upgrade as T, "display");
        processComputable(upgrade as T, "mark");
        processComputable(upgrade as T, "cost");
        processComputable(upgrade as T, "resource");

        upgrade[GatherProps] = function (this: GenericUpgrade) {
            const {
                display,
                visibility,
                style,
                classes,
                resource,
                cost,
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
                resource,
                cost,
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
    upgrades = upgrades || findFeatures(layer, UpgradeType);
    const isAutoActive = isFunction(autoActive) ? computed(autoActive) : autoActive;
    layer.on("update", () => {
        if (unref(isAutoActive)) {
            upgrades.forEach(upgrade => upgrade.purchase());
        }
    });
}
