import ClickableComponent from "@/components/features/Clickable.vue";
import { Resource } from "@/features/resource";
import Decimal, { DecimalSource, format } from "@/util/bignum";
import {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    processComputable,
    ProcessedComputable
} from "@/util/computed";
import { createProxy } from "@/util/proxies";
import { isCoercableComponent } from "@/util/vue";
import { computed, Ref, unref } from "vue";
import {
    CoercableComponent,
    Component,
    getUniqueID,
    makePersistent,
    Persistent,
    Replace,
    setDefault,
    StyleValue,
    Visibility
} from "./feature";

export const BuyableType = Symbol("Buyable");

type BuyableDisplay =
    | CoercableComponent
    | {
          title?: CoercableComponent;
          description: CoercableComponent;
          effectDisplay?: CoercableComponent;
      };

export interface BuyableOptions {
    visibility?: Computable<Visibility>;
    cost?: Computable<DecimalSource>;
    resource?: Computable<Resource>;
    canPurchase?: Computable<boolean>;
    purchaseLimit?: Computable<DecimalSource>;
    classes?: Computable<Record<string, boolean>>;
    style?: Computable<StyleValue>;
    mark?: Computable<boolean | string>;
    small?: Computable<boolean>;
    display?: Computable<BuyableDisplay>;
    onPurchase?: (cost: DecimalSource) => void;
}

interface BaseBuyable extends Persistent<DecimalSource> {
    id: string;
    amount: Ref<DecimalSource>;
    bought: Ref<boolean>;
    canAfford: Ref<boolean>;
    canClick: ProcessedComputable<boolean>;
    onClick: VoidFunction;
    purchase: VoidFunction;
    type: typeof BuyableType;
    [Component]: typeof ClickableComponent;
}

export type Buyable<T extends BuyableOptions> = Replace<
    T & BaseBuyable,
    {
        visibility: GetComputableTypeWithDefault<T["visibility"], Visibility.Visible>;
        cost: GetComputableType<T["cost"]>;
        resource: GetComputableType<T["resource"]>;
        canPurchase: GetComputableTypeWithDefault<T["canPurchase"], Ref<boolean>>;
        purchaseLimit: GetComputableTypeWithDefault<T["purchaseLimit"], 1>;
        classes: GetComputableType<T["classes"]>;
        style: GetComputableType<T["style"]>;
        mark: GetComputableType<T["mark"]>;
        small: GetComputableType<T["small"]>;
        display: Ref<CoercableComponent>;
    }
>;

export type GenericBuyable = Replace<
    Buyable<BuyableOptions>,
    {
        visibility: ProcessedComputable<Visibility>;
        canPurchase: ProcessedComputable<boolean>;
        purchaseLimit: ProcessedComputable<DecimalSource>;
    }
>;

export function createBuyable<T extends BuyableOptions>(
    options: T & ThisType<Buyable<T>>
): Buyable<T> {
    if (options.canPurchase == null && (options.resource == null || options.cost == null)) {
        console.warn(
            "Cannot create buyable without a canPurchase property or a resource and cost property",
            options
        );
        throw "Cannot create buyable without a canPurchase property or a resource and cost property";
    }

    const buyable: T & Partial<BaseBuyable> = options;
    makePersistent<DecimalSource>(buyable, 0);
    buyable.id = getUniqueID("buyable-");
    buyable.type = BuyableType;
    buyable[Component] = ClickableComponent;

    buyable.amount = buyable.state;
    buyable.bought = computed(() => Decimal.gt(proxy.amount.value, 0));
    buyable.canAfford = computed(
        () =>
            proxy.resource != null &&
            proxy.cost != null &&
            Decimal.gte(unref<Resource>(proxy.resource).value, unref(proxy.cost))
    );
    if (buyable.canPurchase == null) {
        buyable.canPurchase = computed(
            () =>
                proxy.purchaseLimit != null &&
                proxy.canAfford &&
                Decimal.lt(proxy.amount.value, unref(proxy.purchaseLimit))
        );
    }
    processComputable(buyable as T, "canPurchase");
    // TODO once processComputable typing works, this can be replaced
    //buyable.canClick = buyable.canPurchase;
    buyable.canClick = computed(() => unref(proxy.canPurchase));
    buyable.onClick = buyable.purchase = function() {
        if (!unref(proxy.canPurchase) || proxy.cost == null || proxy.resource == null) {
            return;
        }
        const cost = unref(proxy.cost);
        unref<Resource>(proxy.resource).value = Decimal.sub(
            unref<Resource>(proxy.resource).value,
            cost
        );
        proxy.amount.value = Decimal.add(proxy.amount.value, 1);
        this.onPurchase?.(cost);
    };
    processComputable(buyable as T, "display");
    const display = buyable.display;
    buyable.display = computed(() => {
        // TODO once processComputable types correctly, remove this "as X"
        const currDisplay = unref(display) as BuyableDisplay;
        if (
            currDisplay != null &&
            !isCoercableComponent(currDisplay) &&
            proxy.cost != null &&
            proxy.resource != null
        ) {
            return (
                <span>
                    <div v-if={currDisplay.title}>
                        <component v-is={currDisplay.title} />
                    </div>
                    <component v-is={currDisplay.description} />
                    <div>
                        <br />
                        Amount: {format(proxy.amount.value)} / {format(unref(proxy.purchaseLimit))}
                    </div>
                    <div v-if={currDisplay.effectDisplay}>
                        <br />
                        Currently: <component v-is={currDisplay.effectDisplay} />
                    </div>
                    <br />
                    Cost: {format(unref(proxy.cost))} {unref<Resource>(proxy.resource).displayName}
                </span>
            );
        }
        return null;
    });

    processComputable(buyable as T, "visibility");
    setDefault(buyable, "visibility", Visibility.Visible);
    processComputable(buyable as T, "cost");
    processComputable(buyable as T, "resource");
    processComputable(buyable as T, "purchaseLimit");
    setDefault(buyable, "purchaseLimit", 1);
    processComputable(buyable as T, "classes");
    processComputable(buyable as T, "style");
    processComputable(buyable as T, "mark");
    processComputable(buyable as T, "small");

    const proxy = createProxy((buyable as unknown) as Buyable<T>);
    return proxy;
}
