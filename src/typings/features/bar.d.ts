import { CoercableComponent } from "@/component";
import Decimal from "@/util/bignum";
import { Feature } from "./feature";

export interface Bar extends Feature {
    width: number;
    height: number;
    style: Partial<CSSStyleDeclaration>;
    borderStyle: Partial<CSSStyleDeclaration>;
    baseStyle: Partial<CSSStyleDeclaration>;
    textStyle: Partial<CSSStyleDeclaration>;
    fillStyle: Partial<CSSStyleDeclaration>;
    progress: number | Decimal;
    display: CoercableComponent;
}
