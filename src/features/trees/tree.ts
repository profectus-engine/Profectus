import { Decorator, GenericDecorator } from "features/decorators/common";
import type {
    CoercableComponent,
    GenericComponent,
    OptionsFunc,
    Replace,
    StyleValue
} from "features/feature";
import { Component, GatherProps, getUniqueID, setDefault, Visibility } from "features/feature";
import type { Link } from "features/links/links";
import type { GenericReset } from "features/reset";
import type { Resource } from "features/resources/resource";
import { displayResource } from "features/resources/resource";
import TreeComponent from "features/trees/Tree.vue";
import TreeNodeComponent from "features/trees/TreeNode.vue";
import type { DecimalSource } from "util/bignum";
import Decimal, { format, formatWhole } from "util/bignum";
import type {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    ProcessedComputable
} from "util/computed";
import { convertComputable, processComputable } from "util/computed";
import { createLazyProxy } from "util/proxies";
import type { Ref } from "vue";
import { computed, ref, shallowRef, unref } from "vue";

/** A symbol used to identify {@link TreeNode} features. */
export const TreeNodeType = Symbol("TreeNode");
/** A symbol used to identify {@link Tree} features. */
export const TreeType = Symbol("Tree");

/**
 * An object that configures a {@link TreeNode}.
 */
export interface TreeNodeOptions {
    /** Whether this tree node should be visible. */
    visibility?: Computable<Visibility | boolean>;
    /** Whether or not this tree node can be clicked. */
    canClick?: Computable<boolean>;
    /** The background color for this node. */
    color?: Computable<string>;
    /** The label to display on this tree node. */
    display?: Computable<CoercableComponent>;
    /** The color of the glow effect shown to notify the user there's something to do with this node. */
    glowColor?: Computable<string>;
    /** Dictionary of CSS classes to apply to this feature. */
    classes?: Computable<Record<string, boolean>>;
    /** CSS to apply to this feature. */
    style?: Computable<StyleValue>;
    /** Shows a marker on the corner of the feature. */
    mark?: Computable<boolean | string>;
    /** A reset object attached to this node, used for propagating resets through the tree. */
    reset?: GenericReset;
    /** A function that is called when the tree node is clicked. */
    onClick?: (e?: MouseEvent | TouchEvent) => void;
    /** A function that is called when the tree node is held down. */
    onHold?: VoidFunction;
}

/**
 * The properties that are added onto a processed {@link TreeNodeOptions} to create an {@link TreeNode}.
 */
export interface BaseTreeNode {
    /** An auto-generated ID for identifying features that appear in the DOM. Will not persist between refreshes or updates. */
    id: string;
    /** A symbol that helps identify features of the same type. */
    type: typeof TreeNodeType;
    /** The Vue component used to render this feature. */
    [Component]: GenericComponent;
    /** A function to gather the props the vue component requires for this feature. */
    [GatherProps]: () => Record<string, unknown>;
}

/** An object that represents a node on a tree. */
export type TreeNode<T extends TreeNodeOptions> = Replace<
    T & BaseTreeNode,
    {
        visibility: GetComputableTypeWithDefault<T["visibility"], Visibility.Visible>;
        canClick: GetComputableTypeWithDefault<T["canClick"], true>;
        color: GetComputableType<T["color"]>;
        display: GetComputableType<T["display"]>;
        glowColor: GetComputableType<T["glowColor"]>;
        classes: GetComputableType<T["classes"]>;
        style: GetComputableType<T["style"]>;
        mark: GetComputableType<T["mark"]>;
    }
>;

/** A type that matches any valid {@link TreeNode} object. */
export type GenericTreeNode = Replace<
    TreeNode<TreeNodeOptions>,
    {
        visibility: ProcessedComputable<Visibility | boolean>;
        canClick: ProcessedComputable<boolean>;
    }
>;

/**
 * Lazily creates a tree node with the given options.
 * @param optionsFunc Tree Node options.
 */
