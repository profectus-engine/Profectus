import { GenericDecorator } from "features/decorators/common";
import type {
    CoercableComponent,
    GenericComponent,
    OptionsFunc,
    Replace,
    StyleValue
} from "features/feature";
import {
    Component,
    GatherProps,
    Visibility,
    findFeatures,
    getUniqueID,
    setDefault
} from "features/feature";
import UpgradeComponent from "features/upgrades/Upgrade.vue";
import type { GenericLayer } from "game/layers";
import type { Persistent } from "game/persistence";
import { persistent } from "game/persistence";
import {
    Requirements,
    createVisibilityRequirement,
    payRequirements,
    requirementsMet
} from "game/requirements";
import { isFunction } from "util/common";
import type {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    ProcessedComputable
} from "util/computed";
import { processComputable } from "util/computed";
import { createLazyProxy } from "util/proxies";
import type { Ref } from "vue";
import { computed, unref } from "vue";

/** A symbol used to identify {@link Upgrade} features. */
export const UpgradeType = Symbol("Upgrade");

/**
 * An object that configures a {@link Upgrade}.
 */
export interface UpgradeOptions {
    /** Whether this clickable should be visible. */
    visibility?: Computable<Visibility | boolean>;
    /** Dictionary of CSS classes to apply to this feature. */
    classes?: Computable<Record<string, boolean>>;
    /** CSS to apply to this feature. */
    style?: Computable<StyleValue>;
    /** Shows a marker on the corner of the feature. */
    mark?: Computable<boolean | string>;
    /** The display to use for this clickable. */
    display?: Computable<
        | CoercableComponent
        | {
              /** A header to appear at the top of the display. */
              title?: CoercableComponent;
              /** The main text that appears in the display. */
              description: CoercableComponent;
              /** A description of the current effect of the achievement. Useful when the effect changes dynamically. */
              effectDisplay?: CoercableComponent;
          }
    >;
    /** The requirements to purchase this upgrade. */
    requirements: Requirements;
    /** A function that is called when the upgrade is purchased. */
    onPurchase?: VoidFunction;
}

/**
 * The properties that are added onto a processed {@link UpgradeOptions} to create an {@link Upgrade}.
 */
export interface BaseUpgrade {
    /** An auto-generated ID for identifying features that appear in the DOM. Will not persist between refreshes or updates. */
    id: string;
    /** Whether or not this upgrade has been purchased. */
    bought: Persistent<boolean>;
    /** Whether or not the upgrade can currently be purchased. */
    canPurchase: Ref<boolean>;
    /** Purchase the upgrade */
    purchase: VoidFunction;
    /** A symbol that helps identify features of the same type. */
    type: typeof UpgradeType;
    /** The Vue component used to render this feature. */
    [Component]: GenericComponent;
    /** A function to gather the props the vue component requires for this feature. */
    [GatherProps]: () => Record<string, unknown>;
}

/** An object that represents a feature that can be purchased a single time. */
export type Upgrade<T extends UpgradeOptions> = Replace<
    T & BaseUpgrade,
    {
        visibility: GetComputableTypeWithDefault<T["visibility"], Visibility.Visible>;
        classes: GetComputableType<T["classes"]>;
        style: GetComputableType<T["style"]>;
        display: GetComputableType<T["display"]>;
        requirements: GetComputableType<T["requirements"]>;
        mark: GetComputableType<T["mark"]>;
    }
>;

/** A type that matches any valid {@link Upgrade} object. */
export type GenericUpgrade = Replace<
    Upgrade<UpgradeOptions>,
    {
        visibility: ProcessedComputable<Visibility | boolean>;
    }
>;

/**
 * Lazily creates an upgrade with the given options.
 * @param optionsFunc Upgrade options.
 */
export function createUpgrade<T extends UpgradeOptions>(
    optionsFunc: OptionsFunc<T, BaseUpgrade, GenericUpgrade>,
    ...decorators: GenericDecorator[]
): Upgrade<T> {
    const bought = persistent<boolean>(false, false);
    const decoratedData = decorators.reduce(
        (current, next) => Object.assign(current, next.getPersistentData?.()),
        {}
    );
    return createLazyProxy(feature => {
        const upgrade = optionsFunc.call(feature, feature);
        upgrade.id = getUniqueID("upgrade-");
        upgrade.type = UpgradeType;
        upgrade[Component] = UpgradeComponent as GenericComponent;

        for (const decorator of decorators) {
            decorator.preConstruct?.(upgrade);
        }

        upgrade.bought = bought;
        Object.assign(upgrade, decoratedData);

        upgrade.canPurchase = computed(
            () => !bought.value && requirementsMet(upgrade.requirements)
        );
        upgrade.purchase = function () {
            const genericUpgrade = upgrade as GenericUpgrade;
            if (!unref(genericUpgrade.canPurchase)) {
                return;
            }
            payRequirements(upgrade.requirements);
            bought.value = true;
            genericUpgrade.onPurchase?.();
        };

        const visibilityRequirement = createVisibilityRequirement(upgrade as GenericUpgrade);
        if (Array.isArray(upgrade.requirements)) {
            upgrade.requirements.unshift(visibilityRequirement);
        } else {
            upgrade.requirements = [visibilityRequirement, upgrade.requirements];
        }

        processComputable(upgrade as T, "visibility");
        setDefault(upgrade, "visibility", Visibility.Visible);
        processComputable(upgrade as T, "classes");
        processComputable(upgrade as T, "style");
        processComputable(upgrade as T, "display");
        processComputable(upgrade as T, "mark");

        for (const decorator of decorators) {
            decorator.postConstruct?.(upgrade);
        }

        const decoratedProps = decorators.reduce(
            (current, next) => Object.assign(current, next.getGatheredProps?.(upgrade)),
            {}
        );
        upgrade[GatherProps] = function (this: GenericUpgrade) {
            const {
                display,
                visibility,
                style,
                classes,
                requirements,
                canPurchase,
                bought,
                mark,
                id,
                purchase
            } = this;
            return {
                display,
                visibility,
                style: unref(style),
                classes,
                requirements,
                canPurchase,
                bought,
                mark,
                id,
                purchase,
                ...decoratedProps
            };
        };

        return upgrade as unknown as Upgrade<T>;
    });
}

/**
 * Utility to auto purchase a list of upgrades whenever they're affordable.
 * @param layer The layer the upgrades are apart of
 * @param autoActive Whether or not the upgrades should currently be auto-purchasing
 * @param upgrades The specific upgrades to upgrade. If unspecified, uses all upgrades on the layer.
 */
export function setupAutoPurchase(
    layer: GenericLayer,
    autoActive: Computable<boolean>,
    upgrades: GenericUpgrade[] = []
): void {
    upgrades =
        upgrades.length === 0 ? (findFeatures(layer, UpgradeType) as GenericUpgrade[]) : upgrades;
    const isAutoActive: ProcessedComputable<boolean> = isFunction(autoActive)
        ? computed(autoActive)
        : autoActive;
    layer.on("update", () => {
        if (unref(isAutoActive)) {
            upgrades.forEach(upgrade => upgrade.purchase());
        }
    });
}
