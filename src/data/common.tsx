import type { Clickable, ClickableOptions, GenericClickable } from "features/clickables/clickable";
import { createClickable } from "features/clickables/clickable";
import type { GenericConversion } from "features/conversion";
import type { CoercableComponent, JSXFunction, OptionsFunc, Replace } from "features/feature";
import { jsx, setDefault } from "features/feature";
import { displayResource } from "features/resources/resource";
import type { GenericTree, GenericTreeNode, TreeNode, TreeNodeOptions } from "features/trees/tree";
import { createTreeNode } from "features/trees/tree";
import type { Modifier } from "game/modifiers";
import type { Persistent } from "game/persistence";
import { DefaultValue, persistent } from "game/persistence";
import player from "game/player";
import type { DecimalSource } from "util/bignum";
import Decimal, { format } from "util/bignum";
import type { WithRequired } from "util/common";
import type {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    ProcessedComputable
} from "util/computed";
import { convertComputable, processComputable } from "util/computed";
import { renderJSX } from "util/vue";
import type { Ref } from "vue";
import { computed, unref } from "vue";
import "./common.css";

export interface ResetButtonOptions extends ClickableOptions {
    conversion: GenericConversion;
    tree: GenericTree;
    treeNode: GenericTreeNode;
    resetDescription?: Computable<string>;
    showNextAt?: Computable<boolean>;
    display?: Computable<CoercableComponent>;
    canClick?: Computable<boolean>;
    minimumGain?: Computable<DecimalSource>;
    resetTime?: Persistent<DecimalSource>;
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
                    {unref(resetButton.showNextAt) ? (
                        <div>
                            <br />
                            {unref(resetButton.conversion.buyMax) ? "Next:" : "Req:"}{" "}
                            {displayResource(
                                resetButton.conversion.baseResource,
                                unref(resetButton.conversion.buyMax) ||
                                    Decimal.floor(unref(resetButton.conversion.actualGain)).neq(1)
                                    ? unref(resetButton.conversion.nextAt)
                                    : unref(resetButton.conversion.currentAt)
                            )}{" "}
                            {resetButton.conversion.baseResource.displayName}
                        </div>
                    ) : null}
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
            if (resetButton.resetTime) {
                resetButton.resetTime.value = resetButton.resetTime[DefaultValue];
            }
            onClick?.();
        };

        return resetButton;
    }) as unknown as ResetButton<T>;
}

export interface LayerTreeNodeOptions extends TreeNodeOptions {
    layerID: string;
    color: Computable<string>; // marking as required
    display?: Computable<CoercableComponent>;
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
        display: ProcessedComputable<CoercableComponent>;
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
            display: options.display,
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

export function createCollapsibleModifierSections(
    sections: {
        title: string;
        subtitle?: string;
        modifier: WithRequired<Modifier, "description">;
        base?: Computable<DecimalSource>;
        unit?: string;
        baseText?: Computable<CoercableComponent>;
        visible?: Computable<boolean>;
    }[]
): [JSXFunction, Persistent<boolean>[]] {
    const processedBase = sections.map(s => convertComputable(s.base));
    const processedBaseText = sections.map(s => convertComputable(s.baseText));
    const processedVisible = sections.map(s => convertComputable(s.visible));
    const collapsed = sections.map(() => persistent<boolean>(false));
    const jsxFunc = jsx(() => {
        const sectionJSX = sections.map((s, i) => {
            if (unref(processedVisible[i]) === false) return null;
            const header = (
                <h3
                    onClick={() => (collapsed[i].value = !collapsed[i].value)}
                    style="cursor: pointer"
                >
                    <span class={"modifier-toggle" + (unref(collapsed[i]) ? " collapsed" : "")}>
                        ▼
                    </span>
                    {s.title}
                    {s.subtitle ? <span class="subtitle"> ({s.subtitle})</span> : null}
                </h3>
            );

            const modifiers = unref(collapsed[i]) ? null : (
                <>
                    <div class="modifier-container">
                        <span class="modifier-amount">
                            {format(unref(processedBase[i]) ?? 1)}
                            {s.unit}
                        </span>
                        <span class="modifier-description">
                            {renderJSX(unref(processedBaseText[i]) ?? "Base")}
                        </span>
                    </div>
                    {renderJSX(unref(s.modifier.description))}
                </>
            );

            return (
                <>
                    {i === 0 ? null : <br />}
                    <div>
                        {header}
                        <br />
                        {modifiers}
                        <hr />
                        Total: {format(s.modifier.apply(unref(processedBase[i]) ?? 1))}
                        {s.unit}
                    </div>
                </>
            );
        });
        return <>{sectionJSX}</>;
    });
    return [jsxFunc, collapsed];
}