export function createTreeNode<T extends TreeNodeOptions>(
    optionsFunc?: OptionsFunc<T, BaseTreeNode, GenericTreeNode>,
    ...decorators: GenericDecorator[]
): TreeNode<T> {
    const decoratedData = decorators.reduce(
        (current, next) => Object.assign(current, next.getPersistentData?.()),
        {}
    );
    return createLazyProxy(feature => {
        const treeNode =
            optionsFunc?.call(feature, feature) ??
            ({} as ReturnType<NonNullable<typeof optionsFunc>>);
        treeNode.id = getUniqueID("treeNode-");
        treeNode.type = TreeNodeType;
        treeNode[Component] = TreeNodeComponent as GenericComponent;

        for (const decorator of decorators) {
            decorator.preConstruct?.(treeNode);
        }

        Object.assign(decoratedData);

        processComputable(treeNode as T, "visibility");
        setDefault(treeNode, "visibility", Visibility.Visible);
        processComputable(treeNode as T, "canClick");
        setDefault(treeNode, "canClick", true);
        processComputable(treeNode as T, "color");
        processComputable(treeNode as T, "display");
        processComputable(treeNode as T, "glowColor");
        processComputable(treeNode as T, "classes");
        processComputable(treeNode as T, "style");
        processComputable(treeNode as T, "mark");

        for (const decorator of decorators) {
            decorator.postConstruct?.(treeNode);
        }

        if (treeNode.onClick) {
            const onClick = treeNode.onClick.bind(treeNode);
            treeNode.onClick = function (e) {
                if (unref(treeNode.canClick) !== false) {
                    onClick(e);
                }
            };
        }
        if (treeNode.onHold) {
            const onHold = treeNode.onHold.bind(treeNode);
            treeNode.onHold = function () {
                if (unref(treeNode.canClick) !== false) {
                    onHold();
                }
            };
        }

        const decoratedProps = decorators.reduce(
            (current, next) => Object.assign(current, next.getGatheredProps?.(treeNode)),
            {}
        );
        treeNode[GatherProps] = function (this: GenericTreeNode) {
            const {
                display,
                visibility,
                style,
                classes,
                onClick,
                onHold,
                color,
                glowColor,
                canClick,
                mark,
                id
            } = this;
            return {
                display,
                visibility,
                style,
                classes,
                onClick,
                onHold,
                color,
                glowColor,
                canClick,
                mark,
                id,
                ...decoratedProps
            };
        };

        return treeNode as unknown as TreeNode<T>;
    });
}

/** Represents a branch between two nodes in a tree. */
export interface TreeBranch extends Omit<Link, "startNode" | "endNode"> {
    startNode: GenericTreeNode;
    endNode: GenericTreeNode;
}

/**
 * An object that configures a {@link Tree}.
 */
export interface TreeOptions {
    /** Whether this clickable should be visible. */
    visibility?: Computable<Visibility | boolean>;
    /** The nodes within the tree, in a 2D array. */
    nodes: Computable<GenericTreeNode[][]>;
    /** Nodes to show on the left side of the tree. */
    leftSideNodes?: Computable<GenericTreeNode[]>;
    /** Nodes to show on the right side of the tree. */
    rightSideNodes?: Computable<GenericTreeNode[]>;
    /** The branches between nodes within this tree. */
    branches?: Computable<TreeBranch[]>;
    /** How to propagate resets through the tree. */
    resetPropagation?: ResetPropagation;
    /** A function that is called when a node within the tree is reset. */
    onReset?: (node: GenericTreeNode) => void;
}

export interface BaseTree {
    /** An auto-generated ID for identifying features that appear in the DOM. Will not persist between refreshes or updates. */
    id: string;
    /** The link objects for each of the branches of the tree.  */
    links: Ref<Link[]>;
    /** Cause a reset on this node and propagate it through the tree according to {@link resetPropagation}. */
    reset: (node: GenericTreeNode) => void;
    /** A flag that is true while the reset is still propagating through the tree. */
    isResetting: Ref<boolean>;
    /** A reference to the node that caused the currently propagating reset. */
    resettingNode: Ref<GenericTreeNode | null>;
    /** A symbol that helps identify features of the same type. */
    type: typeof TreeType;
    /** The Vue component used to render this feature. */
    [Component]: GenericComponent;
    /** A function to gather the props the vue component requires for this feature. */
    [GatherProps]: () => Record<string, unknown>;
}

/** An object that represents a feature that is a tree of nodes with branches between them. Contains support for reset mechanics that can propagate through the tree. */
export type Tree<T extends TreeOptions> = Replace<
    T & BaseTree,
    {
        visibility: GetComputableTypeWithDefault<T["visibility"], Visibility.Visible>;
        nodes: GetComputableType<T["nodes"]>;
        leftSideNodes: GetComputableType<T["leftSideNodes"]>;
        rightSideNodes: GetComputableType<T["rightSideNodes"]>;
        branches: GetComputableType<T["branches"]>;
    }
>;

/** A type that matches any valid {@link Tree} object. */
export type GenericTree = Replace<
    Tree<TreeOptions>,
    {
        visibility: ProcessedComputable<Visibility | boolean>;
    }
>;

/**
 * Lazily creates a tree with the given options.
 * @param optionsFunc Tree options.
 */
