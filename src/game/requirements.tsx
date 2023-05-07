import { isArray } from "@vue/shared";
import {
    CoercableComponent,
    isVisible,
    jsx,
    OptionsFunc,
    Replace,
    setDefault,
    Visibility
} from "features/feature";
import { displayResource, Resource } from "features/resources/resource";
import Decimal, { DecimalSource } from "lib/break_eternity";
import {
    Computable,
    convertComputable,
    processComputable,
    ProcessedComputable
} from "util/computed";
import { createLazyProxy } from "util/proxies";
import { joinJSX, renderJSX } from "util/vue";
import { computed, unref } from "vue";
import Formula, { calculateCost, calculateMaxAffordable } from "./formulas/formulas";
import type { GenericFormula } from "./formulas/types";
import { DefaultValue, Persistent } from "./persistence";

/**
 * An object that can be used to describe a requirement to perform some purchase or other action.
 * @see {@link createCostRequirement}
 */
export interface Requirement {
    /**
     * The display for this specific requirement. This is used for displays multiple requirements condensed. Required if {@link visibility} can be {@link Visibility.Visible}.
     */
    partialDisplay?: (amount?: DecimalSource) => JSX.Element;
    /**
     * The display for this specific requirement. Required if {@link visibility} can be {@link Visibility.Visible}.
     */
    display?: (amount?: DecimalSource) => JSX.Element;
    /**
     * Whether or not this requirement should be displayed in Vue Features. {@link displayRequirements} will respect this property.
     */
    visibility: ProcessedComputable<Visibility.Visible | Visibility.None | boolean>;
    /**
     * Whether or not this requirement has been met.
     */
    requirementMet: ProcessedComputable<DecimalSource | boolean>;
    /**
     * Whether or not this requirement will need to affect the game state when whatever is using this requirement gets triggered.
     */
    requiresPay: ProcessedComputable<boolean>;
    /**
     * Whether or not this requirement can have multiple levels of requirements that can be met at once. Requirement is assumed to not have multiple levels if this property not present.
     */
    canMaximize?: ProcessedComputable<boolean>;
    /**
     * Perform any effects to the game state that should happen when the requirement gets triggered.
     * @param amount The amount of levels of requirements to pay for.
     */
    pay?: (amount?: DecimalSource) => void;
}

/**
 * Utility type for accepting 1 or more {@link Requirement}s.
 */
export type Requirements = Requirement | Requirement[];

/** An object that configures a {@link Requirement} based on a resource cost. */
export interface CostRequirementOptions {
    /**
     * The resource that will be checked for meeting the {@link cost}.
     */
    resource: Resource;
    /**
     * The amount of {@link resource} that must be met for this requirement. You can pass a formula, in which case maximizing will work out of the box (assuming its invertible and, for more accurate calculations, its integral is invertible). If you don't pass a formula then you can still support maximizing by passing a custom {@link pay} function.
     */
    cost: Computable<DecimalSource> | GenericFormula;
    /**
     * Pass-through to {@link Requirement.visibility}.
     */
    visibility?: Computable<Visibility.Visible | Visibility.None | boolean>;
    /**
     * Pass-through to {@link Requirement.requiresPay}. If not set to false, the default {@link pay} function will remove {@link cost} from {@link resource}.
     */
    requiresPay?: Computable<boolean>;
    /**
     * When calculating multiple levels to be handled at once, whether it should consider resources used for each level as spent. Setting this to false causes calculations to be faster with larger numbers and supports more math functions.
     * @see {Formula}
     */
    cumulativeCost?: Computable<boolean>;
    /**
     * Upper limit on levels that can be performed at once. Defaults to 1.
     */
    maxBulkAmount?: Computable<DecimalSource>;
    /**
     * When calculating requirement for multiple levels, how many should be directly summed for increase accuracy. High numbers can cause lag. Defaults to 10 if cumulative cost, 0 otherwise.
     */
    directSum?: Computable<number>;
    /**
     * Pass-through to {@link Requirement.pay}. May be required for maximizing support.
     * @see {@link cost} for restrictions on maximizing support.
     */
    pay?: (amount?: DecimalSource) => void;
}

