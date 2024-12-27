import { processGetter } from "util/computed";
import { createLazyProxy, runAfterEvaluation } from "util/proxies";
import type { VueFeature } from "util/vue";
import { MaybeRef, MaybeRefOrGetter, unref } from "vue";
import MarkNode from "./MarkNode.vue";

/**
 * An object that configures a {@link Mark}.
 */
export interface MarkOptions {
    /** Whether or not to display a star or custom string. None if falsy value */
    mark: MaybeRefOrGetter<string | boolean>;
}

/** An object that represents a tooltip that appears when hovering over an element. */
export interface Mark {
    mark: MaybeRef<string | boolean>;
}

/**
 * Creates a mark to the top left of the given element with the given options.
 * @param element The renderable feature to display the tooltip on.
 * @param optionsFunc Mark options.
 */
export function addMark(
    element: VueFeature,
    optionsFunc: () => MarkOptions
): asserts element is VueFeature & { mark: Mark } {
    const mark = createLazyProxy(() => {
        const options = optionsFunc();
        const { mark, ...props } = options;

        return {
            ...(props as Omit<typeof props, keyof MarkOptions>),
            mark: processGetter(mark)
        } satisfies Mark;
    });

    runAfterEvaluation(element, el => {
        mark.mark; // Ensure mark gets evaluated
        (element as VueFeature & { mark: Mark }).mark = mark;
        el.wrappers.push(el =>
            Boolean(unref(mark.mark)) ? <MarkNode mark={mark.mark}>{el}</MarkNode> : <>{el}</>
        );
    });
}