export function createTree<T extends TreeOptions>(
    optionsFunc: OptionsFunc<T, BaseTree, GenericTree>
): Tree<T> {
    return createLazyProxy(feature => {
        const tree = optionsFunc.call(feature, feature);
        tree.id = getUniqueID("tree-");
        tree.type = TreeType;
        tree[Component] = TreeComponent as GenericComponent;

        tree.isResetting = ref(false);
        tree.resettingNode = shallowRef(null);

        tree.reset = function (node) {
            const genericTree = tree as GenericTree;
            genericTree.isResetting.value = true;
            genericTree.resettingNode.value = node;
            genericTree.resetPropagation?.(genericTree, node);
            genericTree.onReset?.(node);
            genericTree.isResetting.value = false;
            genericTree.resettingNode.value = null;
        };
        tree.links = computed(() => {
            const genericTree = tree as GenericTree;
            return unref(genericTree.branches) ?? [];
        });

        processComputable(tree as T, "visibility");
        setDefault(tree, "visibility", Visibility.Visible);
        processComputable(tree as T, "nodes");
        processComputable(tree as T, "leftSideNodes");
        processComputable(tree as T, "rightSideNodes");
        processComputable(tree as T, "branches");

        tree[GatherProps] = function (this: GenericTree) {
            const { nodes, leftSideNodes, rightSideNodes, branches } = this;
            return { nodes, leftSideNodes, rightSideNodes, branches };
        };

        return tree as unknown as Tree<T>;
    });
}

/** A function that is used to propagate resets through a tree. */
export type ResetPropagation = {
    (tree: GenericTree, resettingNode: GenericTreeNode): void;
};

/** Propagate resets down the tree by resetting every node in a lower row. */
export const defaultResetPropagation = function (
    tree: GenericTree,
    resettingNode: GenericTreeNode
): void {
    const nodes = unref(tree.nodes);
    const row = nodes.findIndex(nodes => nodes.includes(resettingNode)) - 1;
    for (let x = row; x >= 0; x--) {
        nodes[x].forEach(node => node.reset?.reset());
    }
};

/** Propagate resets down the tree by resetting every node in a lower row. */
export const invertedResetPropagation = function (
    tree: GenericTree,
    resettingNode: GenericTreeNode
): void {
    const nodes = unref(tree.nodes);
    const row = nodes.findIndex(nodes => nodes.includes(resettingNode)) + 1;
    for (let x = row; x < nodes.length; x++) {
        nodes[x].forEach(node => node.reset?.reset());
    }
};

/** Propagate resets down the branches of the tree. */
export const branchedResetPropagation = function (
    tree: GenericTree,
    resettingNode: GenericTreeNode
): void {
    const visitedNodes = [resettingNode];
    let currentNodes = [resettingNode];
    if (tree.branches != null) {
        const branches = unref(tree.branches);
        while (currentNodes.length > 0) {
            const nextNodes: GenericTreeNode[] = [];
            currentNodes.forEach(node => {
                branches
                    .filter(branch => branch.startNode === node || branch.endNode === node)
                    .map(branch => {
                        if (branch.startNode === node) {
                            return branch.endNode;
                        }
                        return branch.startNode;
                    })
                    .filter(node => !visitedNodes.includes(node))
                    .forEach(node => {
                        // Check here instead of in the filter because this check's results may
                        // change as we go through each node
                        if (!nextNodes.includes(node)) {
                            nextNodes.push(node);
                            node.reset?.reset();
                        }
                    });
            });
            currentNodes = nextNodes;
            visitedNodes.push(...currentNodes);
        }
    }
};

/**
 * Utility for creating a tooltip for a tree node that displays a resource-based unlock requirement, and after unlock shows the amount of another resource.
 * It sounds oddly specific, but comes up a lot.
 */
export function createResourceTooltip(
    resource: Resource,
    requiredResource: Resource | null = null,
    requirement: Computable<DecimalSource> = 0
): Ref<string> {
    const req = convertComputable(requirement);
    return computed(() => {
        if (requiredResource == null || Decimal.gte(resource.value, unref(req))) {
            return displayResource(resource) + " " + resource.displayName;
        }
        return `Reach ${
            Decimal.eq(requiredResource.precision, 0)
                ? formatWhole(unref(req))
                : format(unref(req), requiredResource.precision)
        } ${requiredResource.displayName} to unlock (You have ${
            Decimal.eq(requiredResource.precision, 0)
                ? formatWhole(requiredResource.value)
                : format(requiredResource.value, requiredResource.precision)
        })`;
    });
}
