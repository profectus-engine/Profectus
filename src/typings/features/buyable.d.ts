import { CoercableComponent } from "@/typings/component";
import { State } from "@/typings/state";
import Decimal, { DecimalSource } from "@/util/bignum";
import { Feature } from "./feature";

export interface Buyable extends Feature {
    amount: Decimal;
    amountSet?: (amount: Decimal) => void;
    canBuy: boolean;
    canAfford: boolean;
    effect?: State;
    purchaseLimit: DecimalSource;
    sellOne?: () => void;
    sellAll?: () => void;
    cost?: DecimalSource;
    buy: () => void;
    title?: CoercableComponent;
    display: CoercableComponent;
    style?: Partial<CSSStyleDeclaration>;
}
