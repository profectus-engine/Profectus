import { Link } from "features/links/links";
import type { Reset } from "features/reset";
import type { Resource } from "features/resources/resource";
import { displayResource } from "features/resources/resource";
import Tree from "features/trees/Tree.vue";
import TreeNode from "features/trees/TreeNode.vue";
import { noPersist } from "game/persistence";
import type { DecimalSource } from "util/bignum";
import Decimal, { format, formatWhole } from "util/bignum";
import { MaybeGetter, processGetter } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { Renderable, VueFeature, vueFeatureMixin, VueFeatureOptions } from "util/vue";
import type { MaybeRef, MaybeRefOrGetter, Ref } from "vue";
import { ref, shallowRef, unref } from "vue";

/** A symbol used to identify {@link TreeNode} features. */
export const TreeNodeType = Symbol("TreeNode");
/** A symbol used to identify {@link Tree} features. */
export const TreeType = Symbol("Tree");

/**
 * An object that configures a {@link TreeNode}.
 */
export interface TreeNodeOptions extends VueFeatureOptions {
    /** Whether or not this tree node can be clicked. */
    canClick?: MaybeRefOrGetter<boolean>;
    /** The background color for this node. */
    color?: MaybeRefOrGetter<string>;
    /** The label to display on this tree node. */
    display?: MaybeGetter<Renderable>;
    /** The color of the glow effect shown to notify the user there's something to do with this node. */
    glowColor?: MaybeRefOrGetter<string>;
    /** A reset object attached to this node, used for propagating resets through the tree. */
    reset?: Reset;
    /** A function that is called when the tree node is clicked. */
    onClick?: (e?: MouseEvent | TouchEvent) => void;
    /** A function that is called when the tree node is held down. */
    onHold?: VoidFunction;
}

/**
 * The properties that are added onto a processed {@link TreeNodeOptions} to create an {@link TreeNode}.
 */
export interface TreeNode extends VueFeature {
    /** Whether or not this tree node can be clicked. */
    canClick?: MaybeRef<boolean>;
    /** The background color for this node. */
    color?: MaybeRef<string>;
    /** The label to display on this tree node. */
    display?: MaybeGetter<Renderable>;
    /** The color of the glow effect shown to notify the user there's something to do with this node. */
    glowColor?: MaybeRef<string>;
    /** A reset object attached to this node, used for propagating resets through the tree. */
    reset?: Reset;
    /** A function that is called when the tree node is clicked. */
    onClick?: (e?: MouseEvent | TouchEvent) => void;
    /** A function that is called when the tree node is held down. */
    onHold?: VoidFunction;
    /** A symbol that helps identify features of the same type. */
    type: typeof TreeNodeType;
}

/**
 * Lazily creates a tree node with the given options.
 * @param optionsFunc Tree Node options.
 */
export function createTreeNode<T extends TreeNodeOptions>(optionsFunc?: () => T) {
    return createLazyProxy(() => {
        const options = optionsFunc?.() ?? ({} as T);
        const { canClick, color, display, glowColor, onClick, onHold, ...props } = options;

        const treeNode = {
            type: TreeNodeType,
            ...(props as Omit<typeof props, keyof VueFeature | keyof TreeNodeOptions>),
            ...vueFeatureMixin("treeNode", options, () => (
                <TreeNode
                    canClick={treeNode.canClick}
                    display={treeNode.display}
                    onClick={treeNode.onClick}
                    onHold={treeNode.onHold}
                    color={treeNode.color}
                    glowColor={treeNode.glowColor}
                />
            )),
            canClick: processGetter(canClick) ?? true,
            color: processGetter(color),
            display,
            glowColor: processGetter(glowColor),
            onClick:
                onClick == null
                    ? undefined
                    : function (e) {
                          if (unref(treeNode.canClick) !== false) {
                              onClick.call(treeNode, e);
                          }
                      },
            onHold:
                onHold == null
                    ? undefined
                    : function () {
                          if (unref(treeNode.canClick) !== false) {
                              onHold.call(treeNode);
                          }
                      }
        } satisfies TreeNode;

        return treeNode;
    });
}

/** Represents a branch between two nodes in a tree. */
export interface TreeBranch extends Omit<Link, "startNode" | "endNode"> {
    startNode: TreeNode;
    endNode: TreeNode;
}

/**
 * An object that configures a {@link Tree}.
 */
export interface TreeOptions extends VueFeatureOptions {
    /** The nodes within the tree, in a 2D array. */
    nodes: MaybeRefOrGetter<TreeNode[][]>;
    /** Nodes to show on the left side of the tree. */
    leftSideNodes?: MaybeRefOrGetter<TreeNode[]>;
    /** Nodes to show on the right side of the tree. */
    rightSideNodes?: MaybeRefOrGetter<TreeNode[]>;
    /** The branches between nodes within this tree. */
    branches?: MaybeRefOrGetter<TreeBranch[]>;
    /** How to propagate resets through the tree. */
    resetPropagation?: ResetPropagation;
    /** A function that is called when a node within the tree is reset. */
    onReset?: (node: TreeNode) => void;
}

