import {
    NodePosition,
    placeInAvailableSpace,
    setupUniqueIds,
    unwrapNodeRef
} from "game/boards/board";
import { Direction } from "util/common";
import { beforeEach, describe, expect, test } from "vitest";
import { Ref, ref } from "vue";
import "../utils";

describe("Unwraps node refs", () => {
    test("Static value", () => expect(unwrapNodeRef(100, {})).toBe(100));
    test("Ref value", () => expect(unwrapNodeRef(ref(100), {})).toBe(100));
    test("0 param function value", () => expect(unwrapNodeRef(() => 100, {})).toBe(100));
    test("1 param function value", () => {
        const actualNode = { foo: "bar" };
        expect(
            unwrapNodeRef(function (node) {
                if (node === actualNode) {
                    return true;
                }
                return false;
            }, actualNode)
        ).toBe(true);
    });
});

describe("Set up unique IDs", () => {
    let nodes: Ref<{ id: number }[]>, nextId: Ref<number>;
    beforeEach(() => {
        nodes = ref([]);
        nextId = setupUniqueIds(nodes);
    });
    test("Starts at 0", () => expect(nextId?.value).toBe(0));
    test("Calculates initial value properly", () => {
        nodes.value = [{ id: 0 }, { id: 1 }, { id: 2 }];
        expect(nextId.value).toBe(3);
    });
    test("Non consecutive IDs", () => {
        nodes.value = [{ id: -5 }, { id: 0 }, { id: 200 }];
        expect(nextId.value).toBe(201);
    });
    test("After modification", () => {
        nodes.value = [{ id: 0 }, { id: 1 }, { id: 2 }];
        nodes.value.push({ id: nextId.value });
        expect(nextId.value).toBe(4);
    });
});

describe("Place in available space", () => {
    let nodes: Ref<NodePosition[]>, node: NodePosition;
    beforeEach(() => {
        nodes = ref([]);
        node = { x: 10, y: 20 };
    });
    test("No nodes", () => {
        placeInAvailableSpace(node, nodes.value);
        expect(node).toMatchObject({ x: 10, y: 20 });
    });
    test("Moves node", () => {
        nodes.value = [{ x: 10, y: 20 }];
        placeInAvailableSpace(node, nodes.value);
        expect(node).not.toMatchObject({ x: 10, y: 20 });
    });
    describe("Respects radius", () => {
        test("Positions radius away", () => {
            nodes.value = [{ x: 10, y: 20 }];
            placeInAvailableSpace(node, nodes.value, 32);
            expect(node).toMatchObject({ x: 42, y: 20 });
        });
        test("Ignores node already radius away", () => {
            nodes.value = [{ x: 42, y: 20 }];
            placeInAvailableSpace(node, nodes.value, 32);
            expect(node).toMatchObject({ x: 10, y: 20 });
        });
        test("Doesn't ignore node just under radius away", () => {
            nodes.value = [{ x: 41, y: 20 }];
            placeInAvailableSpace(node, nodes.value, 32);
            expect(node).not.toMatchObject({ x: 10, y: 20 });
        });
    });
    describe("Respects direction", () => {
        test("Goes left", () => {
            nodes.value = [{ x: 10, y: 20 }];
            placeInAvailableSpace(node, nodes.value, 10, Direction.Left);
            expect(node).toMatchObject({ x: 0, y: 20 });
        });
        test("Goes up", () => {
            nodes.value = [{ x: 10, y: 20 }];
            placeInAvailableSpace(node, nodes.value, 10, Direction.Up);
            expect(node).toMatchObject({ x: 10, y: 10 });
        });
        test("Goes down", () => {
            nodes.value = [{ x: 10, y: 20 }];
            placeInAvailableSpace(node, nodes.value, 10, Direction.Down);
            expect(node).toMatchObject({ x: 10, y: 30 });
        });
    });
    test("Finds hole", () => {
        nodes.value = [
            { x: 10, y: 20 },
            { x: 30, y: 20 }
        ];
        placeInAvailableSpace(node, nodes.value, 10);
        expect(node).toMatchObject({ x: 20, y: 20 });
    });
});
