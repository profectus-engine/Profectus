import UpgradeComponent from "features/upgrades/Upgrade.vue";
import {
    CoercableComponent,
    Component,
    OptionsFunc,
    findFeatures,
    GatherProps,
    getUniqueID,
    Replace,
    setDefault,
    StyleValue,
    Visibility
} from "features/feature";
import { Resource } from "features/resources/resource";
import { GenericLayer } from "game/layers";
import Decimal, { DecimalSource } from "util/bignum";
import { isFunction } from "util/common";
import {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    processComputable,
    ProcessedComputable
} from "util/computed";
import { createLazyProxy } from "util/proxies";
import { computed, Ref, unref } from "vue";
import { persistent, Persistent, PersistentState } from "game/persistence";

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

export interface BaseUpgrade extends Persistent<boolean> {
    id: string;
    bought: Ref<boolean>;
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
    optionsFunc: OptionsFunc<T, Upgrade<T>, BaseUpgrade>
): Upgrade<T> {
    return createLazyProxy(persistent => {
        const upgrade = Object.assign(persistent, optionsFunc());
        upgrade.id = getUniqueID("upgrade-");
        upgrade.type = UpgradeType;
        upgrade[Component] = UpgradeComponent;

        if (upgrade.canAfford == null && (upgrade.resource == null || upgrade.cost == null)) {
            console.warn(
                "Error: can't create upgrade without a canAfford property or a resource and cost property",
                upgrade
            );
        }

        upgrade.bought = upgrade[PersistentState];
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
            genericUpgrade[PersistentState].value = true;
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
    }, persistent<boolean>(false));
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
