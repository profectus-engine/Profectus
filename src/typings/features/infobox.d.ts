import { CoercableComponent } from "@/component";
import { Feature } from "./feature";

export interface Infobox extends Feature {
    borderColor?: string;
    style?: Partial<CSSStyleDeclaration>;
    titleStyle?: Partial<CSSStyleDeclaration>;
    bodyStyle?: Partial<CSSStyleDeclaration>;
    title?: CoercableComponent;
    body: CoercableComponent;
}