export type CostRequirement = Replace<
    Requirement & CostRequirementOptions,
    {
        cost: ProcessedComputable<DecimalSource> | GenericFormula;
        visibility: ProcessedComputable<Visibility.Visible | Visibility.None | boolean>;
        requiresPay: ProcessedComputable<boolean>;
        cumulativeCost: ProcessedComputable<boolean>;
        canMaximize: ProcessedComputable<boolean>;
    }
>;

/**
 * Lazily creates a requirement with the given options, that is based on meeting an amount of a resource.
 * @param optionsFunc Cost requirement options.
 */
export function createCostRequirement<T extends CostRequirementOptions>(
    optionsFunc: OptionsFunc<T>
): CostRequirement {
    return createLazyProxy(feature => {
        const req = optionsFunc.call(feature, feature) as T & Partial<Requirement>;

        req.partialDisplay = amount => (
            <span
                style={
                    unref(req.requirementMet as ProcessedComputable<boolean>)
                        ? ""
                        : "color: var(--danger)"
                }
            >
                {displayResource(
                    req.resource,
                    req.cost instanceof Formula
                        ? calculateCost(
                              req.cost,
                              amount ?? 1,
                              unref(req.cumulativeCost) as boolean,
                              unref(req.directSum) as number
                          )
                        : unref(req.cost as ProcessedComputable<DecimalSource>)
                )}{" "}
                {req.resource.displayName}
            </span>
        );
        req.display = amount => (
            <div>
                {unref(req.requiresPay as ProcessedComputable<boolean>) ? "Costs: " : "Requires: "}
                {displayResource(
                    req.resource,
                    req.cost instanceof Formula
                        ? calculateCost(
                              req.cost,
                              amount ?? 1,
                              unref(req.cumulativeCost) as boolean,
                              unref(req.directSum) as number
                          )
                        : unref(req.cost as ProcessedComputable<DecimalSource>)
                )}{" "}
                {req.resource.displayName}
            </div>
        );

        processComputable(req as T, "visibility");
        setDefault(req, "visibility", Visibility.Visible);
        processComputable(req as T, "cost");
        processComputable(req as T, "requiresPay");
        setDefault(req, "requiresPay", true);
        processComputable(req as T, "cumulativeCost");
        setDefault(req, "cumulativeCost", true);
        processComputable(req as T, "maxBulkAmount");
        setDefault(req, "maxBulkAmount", 1);
        processComputable(req as T, "directSum");
        setDefault(req, "pay", function (amount?: DecimalSource) {
            const cost =
                req.cost instanceof Formula
                    ? calculateCost(
                          req.cost,
                          amount ?? 1,
                          unref(req.cumulativeCost) as boolean,
                          unref(req.directSum) as number
                      )
                    : unref(req.cost as ProcessedComputable<DecimalSource>);
            req.resource.value = Decimal.sub(req.resource.value, cost).max(0);
        });

        req.canMaximize = computed(() => {
            if (!(req.cost instanceof Formula)) {
                return false;
            }
            const maxBulkAmount = unref(req.maxBulkAmount as ProcessedComputable<DecimalSource>);
            if (Decimal.lte(maxBulkAmount, 1)) {
                return false;
            }
            const cumulativeCost = unref(req.cumulativeCost as ProcessedComputable<boolean>);
            const directSum =
                unref(req.directSum as ProcessedComputable<number>) ?? (cumulativeCost ? 10 : 0);
            if (Decimal.lte(maxBulkAmount, directSum)) {
                return true;
            }
            if (!req.cost.isInvertible()) {
                return false;
            }
            if (cumulativeCost === true && !req.cost.isIntegrable()) {
                return false;
            }
            return true;
        });

        if (req.cost instanceof Formula) {
            req.requirementMet = calculateMaxAffordable(
                req.cost,
                req.resource,
                req.cumulativeCost ?? true,
                req.directSum,
                req.maxBulkAmount
            );
        } else {
            req.requirementMet = computed(() =>
                Decimal.gte(
                    req.resource.value,
                    unref(req.cost as ProcessedComputable<DecimalSource>)
                )
            );
        }

        return req as CostRequirement;
    });
}

/**
 * Utility function for creating a requirement that a specified vue feature is visible
 * @param feature The feature to check the visibility of
 */
export function createVisibilityRequirement(feature: {
    visibility: ProcessedComputable<Visibility | boolean>;
}): Requirement {
    return createLazyProxy(() => ({
        requirementMet: computed(() => isVisible(feature.visibility)),
        visibility: Visibility.None,
        requiresPay: false
    }));
}

