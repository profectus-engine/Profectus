import Collapsible from "components/layout/Collapsible.vue";
import { GenericAchievement } from "features/achievements/achievement";
import type { Clickable, ClickableOptions, GenericClickable } from "features/clickables/clickable";
import { createClickable } from "features/clickables/clickable";
import type { GenericConversion } from "features/conversion";
import type { CoercableComponent, JSXFunction, OptionsFunc, Replace } from "features/feature";
import { jsx, setDefault } from "features/feature";
import { Resource, displayResource } from "features/resources/resource";
import type { GenericTree, GenericTreeNode, TreeNode, TreeNodeOptions } from "features/trees/tree";
import { createTreeNode } from "features/trees/tree";
import type { GenericFormula } from "game/formulas/types";
import type { Modifier } from "game/modifiers";
import type { Persistent } from "game/persistence";
import { DefaultValue, persistent } from "game/persistence";
import player from "game/player";
import settings from "game/settings";
import type { DecimalSource } from "util/bignum";
import Decimal, { format, formatSmall, formatTime } from "util/bignum";
import { WithRequired, camelToTitle } from "util/common";
import type {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    ProcessedComputable
} from "util/computed";
import { convertComputable, processComputable } from "util/computed";
import { getFirstFeature, renderColJSX, renderJSX } from "util/vue";
import type { ComputedRef, Ref } from "vue";
import { computed, unref } from "vue";
import "./common.css";

/** An object that configures a {@link ResetButton} */
export interface ResetButtonOptions extends ClickableOptions {
    /** The conversion the button uses to calculate how much resources will be gained on click */
    conversion: GenericConversion;
    /** The tree this reset button is apart of */
    tree: GenericTree;
    /** The specific tree node associated with this reset button */
    treeNode: GenericTreeNode;
    /**
     * Text to display on low conversion amounts, describing what "resetting" is in this context.
     * Defaults to "Reset for ".
     */
    resetDescription?: Computable<string>;
    /** Whether or not to show how much currency would be required to make the gain amount increase. */
    showNextAt?: Computable<boolean>;
    /**
     * The content to display on the button.
     * By default, this includes the reset description, and amount of currency to be gained.
     */
    display?: Computable<CoercableComponent>;
    /**
     * Whether or not this button can currently be clicked.
     * Defaults to checking the current gain amount is greater than {@link minimumGain}
     */
    canClick?: Computable<boolean>;
    /**
     * When {@link canClick} is left to its default, minimumGain is used to only enable the reset button when a sufficient amount of currency to gain is available.
     */
    minimumGain?: Computable<DecimalSource>;
    /** A persistent ref to track how much time has passed since the last time this tree node was reset. */
    resetTime?: Persistent<DecimalSource>;
}

/**
 * A button that is used to control a conversion.
 * It will show how much can be converted currently, and can show when that amount will go up, as well as handle only being clickable when a sufficient amount of currency can be gained.
 * Assumes this button is associated with a specific node on a tree, and triggers that tree's reset propagation.
 */
export type ResetButton<T extends ResetButtonOptions> = Replace<
    Clickable<T>,
    {
        resetDescription: GetComputableTypeWithDefault<T["resetDescription"], Ref<string>>;
        showNextAt: GetComputableTypeWithDefault<T["showNextAt"], true>;
        display: GetComputableTypeWithDefault<T["display"], Ref<JSX.Element>>;
        canClick: GetComputableTypeWithDefault<T["canClick"], Ref<boolean>>;
        minimumGain: GetComputableTypeWithDefault<T["minimumGain"], 1>;
        onClick: (event?: MouseEvent | TouchEvent) => void;
    }
>;

/** A type that matches any valid {@link ResetButton} object. */
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

/**
 * Lazily creates a reset button with the given options.
 * @param optionsFunc A function that returns the options object for this reset button.
 */
