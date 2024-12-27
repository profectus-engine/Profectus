import { isVisible, Visibility } from "features/feature";
import { displayResource, Resource } from "features/resources/resource";
import Decimal, { DecimalSource } from "util/bignum";
import { MaybeGetter, processGetter } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { joinJSX, Renderable } from "util/vue";
import { computed, MaybeRef, MaybeRefOrGetter, unref } from "vue";
import Formula, { calculateCost, calculateMaxAffordable } from "./formulas/formulas";
import type { GenericFormula, InvertibleIntegralFormula } from "./formulas/types";
import { DefaultValue, Persistent } from "./persistence";

/**
 * An object that can be used to describe a requirement to perform some purchase or other action.
 * @see {@link createCostRequirement}
 */
export interface Requirement {
    /**
     * The display for this specific requirement. This is used for displays multiple requirements condensed. Required if {@link visibility} can be {@link Visibility.Visible}.
     */
    partialDisplay?: (amount?: DecimalSource) => Renderable;
    /**
     * The display for this specific requirement. Required if {@link visibility} can be {@link Visibility.Visible}.
     */
    display?: (amount?: DecimalSource) => Renderable;
    /**
     * Whether or not this requirement should be displayed in Vue Features. {@link displayRequirements} will respect this property.
     */
    visibility: MaybeRef<Visibility | boolean>;
    /**
     * Whether or not this requirement has been met.
     */
    requirementMet: MaybeRef<DecimalSource | boolean>;
    /**
     * Whether or not this requirement will need to affect the game state when whatever is using this requirement gets triggered.
     */
    requiresPay: MaybeRef<boolean>;
    /**
     * Whether or not this requirement can have multiple levels of requirements that can be met at once. Requirement is assumed to not have multiple levels if this property not present.
     */
    canMaximize?: MaybeRef<boolean>;
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
    cost: MaybeRefOrGetter<DecimalSource> | GenericFormula;
    /**
     * Pass-through to {@link Requirement.visibility}.
     */
    visibility?: MaybeRefOrGetter<Visibility.Visible | Visibility.None | boolean>;
    /**
     * Pass-through to {@link Requirement["requiresPay"]}. If not set to false, the default {@link pay} function will remove {@link cost} from {@link resource}.
     */
    requiresPay?: MaybeRefOrGetter<boolean>;
    /**
     * When calculating multiple levels to be handled at once, whether it should consider resources used for each level as spent. Setting this to false causes calculations to be faster with larger numbers and supports more math functions.
     * @see {Formula}
     */
    cumulativeCost?: MaybeRefOrGetter<boolean>;
    /**
     * Upper limit on levels that can be performed at once. Defaults to 1.
     */
    maxBulkAmount?: MaybeRefOrGetter<DecimalSource>;
    /**
     * When calculating requirement for multiple levels, how many should be directly summed for increase accuracy. High numbers can cause lag. Defaults to 10 if cumulative cost, 0 otherwise.
     */
    directSum?: MaybeRefOrGetter<number>;
    /**
     * Pass-through to {@link Requirement.pay}. May be required for maximizing support.
     * @see {@link cost} for restrictions on maximizing support.
     */
    pay?: (amount?: DecimalSource) => void;
}

export interface CostRequirement extends Requirement {
    /**
     * The resource that will be checked for meeting the {@link cost}.
     */
    resource: Resource;
    /**
     * The amount of {@link resource} that must be met for this requirement. You can pass a formula, in which case maximizing will work out of the box (assuming its invertible and, for more accurate calculations, its integral is invertible). If you don't pass a formula then you can still support maximizing by passing a custom {@link pay} function.
     */
    cost: MaybeRef<DecimalSource> | GenericFormula;
    /**
     * When calculating multiple levels to be handled at once, whether it should consider resources used for each level as spent. Setting this to false causes calculations to be faster with larger numbers and supports more math functions.
     * @see {Formula}
     */
    cumulativeCost: MaybeRef<boolean>;
    /**
     * Upper limit on levels that can be performed at once. Defaults to 1.
     */
    maxBulkAmount?: MaybeRef<DecimalSource>;
    /**
     * When calculating requirement for multiple levels, how many should be directly summed for increase accuracy. High numbers can cause lag. Defaults to 10 if cumulative cost, 0 otherwise.
     */
    directSum?: MaybeRef<number>;
    /**
     * Pass-through to {@link Requirement.pay}. May be required for maximizing support.
     * @see {@link cost} for restrictions on maximizing support.
     */
    pay?: (amount?: DecimalSource) => void;
}

/**
 * Lazily creates a requirement with the given options, that is based on meeting an amount of a resource.
 * @param optionsFunc Cost requirement options.
 */
