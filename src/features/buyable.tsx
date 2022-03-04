import ClickableComponent from "features/clickables/Clickable.vue";
import { Resource } from "features/resources/resource";
import { Persistent, makePersistent, PersistentState } from "game/persistence";
import Decimal, { DecimalSource, format, formatWhole } from "util/bignum";
import {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    processComputable,
    ProcessedComputable
} from "util/computed";
import { createLazyProxy } from "util/proxies";
import { coerceComponent, isCoercableComponent } from "util/vue";
import { computed, Ref, unref } from "vue";
import {
    CoercableComponent,
    Component,
    GatherProps,
    getUniqueID,
    jsx,
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
    resource?: Resource;
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
    maxed: Ref<boolean>;
    canAfford: Ref<boolean>;
    canClick: ProcessedComputable<boolean>;
    onClick: VoidFunction;
    purchase: VoidFunction;
    type: typeof BuyableType;
    [Component]: typeof ClickableComponent;
    [GatherProps]: () => Record<string, unknown>;
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
    optionsFunc: () => T & ThisType<Buyable<T>>
): Buyable<T> {
    return createLazyProxy(() => {
        const buyable: T & Partial<BaseBuyable> = optionsFunc();

        if (buyable.canPurchase == null && (buyable.resource == null || buyable.cost == null)) {
            console.warn(
                "Cannot create buyable without a canPurchase property or a resource and cost property",
                buyable
            );
            throw "Cannot create buyable without a canPurchase property or a resource and cost property";
        }

        makePersistent<DecimalSource>(buyable, 0);
        buyable.id = getUniqueID("buyable-");
        buyable.type = BuyableType;
        buyable[Component] = ClickableComponent;

        buyable.amount = buyable[PersistentState];
        buyable.canAfford = computed(() => {
            const genericBuyable = buyable as GenericBuyable;
            const cost = unref(genericBuyable.cost);
            return (
                genericBuyable.resource != null &&
                cost != null &&
                Decimal.gte(genericBuyable.resource.value, cost)
            );
        });
        if (buyable.canPurchase == null) {
            buyable.canPurchase = computed(
                () =>
                    unref((buyable as GenericBuyable).visibility) === Visibility.Visible &&
                    unref((buyable as GenericBuyable).canAfford) &&
                    Decimal.lt(
                        (buyable as GenericBuyable).amount.value,
                        unref((buyable as GenericBuyable).purchaseLimit)
                    )
            );
        }
        buyable.maxed = computed(() =>
            Decimal.gte(
                (buyable as GenericBuyable).amount.value,
                unref((buyable as GenericBuyable).purchaseLimit)
            )
        );
        processComputable(buyable as T, "classes");
        const classes = buyable.classes as ProcessedComputable<Record<string, boolean>> | undefined;
        buyable.classes = computed(() => {
            const currClasses = unref(classes) || {};
            if ((buyable as GenericBuyable).maxed.value) {
                currClasses.bought = true;
            }
            return currClasses;
        });
        processComputable(buyable as T, "canPurchase");
        buyable.canClick = buyable.canPurchase as ProcessedComputable<boolean>;
        buyable.onClick = buyable.purchase = function () {
            const genericBuyable = buyable as GenericBuyable;
            if (
                !unref(genericBuyable.canPurchase) ||
                genericBuyable.cost == null ||
                genericBuyable.resource == null
            ) {
                return;
            }
            const cost = unref(genericBuyable.cost);
            genericBuyable.resource.value = Decimal.sub(genericBuyable.resource.value, cost);
            genericBuyable.amount.value = Decimal.add(genericBuyable.amount.value, 1);
            this.onPurchase?.(cost);
        };
        processComputable(buyable as T, "display");
        const display = buyable.display;
        buyable.display = jsx(() => {
            // TODO once processComputable types correctly, remove this "as X"
            const currDisplay = unref(display) as BuyableDisplay;
            if (
                currDisplay != null &&
                !isCoercableComponent(currDisplay) &&
                buyable.cost != null &&
                buyable.resource != null
            ) {
                const genericBuyable = buyable as GenericBuyable;
                const Title = coerceComponent(currDisplay.title || "", "h3");
                const Description = coerceComponent(currDisplay.description);
                const EffectDisplay = coerceComponent(currDisplay.effectDisplay || "");
                return (
                    <span>
                        {currDisplay.title ? (
                            <div>
                                <Title />
                            </div>
                        ) : null}
                        <Description />
                        <div>
                            <br />
                            Amount: {formatWhole(genericBuyable.amount.value)} /{" "}
                            {formatWhole(unref(genericBuyable.purchaseLimit))}
                        </div>
                        {currDisplay.effectDisplay ? (
                            <div>
                                <br />
                                Currently: <EffectDisplay />
                            </div>
                        ) : null}
                        {genericBuyable.cost && !genericBuyable.maxed.value ? (
                            <div>
                                <br />
                                Cost: {format(unref(genericBuyable.cost) || 0)}{" "}
                                {buyable.resource.displayName}
                            </div>
                        ) : null}
                    </span>
                );
            }
            return "";
        });

        processComputable(buyable as T, "visibility");
        setDefault(buyable, "visibility", Visibility.Visible);
        processComputable(buyable as T, "cost");
        processComputable(buyable as T, "resource");
        processComputable(buyable as T, "purchaseLimit");
        setDefault(buyable, "purchaseLimit", 1);
        processComputable(buyable as T, "style");
        processComputable(buyable as T, "mark");
        processComputable(buyable as T, "small");

        buyable[GatherProps] = function (this: GenericBuyable) {
            const { display, visibility, style, classes, onClick, canClick, small, mark, id } =
                this;
            return { display, visibility, style, classes, onClick, canClick, small, mark, id };
        };

        return buyable as unknown as Buyable<T>;
    });
}
