import TreeComponent from "@/components/features/tree/Tree.vue";
import {
    CoercableComponent,
    Component,
    getUniqueID,
    persistent,
    Replace,
    setDefault,
    StyleValue,
    Visibility
} from "@/features/feature";
import { displayResource, Resource } from "@/features/resource";
import { DecimalSource, format } from "@/util/bignum";
import Decimal, { formatWhole } from "@/util/break_eternity";
import {
    Computable,
    convertComputable,
    GetComputableType,
    GetComputableTypeWithDefault,
    processComputable,
    ProcessedComputable
} from "@/util/computed";
import { createProxy } from "@/util/proxies";
import { computed, ref, Ref, unref } from "vue";
import { Link } from "./links";
import { GenericReset } from "./reset";
import { Tooltip } from "./tooltip";

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
    onClick?: VoidFunction;
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
    options: T & ThisType<TreeNode<T>>
): TreeNode<T> {
    const treeNode: T & Partial<BaseTreeNode> = options;
    treeNode.id = getUniqueID("treeNode-");
    treeNode.type = TreeNodeType;

    if (treeNode.tooltip) {
        treeNode.forceTooltip = persistent(false);
    } else {
        // If we don't have a tooltip, no point in making this persistent
        treeNode.forceTooltip = ref(false);
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

    const proxy = createProxy(treeNode as unknown as TreeNode<T>);
    return proxy;
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

interface BaseTree {
    id: string;
    links: Ref<Link[]>;
    reset: (node: GenericTreeNode) => void;
    isResetting: Ref<boolean>;
    resettingNode: Ref<GenericTreeNode | null>;
    type: typeof TreeType;
    [Component]: typeof TreeComponent;
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

export function createTree<T extends TreeOptions>(options: T & ThisType<Tree<T>>): Tree<T> {
    const tree: T & Partial<BaseTree> = options;
    tree.id = getUniqueID("tree-");
    tree.type = TreeType;
    tree[Component] = TreeComponent;

    tree.isResetting = ref(false);
    tree.resettingNode = ref(null);

    tree.reset = function (node) {
        proxy.isResetting.value = true;
        proxy.resettingNode.value = node;
        proxy.resetPropagation?.(proxy, node);
        proxy.isResetting.value = false;
        proxy.resettingNode.value = null;
    };
    tree.links = computed(() => proxy.branches as Link[]);

    processComputable(tree as T, "visibility");
    setDefault(tree, "visibility", Visibility.Visible);
    processComputable(tree as T, "nodes");
    processComputable(tree as T, "leftSideNodes");
    processComputable(tree as T, "rightSideNodes");
    processComputable(tree as T, "branches");

    const proxy = createProxy(tree as unknown as Tree<T>);
    return proxy;
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
                    .filter(
                        branch =>
                            branch.startNode === node &&
                            !visitedNodes.includes(unref(branch.endNode))
                    )
                    .forEach(branch => {
                        visitedNodes.push(branch.startNode);
                        nextNodes.push(branch.endNode);
                    });
            });
            currentNodes = nextNodes;
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
