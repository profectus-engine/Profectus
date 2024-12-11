import Collapsible from "components/layout/Collapsible.vue";
import { Achievement } from "features/achievements/achievement";
import type { Clickable, ClickableOptions } from "features/clickables/clickable";
import { createClickable } from "features/clickables/clickable";
import { Conversion } from "features/conversion";
import { getFirstFeature } from "features/feature";
import { displayResource, Resource } from "features/resources/resource";
import type { Tree, TreeNode, TreeNodeOptions } from "features/trees/tree";
import { createTreeNode } from "features/trees/tree";
import type { GenericFormula } from "game/formulas/types";
import { BaseLayer } from "game/layers";
import { Modifier } from "game/modifiers";
import type { Persistent } from "game/persistence";
import { DefaultValue, persistent } from "game/persistence";
import player from "game/player";
import settings from "game/settings";
import type { DecimalSource } from "util/bignum";
import Decimal, { format, formatSmall, formatTime } from "util/bignum";
import { WithRequired } from "util/common";
import { MaybeGetter, processGetter } from "util/computed";
import { render, Renderable, renderCol } from "util/vue";
import type { ComputedRef, MaybeRef, MaybeRefOrGetter } from "vue";
import { computed, ref, unref } from "vue";
import { JSX } from "vue/jsx-runtime";
import "./common.css";

/** An object that configures a {@link ResetButton} */
export interface ResetButtonOptions extends ClickableOptions {
    /** The conversion the button uses to calculate how much resources will be gained on click */
    conversion: Conversion;
    /** The tree this reset button is apart of */
    tree: Tree;
    /** The specific tree node associated with this reset button */
    treeNode: TreeNode;
    /**
     * Text to display on low conversion amounts, describing what "resetting" is in this context.
     * Defaults to "Reset for ".
     */
    resetDescription?: MaybeRefOrGetter<string>;
    /** Whether or not to show how much currency would be required to make the gain amount increase. */
    showNextAt?: MaybeRefOrGetter<boolean>;
    /**
     * The content to display on the button.
     * By default, this includes the reset description, and amount of currency to be gained.
     */
    display?: MaybeGetter<Renderable>;
    /**
     * Whether or not this button can currently be clicked.
     * Defaults to checking the current gain amount is greater than {@link minimumGain}
     */
    canClick?: MaybeRefOrGetter<boolean>;
    /**
     * When {@link canClick} is left to its default, minimumGain is used to only enable the reset button when a sufficient amount of currency to gain is available.
     */
    minimumGain?: MaybeRefOrGetter<DecimalSource>;
    /** A persistent ref to track how much time has passed since the last time this tree node was reset. */
    resetTime?: Persistent<DecimalSource>;
}

/**
 * A button that is used to control a conversion.
 * It will show how much can be converted currently, and can show when that amount will go up, as well as handle only being clickable when a sufficient amount of currency can be gained.
 * Assumes this button is associated with a specific node on a tree, and triggers that tree's reset propagation.
 */
export interface ResetButton extends Clickable {
    /** The conversion the button uses to calculate how much resources will be gained on click */
    conversion: Conversion;
    /** The tree this reset button is apart of */
    tree: Tree;
    /** The specific tree node associated with this reset button */
    treeNode: TreeNode;
    /**
     * Text to display on low conversion amounts, describing what "resetting" is in this context.
     * Defaults to "Reset for ".
     */
    resetDescription?: MaybeRef<string>;
    /** Whether or not to show how much currency would be required to make the gain amount increase. */
    showNextAt?: MaybeRef<boolean>;
    /**
     * When {@link canClick} is left to its default, minimumGain is used to only enable the reset button when a sufficient amount of currency to gain is available.
     */
    minimumGain?: MaybeRef<DecimalSource>;
    /** A persistent ref to track how much time has passed since the last time this tree node was reset. */
    resetTime?: Persistent<DecimalSource>;
}

/**
 * Lazily creates a reset button with the given options.
 * @param optionsFunc A function that returns the options object for this reset button.
 */
