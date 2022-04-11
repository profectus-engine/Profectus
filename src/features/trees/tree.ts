import {
    CoercableComponent,
    Component,
    OptionsFunc,
    GatherProps,
    getUniqueID,
    Replace,
    setDefault,
    StyleValue,
    Visibility
} from "features/feature";
import { Link } from "features/links/links";
import { GenericReset } from "features/reset";
import { displayResource, Resource } from "features/resources/resource";
import { Tooltip } from "features/tooltip";
import TreeComponent from "features/trees/Tree.vue";
import { deletePersistent, persistent } from "game/persistence";
import Decimal, { DecimalSource, format, formatWhole } from "util/bignum";
import {
    Computable,
    convertComputable,
    GetComputableType,
    GetComputableTypeWithDefault,
    processComputable,
    ProcessedComputable
} from "util/computed";
import { createLazyProxy } from "util/proxies";
import { computed, ref, Ref, shallowRef, unref } from "vue";

export const TreeNodeType = Symbol("TreeNode");
export const TreeType = Symbol("Tree");

export interface TreeNodeOptions {
    visibility?: Computable<Visibility>;
    canClick?: Computable<boolean>;
    color?: Computable<string>;
    display?: Computable<CoercableComponent>;
    tooltip?: Computable<string | Tooltip>;
    glowColor?: Computable<string>;
    classes?: Computable<Record<string, boolean>>;
    style?: Computable<StyleValue>;
    mark?: Computable<boolean | string>;
    reset?: GenericReset;
    onClick?: (e?: MouseEvent | TouchEvent) => void;
    onHold?: VoidFunction;
}

export interface BaseTreeNode {
    id: string;
    forceTooltip: Ref<boolean>;
    type: typeof TreeNodeType;
}

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
        tooltip: GetComputableType<T["tooltip"]>;
    }
>;

export type GenericTreeNode = Replace<
    TreeNode<TreeNodeOptions>,
    {
        visibility: ProcessedComputable<Visibility>;
        canClick: ProcessedComputable<boolean>;
    }
>;

export function createTreeNode<T extends TreeNodeOptions>(
    optionsFunc: OptionsFunc<T, TreeNode<T>, BaseTreeNode>
): TreeNode<T> {
    const forceTooltip = persistent(false);
    return createLazyProxy(() => {
        const treeNode = optionsFunc();
        treeNode.id = getUniqueID("treeNode-");
        treeNode.type = TreeNodeType;

        if (treeNode.tooltip) {
            treeNode.forceTooltip = forceTooltip;
        } else {
            // If we don't have a tooltip, no point in making this persistent
            treeNode.forceTooltip = ref(false);
            deletePersistent(forceTooltip);
        }

        processComputable(treeNode as T, "visibility");
        setDefault(treeNode, "visibility", Visibility.Visible);
        processComputable(treeNode as T, "canClick");
        setDefault(treeNode, "canClick", true);
        processComputable(treeNode as T, "color");
        processComputable(treeNode as T, "display");
        processComputable(treeNode as T, "tooltip");
        processComputable(treeNode as T, "glowColor");
        processComputable(treeNode as T, "classes");
        processComputable(treeNode as T, "style");
        processComputable(treeNode as T, "mark");

        if (treeNode.onClick) {
            const onClick = treeNode.onClick.bind(treeNode);
            treeNode.onClick = function () {
                if (unref(treeNode.canClick)) {
                    onClick();
                }
            };
        }
        if (treeNode.onHold) {
            const onHold = treeNode.onHold.bind(treeNode);
            treeNode.onHold = function () {
                if (unref(treeNode.canClick)) {
                    onHold();
                }
            };
        }

        return treeNode as unknown as TreeNode<T>;
    });
}

export interface TreeBranch extends Omit<Link, "startNode" | "endNode"> {
    startNode: GenericTreeNode;
    endNode: GenericTreeNode;
}

export interface TreeOptions {
    visibility?: Computable<Visibility>;
    nodes: Computable<GenericTreeNode[][]>;
    leftSideNodes?: Computable<GenericTreeNode[]>;
    rightSideNodes?: Computable<GenericTreeNode[]>;
    branches?: Computable<TreeBranch[]>;
    resetPropagation?: ResetPropagation;
    onReset?: (node: GenericTreeNode) => void;
}

export interface BaseTree {
    id: string;
    links: Ref<Link[]>;
    reset: (node: GenericTreeNode) => void;
    isResetting: Ref<boolean>;
    resettingNode: Ref<GenericTreeNode | null>;
    type: typeof TreeType;
    [Component]: typeof TreeComponent;
    [GatherProps]: () => Record<string, unknown>;
}

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

export type GenericTree = Replace<
    Tree<TreeOptions>,
    {
        visibility: ProcessedComputable<Visibility>;
    }
>;

export function createTree<T extends TreeOptions>(
    optionsFunc: OptionsFunc<T, Tree<T>, BaseTree>
): Tree<T> {
    return createLazyProxy(() => {
        const tree = optionsFunc();
        tree.id = getUniqueID("tree-");
        tree.type = TreeType;
        tree[Component] = TreeComponent;

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

export type ResetPropagation = {
    (tree: GenericTree, resettingNode: GenericTreeNode): void;
};

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

export function createResourceTooltip(
    resource: Resource,
    requiredResource: Resource | null = null,
    requirement: Computable<DecimalSource> = 0
): Ref<string> {
    const req = convertComputable(requirement);
    return computed(() => {
        if (requiredResource == null || Decimal.gte(resource.value, unref(req))) {
            return displayResource(resource);
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
