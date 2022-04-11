import {
    Clickable,
    ClickableOptions,
    createClickable,
    GenericClickable
} from "features/clickables/clickable";
import { GenericConversion } from "features/conversion";
import { CoercableComponent, OptionsFunc, jsx, Replace, setDefault } from "features/feature";
import { displayResource } from "features/resources/resource";
import {
    createTreeNode,
    GenericTree,
    GenericTreeNode,
    TreeNode,
    TreeNodeOptions
} from "features/trees/tree";
import player from "game/player";
import Decimal, { DecimalSource } from "util/bignum";
import {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    processComputable,
    ProcessedComputable
} from "util/computed";
import { computed, Ref, unref } from "vue";

export interface ResetButtonOptions extends ClickableOptions {
    conversion: GenericConversion;
    tree: GenericTree;
    treeNode: GenericTreeNode;
    resetDescription?: Computable<string>;
    showNextAt?: Computable<boolean>;
    display?: Computable<CoercableComponent>;
    canClick?: Computable<boolean>;
    minimumGain?: Computable<DecimalSource>;
}

export type ResetButton<T extends ResetButtonOptions> = Replace<
    Clickable<T>,
    {
        resetDescription: GetComputableTypeWithDefault<T["resetDescription"], Ref<string>>;
        showNextAt: GetComputableTypeWithDefault<T["showNextAt"], true>;
        display: GetComputableTypeWithDefault<T["display"], Ref<JSX.Element>>;
        canClick: GetComputableTypeWithDefault<T["canClick"], Ref<boolean>>;
        minimumGain: GetComputableTypeWithDefault<T["minimumGain"], 1>;
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
        minimumGain: ProcessedComputable<DecimalSource>;
    }
>;

export function createResetButton<T extends ClickableOptions & ResetButtonOptions>(
    optionsFunc: OptionsFunc<T>
): ResetButton<T> {
    return createClickable(() => {
        const resetButton = optionsFunc();

        processComputable(resetButton as T, "showNextAt");
        setDefault(resetButton, "showNextAt", true);
        setDefault(resetButton, "minimumGain", 1);

        if (resetButton.resetDescription == null) {
            resetButton.resetDescription = computed(() =>
                Decimal.lt(resetButton.conversion.gainResource.value, 1e3) ? "Reset for " : ""
            );
        } else {
            processComputable(resetButton as T, "resetDescription");
        }

        if (resetButton.display == null) {
            resetButton.display = jsx(() => (
                <span>
                    {unref(resetButton.resetDescription as ProcessedComputable<string>)}
                    <b>
                        {displayResource(
                            resetButton.conversion.gainResource,
                            Decimal.max(
                                unref(resetButton.conversion.actualGain),
                                unref(resetButton.minimumGain as ProcessedComputable<DecimalSource>)
                            )
                        )}
                    </b>{" "}
                    {resetButton.conversion.gainResource.displayName}
                    <div v-show={unref(resetButton.showNextAt)}>
                        <br />
                        {resetButton.conversion.buyMax ? "Next:" : "Req:"}{" "}
                        {displayResource(
                            resetButton.conversion.baseResource,
                            resetButton.conversion.buyMax ||
                                Decimal.floor(unref(resetButton.conversion.actualGain)).neq(1)
                                ? unref(resetButton.conversion.nextAt)
                                : unref(resetButton.conversion.currentAt)
                        )}{" "}
                        {resetButton.conversion.baseResource.displayName}
                    </div>
                </span>
            ));
        }

        if (resetButton.canClick == null) {
            resetButton.canClick = computed(() =>
                Decimal.gte(
                    unref(resetButton.conversion.actualGain),
                    unref(resetButton.minimumGain as ProcessedComputable<DecimalSource>)
                )
            );
        }

        const onClick = resetButton.onClick;
        resetButton.onClick = function () {
            if (!unref(resetButton.canClick)) {
                return;
            }
            resetButton.conversion.convert();
            resetButton.tree.reset(resetButton.treeNode);
            onClick?.();
        };

        return resetButton;
    }) as unknown as ResetButton<T>;
}

export interface LayerTreeNodeOptions extends TreeNodeOptions {
    layerID: string;
    color: Computable<string>; // marking as required
    display?: Computable<string>;
    append?: Computable<boolean>;
}
export type LayerTreeNode<T extends LayerTreeNodeOptions> = Replace<
    TreeNode<T>,
    {
        display: GetComputableTypeWithDefault<T["display"], T["layerID"]>;
        append: GetComputableType<T["append"]>;
    }
>;
export type GenericLayerTreeNode = Replace<
    LayerTreeNode<LayerTreeNodeOptions>,
    {
        display: ProcessedComputable<string>;
        append?: ProcessedComputable<boolean>;
    }
>;

export function createLayerTreeNode<T extends LayerTreeNodeOptions>(
    optionsFunc: OptionsFunc<T>
): LayerTreeNode<T> {
    return createTreeNode(() => {
        const options = optionsFunc();
        processComputable(options as T, "display");
        setDefault(options, "display", options.layerID);
        processComputable(options as T, "append");
        return {
            ...options,
            display: options.layerID,
            onClick: unref((options as unknown as GenericLayerTreeNode).append)
                ? function () {
                      if (player.tabs.includes(options.layerID)) {
                          const index = player.tabs.lastIndexOf(options.layerID);
                          player.tabs.splice(index, 1);
                      } else {
                          player.tabs.push(options.layerID);
                      }
                  }
                : function () {
                      player.tabs.splice(1, 1, options.layerID);
                  }
        };
    }) as unknown as LayerTreeNode<T>;
}