export function createResetButton<T extends ClickableOptions & ResetButtonOptions>(
    optionsFunc: () => T
) {
    const resetButton = createClickable(() => {
        const options = optionsFunc();
        const {
            conversion,
            tree,
            treeNode,
            resetTime,
            resetDescription,
            showNextAt,
            minimumGain,
            display,
            canClick,
            onClick,
            ...props
        } = options;

        return {
            ...(props as Omit<typeof props, keyof ResetButtonOptions>),
            conversion,
            tree,
            treeNode,
            resetTime,
            resetDescription:
                processGetter(resetDescription) ??
                computed((): string =>
                    Decimal.lt(conversion.gainResource.value, 1e3) ? "Reset for " : ""
                ),
            showNextAt: processGetter(showNextAt) ?? true,
            minimumGain: processGetter(minimumGain) ?? 1,
            canClick:
                processGetter(canClick) ??
                computed((): boolean =>
                    Decimal.gte(unref(conversion.actualGain), unref(resetButton.minimumGain))
                ),
            display:
                display ??
                ((): JSX.Element => (
                    <span>
                        {unref(resetButton.resetDescription)}
                        <b>
                            {displayResource(
                                conversion.gainResource,
                                Decimal.max(
                                    unref(conversion.actualGain),
                                    unref(resetButton.minimumGain)
                                )
                            )}
                        </b>{" "}
                        {conversion.gainResource.displayName}
                        {unref(resetButton.showNextAt) != null ? (
                            <div>
                                <br />
                                {unref(conversion.buyMax) ? "Next:" : "Req:"}{" "}
                                {displayResource(
                                    conversion.baseResource,
                                    !unref<boolean>(conversion.buyMax) &&
                                        Decimal.gte(unref(conversion.actualGain), 1)
                                        ? unref(conversion.currentAt)
                                        : unref(conversion.nextAt)
                                )}{" "}
                                {conversion.baseResource.displayName}
                            </div>
                        ) : null}
                    </span>
                )),
            onClick: function (e?: MouseEvent | TouchEvent) {
                if (unref(resetButton.canClick) === false) {
                    return;
                }
                conversion.convert();
                tree.reset(treeNode);
                if (resetTime) {
                    resetTime.value = resetTime[DefaultValue];
                }
                onClick?.call(resetButton, e);
            }
        };
    }) satisfies ResetButton;

    return resetButton;
}

/** An object that configures a {@link LayerTreeNode} */
export interface LayerTreeNodeOptions extends TreeNodeOptions {
    /** The ID of the layer this tree node is associated with */
    layerID: string;
    /** The color to display this tree node as */
    color: MaybeRefOrGetter<string>; // marking as required
    /** Whether or not to append the layer to the tabs list.
     * If set to false, then the tree node will instead always remove all tabs to its right and then add the layer tab.
     * Defaults to true.
     */
    append?: MaybeRefOrGetter<boolean>;
}

/** A tree node that is associated with a given layer, and which opens the layer when clicked. */
export interface LayerTreeNode extends TreeNode {
    /** The ID of the layer this tree node is associated with */
    layerID: string;
    /** Whether or not to append the layer to the tabs list.
     * If set to false, then the tree node will instead always remove all tabs to its right and then add the layer tab.
     * Defaults to true.
     */
    append?: MaybeRef<boolean>;
}

/**
 * Lazily creates a tree node that's associated with a specific layer, with the given options.
 * @param optionsFunc A function that returns the options object for this tree node.
 */
export function createLayerTreeNode<T extends LayerTreeNodeOptions>(optionsFunc: () => T) {
    const layerTreeNode = createTreeNode(() => {
        const options = optionsFunc();
        const { display, append, layerID, ...props } = options;

        return {
            ...(props as Omit<typeof props, keyof LayerTreeNodeOptions>),
            layerID,
            display: display ?? layerID,
            append: processGetter(append) ?? true,
            onClick() {
                if (unref<boolean>(layerTreeNode.append)) {
                    if (player.tabs.includes(layerID)) {
                        const index = player.tabs.lastIndexOf(layerID);
                        player.tabs.splice(index, 1);
                    } else {
                        player.tabs.push(layerID);
                    }
                } else {
                    player.tabs.splice(1, 1, layerID);
                }
            }
        };
    }) satisfies LayerTreeNode;

    return layerTreeNode;
}

