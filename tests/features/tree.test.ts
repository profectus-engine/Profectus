import { createReset, Reset } from "features/reset";
import {
    branchedResetPropagation,
    createTree,
    createTreeNode,
    defaultResetPropagation,
    invertedResetPropagation
} from "features/trees/tree";
import { beforeAll, beforeEach, describe, expect, test } from "vitest";
import { Ref, ref } from "vue";
import "../utils";

describe("Reset propagation", () => {
    let shouldReset: Ref<boolean>, shouldNotReset: Ref<boolean>;
    let goodReset: Reset, badReset: Reset;
    beforeAll(() => {
        shouldReset = ref(false);
        shouldNotReset = ref(false);
        goodReset = createReset(() => ({
            thingsToReset: [],
            onReset() {
                shouldReset.value = true;
            }
        }));
        badReset = createReset(() => ({
            thingsToReset: [],
            onReset() {
                shouldNotReset.value = true;
            }
        }));
    });
    beforeEach(() => {
        shouldReset.value = false;
        shouldNotReset.value = false;
    });
    test("No resets", () => {
        expect(() => {
            const a = createTreeNode(() => ({}));
            const b = createTreeNode(() => ({}));
            const c = createTreeNode(() => ({}));
            const tree = createTree(() => ({
                nodes: [[a], [b], [c]]
            }));
            tree.reset(a);
        }).not.toThrowError();
    });

    test("Do not propagate resets", () => {
        const a = createTreeNode(() => ({ reset: badReset }));
        const b = createTreeNode(() => ({ reset: badReset }));
        const c = createTreeNode(() => ({ reset: badReset }));
        const tree = createTree(() => ({
            nodes: [[a], [b], [c]]
        }));
        tree.reset(b);
        expect(shouldNotReset.value).toBe(false);
    });

    test("Default propagation", () => {
        const a = createTreeNode(() => ({ reset: goodReset }));
        const b = createTreeNode(() => ({}));
        const c = createTreeNode(() => ({ reset: badReset }));
        const tree = createTree(() => ({
            nodes: [[a], [b], [c]],
            resetPropagation: defaultResetPropagation
        }));
        tree.reset(b);
        expect(shouldReset.value).toBe(true);
        expect(shouldNotReset.value).toBe(false);
    });

    test("Inverted propagation", () => {
        const a = createTreeNode(() => ({ reset: badReset }));
        const b = createTreeNode(() => ({}));
        const c = createTreeNode(() => ({ reset: goodReset }));
        const tree = createTree(() => ({
            nodes: [[a], [b], [c]],
            resetPropagation: invertedResetPropagation
        }));
        tree.reset(b);
        expect(shouldReset.value).toBe(true);
        expect(shouldNotReset.value).toBe(false);
    });

    test("Branched propagation", () => {
        const a = createTreeNode(() => ({ reset: badReset }));
        const b = createTreeNode(() => ({}));
        const c = createTreeNode(() => ({ reset: goodReset }));
        const tree = createTree(() => ({
            nodes: [[a, b, c]],
            resetPropagation: branchedResetPropagation,
            branches: [{ startNode: b, endNode: c }]
        }));
        tree.reset(b);
        expect(shouldReset.value).toBe(true);
        expect(shouldNotReset.value).toBe(false);
    });

    test("Branched propagation not bi-directional", () => {
        const a = createTreeNode(() => ({ reset: badReset }));
        const b = createTreeNode(() => ({}));
        const c = createTreeNode(() => ({ reset: badReset }));
        const tree = createTree(() => ({
            nodes: [[a, b, c]],
            resetPropagation: branchedResetPropagation,
            branches: [{ startNode: c, endNode: b }]
        }));
        tree.reset(b);
        expect(shouldNotReset.value).toBe(false);
    });
});
