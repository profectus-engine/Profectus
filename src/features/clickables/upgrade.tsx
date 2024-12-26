import { findFeatures } from "features/feature";
import { Layer } from "game/layers";
import type { Persistent } from "game/persistence";
import { persistent } from "game/persistence";
import {
    Requirements,
    createVisibilityRequirement,
    displayRequirements,
    payRequirements,
    requirementsMet
} from "game/requirements";
import { isFunction } from "util/common";
import { MaybeGetter, processGetter } from "util/computed";
import { createLazyProxy } from "util/proxies";
import {
    Renderable,
    VueFeature,
    VueFeatureOptions,
    isJSXElement,
    render,
    vueFeatureMixin
} from "util/vue";
import type { MaybeRef, MaybeRefOrGetter, Ref } from "vue";
import { computed, unref } from "vue";
import Clickable from "./Clickable.vue";
import { ClickableOptions } from "./clickable";

/** A symbol used to identify {@link Upgrade} features. */
export const UpgradeType = Symbol("Upgrade");

/**
 * An object that configures a {@link Upgrade}.
 */
export interface UpgradeOptions extends VueFeatureOptions, ClickableOptions {
    /** The display to use for this upgrade. */
    display?:
        | MaybeGetter<Renderable>
        | {
              /** A header to appear at the top of the display. */
              title?: MaybeGetter<Renderable>;
              /** The main text that appears in the display. */
              description: MaybeGetter<Renderable>;
              /** A description of the current effect of the achievement. Useful when the effect changes dynamically. */
              effectDisplay?: MaybeGetter<Renderable>;
          };
    /** The requirements to purchase this upgrade. */
    requirements: Requirements;
    /** A function that is called when the upgrade is purchased. */
    onPurchase?: VoidFunction;
}

/** An object that represents a feature that can be purchased a single time. */
export interface Upgrade extends VueFeature {
    /** The requirements to purchase this upgrade. */
    requirements: Requirements;
    /** The display to use for this upgrade. */
    display?: MaybeGetter<Renderable>;
    /** Whether or not this upgrade has been purchased. */
    bought: Persistent<boolean>;
    /** Whether or not the upgrade can currently be purchased. */
    canPurchase: Ref<boolean>;
    /** A function that is called when the upgrade is purchased. */
    onPurchase?: VoidFunction;
    /** Purchase the upgrade */
    purchase: VoidFunction;
    /** A symbol that helps identify features of the same type. */
    type: typeof UpgradeType;
}

/**
 * Lazily creates an upgrade with the given options.
 * @param optionsFunc Upgrade options.
 */
export function createUpgrade<T extends UpgradeOptions>(optionsFunc: () => T) {
    const bought = persistent<boolean>(false, false);
    return createLazyProxy(() => {
        const options = optionsFunc();
        const { requirements: _requirements, display: _display, onHold, ...props } = options;

        if (options.classes == null) {
            options.classes = computed(() => ({ bought: unref(upgrade.bought) }));
        } else {
            const classes = processGetter(options.classes);
            options.classes = computed(() => ({
                ...unref(classes),
                bought: unref(upgrade.bought)
            }));
        }
        const vueFeature = vueFeatureMixin("upgrade", options, () => (
            <Clickable
                onClick={upgrade.purchase}
                onHold={upgrade.onHold}
                canClick={upgrade.canPurchase}
                display={upgrade.display}
            />
        ));
        const requirements = Array.isArray(_requirements) ? _requirements : [_requirements];
        if (vueFeature.visibility != null) {
            requirements.push(createVisibilityRequirement(vueFeature.visibility));
        }

        let display;
        if (typeof _display === "object" && !isJSXElement(_display)) {
            const { title, description, effectDisplay } = _display;

            display = () => (
                <span>
                    {title != null ? (
                        <div>
                            {render(title, el => (
                                <h3>{el}</h3>
                            ))}
                        </div>
                    ) : null}
                    {render(description, el => (
                        <div>{el}</div>
                    ))}
                    {effectDisplay != null ? <div>Currently: {render(effectDisplay)}</div> : null}
                    {bought.value ? null : (
                        <>
                            <br />
                            {displayRequirements(requirements)}
                        </>
                    )}
                </span>
            );
        } else if (_display != null) {
            display = _display;
        }

        const upgrade = {
            type: UpgradeType,
            ...(props as Omit<typeof props, keyof VueFeature | keyof UpgradeOptions>),
            ...vueFeature,
            bought,
            canPurchase: computed(() => !bought.value && requirementsMet(requirements)),
            requirements,
            display,
            onHold,
            purchase() {
                if (!unref(upgrade.canPurchase)) {
                    return;
                }
                payRequirements(requirements);
                bought.value = true;
                options.onPurchase?.();
            }
        } satisfies Upgrade;

        return upgrade;
    });
}

/**
 * Utility to auto purchase a list of upgrades whenever they're affordable.
 * @param layer The layer the upgrades are apart of
 * @param autoActive Whether or not the upgrades should currently be auto-purchasing
 * @param upgrades The specific upgrades to upgrade. If unspecified, uses all upgrades on the layer.
 */
export function setupAutoPurchase(
    layer: Layer,
    autoActive: MaybeRefOrGetter<boolean>,
    upgrades: Upgrade[] = []
): void {
    upgrades = upgrades.length === 0 ? (findFeatures(layer, UpgradeType) as Upgrade[]) : upgrades;
    const isAutoActive: MaybeRef<boolean> = isFunction(autoActive)
        ? computed(autoActive)
        : autoActive;
    layer.on("update", () => {
        if (unref(isAutoActive)) {
            upgrades.forEach(upgrade => upgrade.purchase());
        }
    });
}