/** An option object for a modifier display as a single section. **/
export interface Section {
    /** The header for this modifier. **/
    title: MaybeRefOrGetter<string>;
    /** A subtitle for this modifier, e.g. to explain the context for the modifier. **/
    subtitle?: MaybeRefOrGetter<string>;
    /** The modifier to be displaying in this section. **/
    modifier: WithRequired<Modifier, "description">;
    /** The base value being modified. **/
    base?: MaybeRefOrGetter<DecimalSource>;
    /** The unit of measurement for the base. **/
    unit?: string;
    /** The label to call the base amount. Defaults to "Base". **/
    baseText?: MaybeGetter<Renderable>;
    /** Whether or not this section should be currently visible to the player. **/
    visible?: MaybeRefOrGetter<boolean>;
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
): [() => Renderable, Persistent<Record<number, boolean>>] {
    const sections: Section[] = [];
    const processed:
        | {
              base: MaybeRef<DecimalSource | undefined>[];
              baseText: (MaybeGetter<Renderable> | undefined)[];
              visible: MaybeRef<boolean | undefined>[];
              title: MaybeRef<string | undefined>[];
              subtitle: MaybeRef<string | undefined>[];
          }
        | Record<string, never> = {};
    let calculated = false;
    function calculateSections() {
        if (!calculated) {
            sections.push(...sectionsFunc());
            processed.base = sections.map(s => processGetter(s.base));
            processed.baseText = sections.map(s => s.baseText);
            processed.visible = sections.map(s => processGetter(s.visible));
            processed.title = sections.map(s => processGetter(s.title));
            processed.subtitle = sections.map(s => processGetter(s.subtitle));
            calculated = true;
        }
        return sections;
    }

    const collapsed = persistent<Record<number, boolean>>({}, false);
    const jsxFunc = () => {
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
                            {render(unref(processed.baseText[i]) ?? "Base")}
                        </span>
                        <span class="modifier-amount">
                            {format(unref(processed.base[i]) ?? 1)}
                            {s.unit}
                        </span>
                    </div>
                    {s.modifier.description == null ? null : render(unref(s.modifier.description))}
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
    };
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
export function createCollapsibleAchievements(achievements: Record<string, Achievement>) {
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
    const display = computed(() => {
        const achievementsToDisplay = [...lockedAchievements.value];
        if (firstFeature.value) {
            achievementsToDisplay.push(firstFeature.value);
        }
        return renderCol(
            ...achievementsToDisplay,
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
    rate: MaybeRefOrGetter<DecimalSource>,
    target: MaybeRefOrGetter<DecimalSource>
) {
    const processedRate = processGetter(rate);
    const processedTarget = processGetter(target);
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
    showPreview: MaybeRefOrGetter<boolean>,
    previewAmount: MaybeRefOrGetter<DecimalSource> = 1
) {
    const processedShowPreview = processGetter(showPreview);
    const processedPreviewAmount = processGetter(previewAmount);
    if (!formula.hasVariable()) {
        console.error("Cannot create formula preview if the formula does not have a variable");
    }
    return computed(() => {
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

/**
 * Utility function for getting a computed boolean for whether or not a given feature is currently rendered in the DOM.
 * Note it will have a true value even if the feature is off screen.
 * @param layer The layer the feature appears within
 * @param id The ID of the feature
 */
export function isRendered(layer: BaseLayer, id: string): ComputedRef<boolean>;
/**
 * Utility function for getting a computed boolean for whether or not a given feature is currently rendered in the DOM.
 * Note it will have a true value even if the feature is off screen.
 * @param layer The layer the feature appears within
 * @param feature The feature that may be rendered
 */
export function isRendered(layer: BaseLayer, feature: { id: string }): ComputedRef<boolean>;
export function isRendered(layer: BaseLayer, idOrFeature: string | { id: string }) {
    const id = typeof idOrFeature === "string" ? idOrFeature : idOrFeature.id;
    return computed(() => id in layer.nodes.value);
}

/**
 * Utility function for setting up a system where one of many things can be selected.
 * It's recommended to use an ID or index rather than the object itself, so that you can wrap the ref in a persistent without breaking anything.
 * @returns The ref containing the selection, as well as a select and deselect function
 */
export function setupSelectable<T>() {
    const selected = ref<T>();
    return {
        select: function (node: T) {
            selected.value = node;
        },
        deselect: function () {
            selected.value = undefined;
        },
        selected
    };
}
