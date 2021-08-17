import { CoercableComponent } from "@/component";
import { State } from "@/typings/state";
import { DecimalSource } from "@/util/bignum";
import { Feature } from "./feature";

export interface Upgrade extends Feature {
    bought: boolean;
    canAfford: boolean;
    pay: () => void;
    buy: () => void;
    cost: DecimalSource;
    currencyInternalName?: string | number;
    currencyLocation?: { [key: string]: DecimalSource };
    currencyLayer?: string;
    onPurchase?: () => void;
    title?: CoercableComponent;
    description: CoercableComponent;
    effect?: State;
    effectDisplay?: CoercableComponent;
    currencyDisplayName?: string;
    style?: Partial<CSSStyleDeclaration>;
    fullDisplay?: CoercableComponent;
}