/**
 * Creates a requirement based on a true/false value
 * @param requirement The boolean requirement to use
 * @param display How to display this requirement to the user
 */
export function createBooleanRequirement(
    requirement: Computable<boolean>,
    display?: CoercableComponent
): Requirement {
    return createLazyProxy(() => ({
        requirementMet: convertComputable(requirement),
        partialDisplay: display == null ? undefined : jsx(() => renderJSX(display)),
        display: display == null ? undefined : jsx(() => <>Req: {renderJSX(display)}</>),
        visibility: display == null ? Visibility.None : Visibility.Visible,
        requiresPay: false
    }));
}

/**
 * Utility for checking if 1+ requirements are all met
 * @param requirements The 1+ requirements to check
 */
export function requirementsMet(requirements: Requirements): boolean {
    if (isArray(requirements)) {
        return requirements.every(requirementsMet);
    }
    const reqsMet = unref(requirements.requirementMet);
    return typeof reqsMet === "boolean" ? reqsMet : Decimal.gt(reqsMet, 0);
}

/**
 * Calculates the maximum number of levels that could be acquired with the current requirement states. True/false requirements will be counted as Infinity or 0.
 * @param requirements The 1+ requirements to check
 */
export function maxRequirementsMet(requirements: Requirements): DecimalSource {
    if (isArray(requirements)) {
        return requirements.map(maxRequirementsMet).reduce(Decimal.min);
    }
    const reqsMet = unref(requirements.requirementMet);
    if (typeof reqsMet === "boolean") {
        return reqsMet ? Decimal.dInf : 0;
    } else if (Decimal.gt(reqsMet, 1) && unref(requirements.canMaximize) !== true) {
        return 1;
    }
    return reqsMet;
}

/**
 * Utility function for display 1+ requirements compactly.
 * @param requirements The 1+ requirements to display
 * @param amount The amount of levels earned to be displayed
 */
export function displayRequirements(requirements: Requirements, amount: DecimalSource = 1) {
    if (isArray(requirements)) {
        requirements = requirements.filter(r => isVisible(r.visibility));
        if (requirements.length === 1) {
            requirements = requirements[0];
        }
    }
    if (isArray(requirements)) {
        requirements = requirements.filter(r => "partialDisplay" in r);
        const withCosts = requirements.filter(r => unref(r.requiresPay));
        const withoutCosts = requirements.filter(r => !unref(r.requiresPay));
        return (
            <>
                {withCosts.length > 0 ? (
                    <div>
                        Costs:{" "}
                        {joinJSX(
                            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                            withCosts.map(r => r.partialDisplay!(amount)),
                            <>, </>
                        )}
                    </div>
                ) : null}
                {withoutCosts.length > 0 ? (
                    <div>
                        Requires:{" "}
                        {joinJSX(
                            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                            withoutCosts.map(r => r.partialDisplay!(amount)),
                            <>, </>
                        )}
                    </div>
                ) : null}
            </>
        );
    }
    return requirements.display?.() ?? <></>;
}

/**
 * Utility function for paying the costs for 1+ requirements
 * @param requirements The 1+ requirements to pay
 * @param amount How many levels to pay for
 */
export function payRequirements(requirements: Requirements, amount: DecimalSource = 1) {
    if (isArray(requirements)) {
        requirements.filter(r => unref(r.requiresPay)).forEach(r => r.pay?.(amount));
    } else if (unref(requirements.requiresPay)) {
        requirements.pay?.(amount);
    }
}

export function payByDivision(this: CostRequirement, amount?: DecimalSource) {
    const cost =
        this.cost instanceof Formula
            ? calculateCost(
                  this.cost,
                  amount ?? 1,
                  unref(this.cumulativeCost as ProcessedComputable<boolean> | undefined) ?? true
              )
            : unref(this.cost as ProcessedComputable<DecimalSource>);
    this.resource.value = Decimal.div(this.resource.value, cost);
}

export function payByReset(overrideDefaultValue?: DecimalSource) {
    return function (this: CostRequirement) {
        this.resource.value =
            overrideDefaultValue ??
            (this.resource as Resource & Persistent<DecimalSource>)[DefaultValue] ??
            0;
    };
}
