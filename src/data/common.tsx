import {
    Clickable,
    ClickableOptions,
    createClickable,
    GenericClickable
} from "@/features/clickable";
import { GenericConversion } from "@/features/conversion";
import { CoercableComponent, Replace, setDefault } from "@/features/feature";
import { displayResource } from "@/features/resource";
import {
    createTreeNode,
    GenericTree,
    GenericTreeNode,
    TreeNode,
    TreeNodeOptions
} from "@/features/tree";
import player from "@/game/player";
import Decimal from "@/util/bignum";
import {
    Computable,
    GetComputableTypeWithDefault,
    processComputable,
    ProcessedComputable
} from "@/util/computed";
import { computed, Ref, unref } from "vue";

export interface ResetButtonOptions extends ClickableOptions {
    conversion: GenericConversion;
    tree: GenericTree;
    treeNode: GenericTreeNode;
    resetDescription?: Computable<string>;
    showNextAt?: Computable<boolean>;
    display?: Computable<CoercableComponent>;
    canClick?: Computable<boolean>;
}

type ResetButton<T extends ResetButtonOptions> = Replace<
    Clickable<T>,
    {
        resetDescription: GetComputableTypeWithDefault<T["resetDescription"], Ref<string>>;
        showNextAt: GetComputableTypeWithDefault<T["showNextAt"], true>;
        display: GetComputableTypeWithDefault<T["display"], Ref<JSX.Element>>;
        canClick: GetComputableTypeWithDefault<T["canClick"], Ref<boolean>>;
        onClick: VoidFunction;
    }
>;

export type GenericResetButton = Replace<
    GenericClickable & ResetButton<ResetButtonOptions>,
    {
        resetDescription: ProcessedComputable<string>;
        showNextAt: ProcessedComputable<boolean>;
        display: ProcessedComputable<CoercableComponent>;
        canClick: ProcessedComputable<boolean>;
    }
>;

export function createResetButton<T extends ClickableOptions & ResetButtonOptions>(
    options: T
): ResetButton<T> {
    setDefault(options, "showNextAt", true);
    if (options.resetDescription == null) {
        options.resetDescription = computed(() =>
            Decimal.lt(proxy.conversion.gainResource.value, 1e3) ? "Reset for " : ""
        );
    }
    if (options.display == null) {
        options.display = computed(() => {
            const nextAt = unref(proxy.showNextAt) && (
                <template>
                    <br />
                    <br />
                    Next:{" "}
                    {displayResource(
                        proxy.conversion.baseResource,
                        unref(proxy.conversion.nextAt)
                    )}{" "}
                    {proxy.conversion.baseResource.displayName}
                </template>
            );
            return (
                <span>
                    {proxy.resetDescription}
                    <b>
                        {displayResource(
                            proxy.conversion.gainResource,
                            unref(proxy.conversion.currentGain)
                        )}
                    </b>
                    {proxy.conversion.gainResource.displayName}
                    {nextAt}
                </span>
            );
        });
    }
    if (options.canClick == null) {
        options.canClick = computed(() => Decimal.gt(unref(proxy.conversion.currentGain), 0));
    }
    const onClick = options.onClick;
    options.onClick = function () {
        proxy.conversion.convert();
        proxy.tree.reset(proxy.treeNode);
        onClick?.();
    };

    const proxy = createClickable(options) as unknown as ResetButton<T>;
    return proxy;
}

export interface LayerTreeNodeOptions extends TreeNodeOptions {
    layerID: string;
    color: string;
    append?: boolean;
}
export type LayerTreeNode<T extends LayerTreeNodeOptions> = Replace<
    TreeNode<T>,
    {
        append: ProcessedComputable<boolean>;
    }
>;
export type GenericLayerTreeNode = LayerTreeNode<LayerTreeNodeOptions>;

export function createLayerTreeNode<T extends LayerTreeNodeOptions>(options: T): LayerTreeNode<T> {
    processComputable(options as T, "append");

    return createTreeNode({
        ...options,
        display: options.layerID,
        onClick:
            options.append != null && options.append
                ? function () {
                      if (player.tabs.includes(options.layerID)) {
                          const index = player.tabs.lastIndexOf(options.layerID);
                          player.tabs = [
                              ...player.tabs.slice(0, index),
                              ...player.tabs.slice(index + 1)
                          ];
                      } else {
                          player.tabs = [...player.tabs, options.layerID];
                      }
                  }
                : function () {
                      player.tabs.splice(1, 1, options.layerID);
                  }
    }) as unknown as LayerTreeNode<T>;
}
