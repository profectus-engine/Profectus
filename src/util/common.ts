import { DecimalSource } from "@/util/bignum";
import Decimal from "./bignum";

// Reference:
// https://stackoverflow.com/questions/7225407/convert-camelcasetext-to-sentence-case-text
export function camelToTitle(camel: string): string {
    let title = camel.replace(/([A-Z])/g, " $1");
    title = title.charAt(0).toUpperCase() + title.slice(1);
    return title;
}

export function isPlainObject(object: any): boolean {
    return Object.prototype.toString.call(object) === "[object Object]";
}

export function isFunction(func: any): boolean {
    return typeof func === "function";
}

export function softcap(
    value: DecimalSource,
    cap: DecimalSource,
    power: DecimalSource = 0.5
): Decimal {
    if (Decimal.lte(value, cap)) {
        return new Decimal(value);
    } else {
        return Decimal.pow(value, power).times(Decimal.pow(cap, Decimal.sub(1, power)));
    }
}