export function createCostRequirement<T extends CostRequirementOptions>(optionsFunc: () => T) {
    return createLazyProxy(feature => {
        const options = optionsFunc.call(feature);
        const {
            visibility,
            cost,
            resource,
            requiresPay,
            cumulativeCost,
            maxBulkAmount,
            directSum,
            pay
        } = options;

        const requirement = {
            resource,
            visibility: processGetter(visibility) ?? Visibility.Visible,
            cost: processGetter(cost),
            requiresPay: processGetter(requiresPay) ?? true,
            cumulativeCost: processGetter(cumulativeCost) ?? true,
            maxBulkAmount: processGetter(maxBulkAmount) ?? 1,
            directSum: processGetter(directSum),
            partialDisplay: (amount?: DecimalSource) => (
                <span
                    style={
                        Decimal.gt(unref(requirement.requirementMet), 0)
                            ? ""
                            : "color: var(--danger)"
                    }
                >
                    {displayResource(
                        resource,
                        requirement.cost instanceof Formula
                            ? calculateCost(
                                  requirement.cost as InvertibleIntegralFormula,
                                  amount ?? 1,
                                  unref(requirement.cumulativeCost),
                                  unref(requirement.directSum)
                              )
                            : unref(requirement.cost as MaybeRef<DecimalSource>)
                    )}{" "}
                    {resource.displayName}
                </span>
            ),
            display: (amount?: DecimalSource) => (
                <div>
                    {unref(requirement.requiresPay as MaybeRef<boolean>) ? "Costs: " : "Requires: "}
                    {displayResource(
                        resource,
                        requirement.cost instanceof Formula
                            ? calculateCost(
                                  requirement.cost as InvertibleIntegralFormula,
                                  amount ?? 1,
                                  unref(requirement.cumulativeCost),
                                  unref(requirement.directSum)
                              )
                            : unref(requirement.cost as MaybeRef<DecimalSource>)
                    )}{" "}
                    {resource.displayName}
                </div>
            ),
            canMaximize: computed(() => {
                if (!(requirement.cost instanceof Formula)) {
                    return false;
                }
                const maxBulkAmount = unref(requirement.maxBulkAmount);
                if (Decimal.lte(maxBulkAmount, 1)) {
                    return false;
                }
                const cumulativeCost = unref(requirement.cumulativeCost);
                const directSum = unref(requirement.directSum) ?? (cumulativeCost ? 10 : 0);
                if (Decimal.lte(maxBulkAmount, directSum)) {
                    return true;
                }
                if (!requirement.cost.isInvertible()) {
                    return false;
                }
                if (cumulativeCost === true && !requirement.cost.isIntegrable()) {
                    return false;
                }
                return true;
            }),
            requirementMet:
                cost instanceof Formula
                    ? calculateMaxAffordable(
                          cost,
                          resource,
                          cumulativeCost ?? true,
                          directSum,
                          maxBulkAmount
                      )
                    : computed(
                          (): DecimalSource =>
                              Decimal.gte(
                                  resource.value,
                                  unref(requirement.cost as MaybeRef<DecimalSource>)
                              )
                                  ? 1
                                  : 0
                      ),
            pay:
                pay ??
                function (amount?: DecimalSource) {
                    const cost =
                        requirement.cost instanceof Formula
                            ? calculateCost(
                                  requirement.cost,
                                  amount ?? 1,
                                  unref(requirement.cumulativeCost),
                                  unref(requirement.directSum)
                              )
                            : unref(requirement.cost as MaybeRef<DecimalSource>);
                    resource.value = Decimal.sub(resource.value, cost).max(0);
                }
        } satisfies CostRequirement;

        return requirement;
    });
}

/**
 * Utility function for creating a requirement that a specified vue feature is visible
 * @param visibility The visibility ref to check
 */
export function createVisibilityRequirement(
    visibility: MaybeRef<Visibility | boolean>
): Requirement {
    return createLazyProxy(() => ({
        requirementMet: computed(() => isVisible(visibility)),
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
    requirement: MaybeRefOrGetter<boolean>,
    display?: MaybeGetter<Renderable>
): Requirement {
    return createLazyProxy(() => {
        const partialDisplay =
            display == null ? undefined : typeof display === "function" ? display : () => display;
        return {
            requirementMet: processGetter(requirement),
            partialDisplay,
            display: display == null ? undefined : () => <>Req: {partialDisplay}</>,
            visibility: display == null ? Visibility.None : Visibility.Visible,
            requiresPay: false
        };
    });
}

/**
 * Utility for checking if 1+ requirements are all met
 * @param requirements The 1+ requirements to check
 */
export function requirementsMet(requirements: Requirements): boolean {
    if (Array.isArray(requirements)) {
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
    if (Array.isArray(requirements)) {
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
    if (Array.isArray(requirements)) {
        requirements = requirements.filter(r => isVisible(r.visibility ?? true));
        if (requirements.length === 1) {
            requirements = requirements[0];
        }
    }
    if (Array.isArray(requirements)) {
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
    if (Array.isArray(requirements)) {
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
                  unref(this.cumulativeCost as MaybeRef<boolean> | undefined) ?? true
              )
            : unref(this.cost as MaybeRef<DecimalSource>);
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