export interface Tree extends VueFeature {
    /** The nodes within the tree, in a 2D array. */
    nodes: MaybeRef<TreeNode[][]>;
    /** Nodes to show on the left side of the tree. */
    leftSideNodes?: MaybeRef<TreeNode[]>;
    /** Nodes to show on the right side of the tree. */
    rightSideNodes?: MaybeRef<TreeNode[]>;
    /** The branches between nodes within this tree. */
    branches?: MaybeRef<TreeBranch[]>;
    /** How to propagate resets through the tree. */
    resetPropagation?: ResetPropagation;
    /** A function that is called when a node within the tree is reset. */
    onReset?: (node: TreeNode) => void;
    /** The link objects for each of the branches of the tree.  */
    links: MaybeRef<Link[]>;
    /** Cause a reset on this node and propagate it through the tree according to {@link TreeOptions.resetPropagation}. */
    reset: (node: TreeNode) => void;
    /** A flag that is true while the reset is still propagating through the tree. */
    isResetting: Ref<boolean>;
    /** A reference to the node that caused the currently propagating reset. */
    resettingNode: Ref<TreeNode | null>;
    /** A symbol that helps identify features of the same type. */
    type: typeof TreeType;
}

/**
 * Lazily creates a tree with the given options.
 * @param optionsFunc Tree options.
 */
export function createTree<T extends TreeOptions>(optionsFunc: () => T) {
    return createLazyProxy(() => {
        const options = optionsFunc();
        const {
            branches: _branches,
            nodes,
            leftSideNodes,
            rightSideNodes,
            resetPropagation,
            onReset,
            style: _style,
            ...props
        } = options;

        const style = processGetter(_style);
        options.style = () => ({ position: "static", ...(unref(style) ?? {}) });

        const branches = _branches == null ? undefined : processGetter(_branches);

        const tree = {
            type: TreeType,
            ...(props as Omit<typeof props, keyof VueFeature | keyof TreeOptions>),
            ...vueFeatureMixin("tree", options, () => (
                <Tree
                    nodes={tree.nodes}
                    leftSideNodes={tree.leftSideNodes}
                    rightSideNodes={tree.rightSideNodes}
                    branches={tree.branches}
                />
            )),
            branches,
            isResetting: ref(false),
            resettingNode: shallowRef<TreeNode | null>(null),
            nodes: processGetter(nodes),
            leftSideNodes: processGetter(leftSideNodes),
            rightSideNodes: processGetter(rightSideNodes),
            links: branches == null ? [] : noPersist(branches),
            resetPropagation,
            onReset,
            reset: function (node: TreeNode) {
                tree.isResetting.value = true;
                tree.resettingNode.value = node;
                tree.resetPropagation?.(tree, node);
                tree.onReset?.(node);
                tree.isResetting.value = false;
                tree.resettingNode.value = null;
            }
        } satisfies Tree;

        return tree;
    });
}

/** A function that is used to propagate resets through a tree. */
export type ResetPropagation = {
    (tree: Tree, resettingNode: TreeNode): void;
};

/** Propagate resets down the tree by resetting every node in a lower row. */
export const defaultResetPropagation = function (tree: Tree, resettingNode: TreeNode): void {
    const nodes = unref(tree.nodes);
    const row = nodes.findIndex(nodes => nodes.includes(resettingNode)) - 1;
    for (let x = row; x >= 0; x--) {
        nodes[x].forEach(node => node.reset?.reset());
    }
};

/** Propagate resets down the tree by resetting every node in a lower row. */
export const invertedResetPropagation = function (tree: Tree, resettingNode: TreeNode): void {
    const nodes = unref(tree.nodes);
    const row = nodes.findIndex(nodes => nodes.includes(resettingNode)) + 1;
    for (let x = row; x < nodes.length; x++) {
        nodes[x].forEach(node => node.reset?.reset());
    }
};

/** Propagate resets down the branches of the tree. */
export const branchedResetPropagation = function (tree: Tree, resettingNode: TreeNode): void {
    const links = unref(tree.branches);
    if (links == null) return;
    const reset: TreeNode[] = [];
    let current = [resettingNode];
    while (current.length !== 0) {
        const next: TreeNode[] = [];
        for (const node of current) {
            for (const link of links.filter(link => link.startNode === node)) {
                if ([...reset, ...current].includes(link.endNode)) continue;
                next.push(link.endNode);
                link.endNode.reset?.reset();
            }
        }
        reset.push(...current);
        current = next;
    }
};

/**
 * Utility for creating a tooltip for a tree node that displays a resource-based unlock requirement, and after unlock shows the amount of another resource.
 * It sounds oddly specific, but comes up a lot.
 */
export function createResourceTooltip(
    resource: Resource,
    requiredResource: Resource | null = null,
    requirement: MaybeRefOrGetter<DecimalSource> = 0
): () => string {
    const req = processGetter(requirement);
    return () => {
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
    };
}
