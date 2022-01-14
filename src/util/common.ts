// Reference:
// https://stackoverflow.com/questions/7225407/convert-camelcasetext-to-sentence-case-text
export function camelToTitle(camel: string): string {
    let title = camel.replace(/([A-Z])/g, " $1");
    title = title.charAt(0).toUpperCase() + title.slice(1);
    return title;
}

export function isPlainObject(object: unknown): boolean {
    return Object.prototype.toString.call(object) === "[object Object]";
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function isFunction(func: unknown): func is Function {
    return typeof func === "function";
}
