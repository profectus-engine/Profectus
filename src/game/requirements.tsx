import { isArray } from "@vue/shared";
import { CoercableComponent, jsx, JSXFunction, setDefault, Visibility } from "features/feature";
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
import Formula, { calculateCost, calculateMaxAffordable, GenericFormula } from "./formulas";

/**
 * An object that can be used to describe a requirement to perform some purchase or other action.
 * @see {@link createCostRequirement}
 */
export interface Requirement {
    /** The display for this specific requirement. This is used for displays multiple requirements condensed. Required if {@link visibility} can be {@link Visibility.Visible}. */
    partialDisplay?: (amount?: DecimalSource) => JSX.Element;
    /** The display for this specific requirement. Required if {@link visibility} can be {@link Visibility.Visible}. */
    display?: (amount?: DecimalSource) => JSX.Element;
    visibility: ProcessedComputable<Visibility.Visible | Visibility.None>;
    requirementMet: ProcessedComputable<DecimalSource | boolean>;
    requiresPay: ProcessedComputable<boolean>;
    buyMax?: ProcessedComputable<boolean>;
    pay?: (amount?: DecimalSource) => void;
}

export type Requirements = Requirement | Requirement[];

export interface CostRequirementOptions {
    resource: Resource;
    cost: Computable<DecimalSource> | GenericFormula;
    visibility?: Computable<Visibility.Visible | Visibility.None>;
    requiresPay?: Computable<boolean>;
    buyMax?: Computable<boolean>;
    spendResources?: Computable<boolean>;
    pay?: (amount?: DecimalSource) => void;
}

export function createCostRequirement<T extends CostRequirementOptions>(optionsFunc: () => T) {
    return createLazyProxy(() => {
        const req = optionsFunc() as T & Partial<Requirement>;

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
                              unref(
                                  req.spendResources as ProcessedComputable<boolean> | undefined
                              ) ?? true
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
                              unref(
                                  req.spendResources as ProcessedComputable<boolean> | undefined
                              ) ?? true
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
        processComputable(req as T, "spendResources");
        setDefault(req, "requiresPay", true);
        setDefault(req, "pay", function (amount?: DecimalSource) {
            const cost =
                req.cost instanceof Formula
                    ? calculateCost(
                          req.cost,
                          amount ?? 1,
                          unref(req.spendResources as ProcessedComputable<boolean> | undefined) ??
                              true
                      )
                    : unref(req.cost as ProcessedComputable<DecimalSource>);
            req.resource.value = Decimal.sub(req.resource.value, cost).max(0);
        });
        processComputable(req as T, "buyMax");

        if (
            "buyMax" in req &&
            req.buyMax !== false &&
            req.cost instanceof Formula &&
            req.cost.isInvertible()
        ) {
            req.requirementMet = calculateMaxAffordable(
                req.cost,
                req.resource,
                unref(req.spendResources as ProcessedComputable<boolean> | undefined) ?? true
            );
        } else {
            req.requirementMet = computed(() => {
                if (req.cost instanceof Formula) {
                    return Decimal.gte(req.resource.value, req.cost.evaluate());
                } else {
                    return Decimal.gte(
                        req.resource.value,
                        unref(req.cost as ProcessedComputable<DecimalSource>)
                    );
                }
            });
        }

        return req as Requirement;
    });
}

export function createVisibilityRequirement(feature: {
    visibility: ProcessedComputable<Visibility>;
}): Requirement {
    return createLazyProxy(() => ({
        requirementMet: computed(() => unref(feature.visibility) === Visibility.Visible),
        visibility: Visibility.None,
        requiresPay: false
    }));
}

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

export function requirementsMet(requirements: Requirements): boolean {
    if (isArray(requirements)) {
        return requirements.every(requirementsMet);
    }
    const reqsMet = unref(requirements.requirementMet);
    return typeof reqsMet === "boolean" ? reqsMet : Decimal.gt(reqsMet, 0);
}

export function maxRequirementsMet(requirements: Requirements): DecimalSource {
    if (isArray(requirements)) {
        return requirements.map(maxRequirementsMet).reduce(Decimal.min);
    }
    const reqsMet = unref(requirements.requirementMet);
    if (typeof reqsMet === "boolean") {
        return reqsMet ? Infinity : 0;
    }
    return reqsMet;
}

export function displayRequirements(requirements: Requirements, amount: DecimalSource = 1) {
    if (isArray(requirements)) {
        requirements = requirements.filter(r => unref(r.visibility) === Visibility.Visible);
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
                            withCosts.map(r => r.partialDisplay!(amount)),
                            <>, </>
                        )}
                    </div>
                ) : null}
                {withoutCosts.length > 0 ? (
                    <div>
                        Requires:{" "}
                        {joinJSX(
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

export function payRequirements(requirements: Requirements, buyMax = false) {
    const amount = buyMax ? maxRequirementsMet(requirements) : 1;
    if (isArray(requirements)) {
        requirements.filter(r => unref(r.requiresPay)).forEach(r => r.pay?.(amount));
    } else if (unref(requirements.requiresPay)) {
        requirements.pay?.(amount);
    }
}
