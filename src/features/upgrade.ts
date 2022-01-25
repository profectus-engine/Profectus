import UpgradeComponent from "@/components/features/Upgrade.vue";
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
import { Resource } from "@/features/resource";
import { GenericLayer } from "@/game/layers";
import Decimal, { DecimalSource } from "@/util/bignum";
import { isFunction } from "@/util/common";
import {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    processComputable,
    ProcessedComputable
} from "@/util/computed";
import { createProxy } from "@/util/proxies";
import { computed, Ref, unref } from "vue";

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
    resource?: Computable<Resource>;
    canPurchase?: Computable<boolean>;
    onPurchase?: VoidFunction;
}

interface BaseUpgrade extends Persistent<boolean> {
    id: string;
    bought: Ref<boolean>;
    canAfford: Ref<boolean>;
    purchase: VoidFunction;
    type: typeof UpgradeType;
    [Component]: typeof UpgradeComponent;
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
        resource: GetComputableType<T["resource"]>;
        canPurchase: GetComputableTypeWithDefault<T["canPurchase"], Ref<boolean>>;
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
    options: T & ThisType<Upgrade<T>>
): Upgrade<T> {
    const upgrade: T & Partial<BaseUpgrade> = options;
    makePersistent<boolean>(upgrade, false);
    upgrade.id = getUniqueID("upgrade-");
    upgrade.type = UpgradeType;
    upgrade[Component] = UpgradeComponent;

    if (upgrade.canPurchase == null && (upgrade.resource == null || upgrade.cost == null)) {
        console.warn(
            "Error: can't create upgrade without a canPurchase property or a resource and cost property",
            upgrade
        );
    }

    upgrade.bought = upgrade[PersistentState];
    if (upgrade.canAfford == null) {
        upgrade.canAfford = computed(
            () =>
                proxy.resource != null &&
                proxy.cost != null &&
                Decimal.gte(unref<Resource>(proxy.resource).value, unref(proxy.cost))
        );
    }
    if (upgrade.canPurchase == null) {
        upgrade.canPurchase = computed(() => unref(proxy.canAfford) && !unref(proxy.bought));
    }
    upgrade.purchase = function () {
        if (!unref(proxy.canPurchase)) {
            return;
        }
        if (proxy.resource != null && proxy.cost != null) {
            proxy.resource.value = Decimal.sub(
                unref<Resource>(proxy.resource).value,
                unref(proxy.cost)
            );
        }
        proxy[PersistentState].value = true;
        proxy.onPurchase?.();
    };

    processComputable(upgrade as T, "visibility");
    setDefault(upgrade, "visibility", Visibility.Visible);
    processComputable(upgrade as T, "classes");
    processComputable(upgrade as T, "style");
    processComputable(upgrade as T, "display");
    processComputable(upgrade as T, "mark");
    processComputable(upgrade as T, "cost");
    processComputable(upgrade as T, "resource");
    processComputable(upgrade as T, "canPurchase");

    const proxy = createProxy(upgrade as unknown as Upgrade<T>);
    return proxy;
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