export function createResetButton<T extends ClickableOptions & ResetButtonOptions>(
    optionsFunc: OptionsFunc<T>
): ResetButton<T> {
    return createClickable(feature => {
        const resetButton = optionsFunc.call(feature, feature);

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
                    {unref(resetButton.showNextAt) != null ? (
                        <div>
                            <br />
                            {unref(resetButton.conversion.buyMax) ? "Next:" : "Req:"}{" "}
                            {displayResource(
                                resetButton.conversion.baseResource,
                                unref(resetButton.conversion.buyMax) ||
                                    Decimal.lt(unref(resetButton.conversion.actualGain), 1)
                                    ? unref(resetButton.conversion.currentAt)
                                    : unref(resetButton.conversion.nextAt)
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
        resetButton.onClick = function (event?: MouseEvent | TouchEvent) {
            if (unref(resetButton.canClick) === false) {
                return;
            }
            resetButton.conversion.convert();
            resetButton.tree.reset(resetButton.treeNode);
            if (resetButton.resetTime) {
                resetButton.resetTime.value = resetButton.resetTime[DefaultValue];
            }
            onClick?.(event);
        };

        return resetButton;
    }) as unknown as ResetButton<T>;
}

/** An object that configures a {@link LayerTreeNode} */
export interface LayerTreeNodeOptions extends TreeNodeOptions {
    /** The ID of the layer this tree node is associated with */
    layerID: string;
    /** The color to display this tree node as */
    color: Computable<string>; // marking as required
    /** Whether or not to append the layer to the tabs list.
     * If set to false, then the tree node will instead always remove all tabs to its right and then add the layer tab.
     * Defaults to true.
     */
    append?: Computable<boolean>;
}
/** A tree node that is associated with a given layer, and which opens the layer when clicked. */
export type LayerTreeNode<T extends LayerTreeNodeOptions> = Replace<
    TreeNode<T>,
    {
        display: GetComputableTypeWithDefault<T["display"], T["layerID"]>;
        append: GetComputableType<T["append"]>;
    }
>;
/** A type that matches any valid {@link LayerTreeNode} object. */
export type GenericLayerTreeNode = Replace<
    LayerTreeNode<LayerTreeNodeOptions>,
    {
        display: ProcessedComputable<CoercableComponent>;
        append?: ProcessedComputable<boolean>;
    }
>;

/**
 * Lazily creates a tree node that's associated with a specific layer, with the given options.
 * @param optionsFunc A function that returns the options object for this tree node.
 */
export function createLayerTreeNode<T extends LayerTreeNodeOptions>(
    optionsFunc: OptionsFunc<T>
): LayerTreeNode<T> {
    return createTreeNode(feature => {
        const options = optionsFunc.call(feature, feature);
        setDefault(options, "display", camelToTitle(options.layerID));
        processComputable(options as T, "append");
        return {
            ...options,
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

/** An option object for a modifier display as a single section. **/
export interface Section {
    /** The header for this modifier. **/
    title: Computable<string>;
    /** A subtitle for this modifier, e.g. to explain the context for the modifier. **/
    subtitle?: Computable<string>;
    /** The modifier to be displaying in this section. **/
    modifier: WithRequired<Modifier, "description">;
    /** The base value being modified. **/
    base?: Computable<DecimalSource>;
    /** The unit of measurement for the base. **/
    unit?: string;
    /** The label to call the base amount. Defaults to "Base". **/
    baseText?: Computable<CoercableComponent>;
    /** Whether or not this section should be currently visible to the player. **/
    visible?: Computable<boolean>;
    /** Determines if numbers larger or smaller than the base should be displayed as red. */
    smallerIsBetter?: boolean;
}

/**
 * Takes an array of modifier "sections", and creates a JSXFunction that can render all those sections, and allow each section to be collapsed.
 * Also returns a list of persistent refs that are used to control which sections are currently collapsed.
 * @param sectionsFunc A function that returns the sections to display.
 */
export function createCollapsibleModifierSections(
    sectionsFunc: () => Section[]
): [JSXFunction, Persistent<Record<number, boolean>>] {
    const sections: Section[] = [];
    const processed:
        | {
              base: ProcessedComputable<DecimalSource | undefined>[];
              baseText: ProcessedComputable<CoercableComponent | undefined>[];
              visible: ProcessedComputable<boolean | undefined>[];
              title: ProcessedComputable<string | undefined>[];
              subtitle: ProcessedComputable<string | undefined>[];
          }
        | Record<string, never> = {};
    let calculated = false;
    function calculateSections() {
        if (!calculated) {
            sections.push(...sectionsFunc());
            processed.base = sections.map(s => convertComputable(s.base));
            processed.baseText = sections.map(s => convertComputable(s.baseText));
            processed.visible = sections.map(s => convertComputable(s.visible));
            processed.title = sections.map(s => convertComputable(s.title));
            processed.subtitle = sections.map(s => convertComputable(s.subtitle));
            calculated = true;
        }
        return sections;
    }

    const collapsed = persistent<Record<number, boolean>>({}, false);
    const jsxFunc = jsx(() => {
        const sections = calculateSections();

        let firstVisibleSection = true;
        const sectionJSX = sections.map((s, i) => {
            if (unref(processed.visible[i]) === false) return null;
            const header = (
                <h3
                    onClick={() => (collapsed.value[i] = !collapsed.value[i])}
                    style="cursor: pointer"
                >
                    <span
                        class={"modifier-toggle" + (unref(collapsed.value[i]) ? " collapsed" : "")}
                    >
                        ▼
                    </span>
                    {unref(processed.title[i])}
                    {unref(processed.subtitle[i]) != null ? (
                        <span class="subtitle"> ({unref(processed.subtitle[i])})</span>
                    ) : null}
                </h3>
            );

            const modifiers = unref(collapsed.value[i]) ? null : (
                <>
                    <div class="modifier-container">
                        <span class="modifier-description">
                            {renderJSX(unref(processed.baseText[i]) ?? "Base")}
                        </span>
                        <span class="modifier-amount">
                            {format(unref(processed.base[i]) ?? 1)}
                            {s.unit}
                        </span>
                    </div>
                    {s.modifier.description == null
                        ? null
                        : renderJSX(unref(s.modifier.description))}
                </>
            );

            const hasPreviousSection = !firstVisibleSection;
            firstVisibleSection = false;

            const base = unref(processed.base[i]) ?? 1;
            const total = s.modifier.apply(base);

            return (
                <>
                    {hasPreviousSection ? <br /> : null}
                    <div
                        style={{
                            "--unit":
                                settings.alignUnits && s.unit != null ? "'" + s.unit + "'" : ""
                        }}
                    >
                        {header}
                        <br />
                        {modifiers}
                        <hr />
                        <div class="modifier-container">
                            <span class="modifier-description">Total</span>
                            <span
                                class="modifier-amount"
                                style={
                                    (
                                        s.smallerIsBetter === true
                                            ? Decimal.gt(total, base ?? 1)
                                            : Decimal.lt(total, base ?? 1)
                                    )
                                        ? "color: var(--danger)"
                                        : ""
                                }
                            >
                                {formatSmall(total)}
                                {s.unit}
                            </span>
                        </div>
                    </div>
                </>
            );
        });
        return <>{sectionJSX}</>;
    });
    return [jsxFunc, collapsed];
}

/**
 * Creates an HTML string for a span that writes some given text in a given color.
 * @param textToColor The content to change the color of
 * @param color The color to change the content to look like. Defaults to the current theme's accent 2 variable.
 */
export function colorText(textToColor: string, color = "var(--accent2)"): JSX.Element {
    return <span style={{ color }}>{textToColor}</span>;
}

/**
 * Creates a collapsible display of a list of achievements
 * @param achievements A dictionary of the achievements to display, inserted in the order from easiest to hardest
 */
export function createCollapsibleAchievements(achievements: Record<string, GenericAchievement>) {
    // Achievements are typically defined from easiest to hardest, and we want to show hardest first
    const orderedAchievements = Object.values(achievements).reverse();
    const collapseAchievements = persistent<boolean>(true, false);
    const lockedAchievements = computed(() =>
        orderedAchievements.filter(m => m.earned.value === false)
    );
    const { firstFeature, collapsedContent, hasCollapsedContent } = getFirstFeature(
        orderedAchievements,
        m => m.earned.value
    );
    const display = jsx(() => {
        const achievementsToDisplay = [...lockedAchievements.value];
        if (firstFeature.value) {
            achievementsToDisplay.push(firstFeature.value);
        }
        return renderColJSX(
            ...achievementsToDisplay,
            jsx(() => (
                <Collapsible
                    collapsed={collapseAchievements}
                    content={collapsedContent}
                    display={
                        collapseAchievements.value
                            ? "Show other completed achievements"
                            : "Hide other completed achievements"
                    }
                    v-show={unref(hasCollapsedContent)}
                />
            ))
        );
    });
    return {
        collapseAchievements: collapseAchievements,
        display
    };
}

/**
 * Utility function for getting an ETA for when a target will be reached by a resource with a known (and assumed consistent) gain.
 * @param resource The resource that will be increasing over time.
 * @param rate The rate at which the resource is increasing.
 * @param target The target amount of the resource to estimate the duration until.
 */
export function estimateTime(
    resource: Resource,
    rate: Computable<DecimalSource>,
    target: Computable<DecimalSource>
) {
    const processedRate = convertComputable(rate);
    const processedTarget = convertComputable(target);
    return computed(() => {
        const currRate = unref(processedRate);
        const currTarget = unref(processedTarget);
        if (Decimal.gte(resource.value, currTarget)) {
            return "Now";
        } else if (Decimal.lte(currRate, 0)) {
            return "Never";
        }
        return formatTime(Decimal.sub(currTarget, resource.value).div(currRate));
    });
}

/**
 * Utility function for displaying the result of a formula such that it will, when told to, preview how the formula's result will change.
 * Requires a formula with a single variable inside.
 * @param formula The formula to display the result of.
 * @param showPreview Whether or not to preview how the formula's result will change.
 * @param previewAmount The amount to _add_ to the current formula's variable amount to preview the change in result.
 */
export function createFormulaPreview(
    formula: GenericFormula,
    showPreview: Computable<boolean>,
    previewAmount: Computable<DecimalSource> = 1
) {
    const processedShowPreview = convertComputable(showPreview);
    const processedPreviewAmount = convertComputable(previewAmount);
    if (!formula.hasVariable()) {
        console.error("Cannot create formula preview if the formula does not have a variable");
    }
    return jsx(() => {
        if (unref(processedShowPreview)) {
            const curr = formatSmall(formula.evaluate());
            const preview = formatSmall(
                formula.evaluate(
                    Decimal.add(
                        unref(formula.innermostVariable ?? 0),
                        unref(processedPreviewAmount)
                    )
                )
            );
            return (
                <>
                    <b>
                        <i>
                            {curr} → {preview}
                        </i>
                    </b>
                </>
            );
        }
        return <>{formatSmall(formula.evaluate())}</>;
    });
}
