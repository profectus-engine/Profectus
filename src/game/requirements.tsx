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

/**
 * An object that can be used to describe a requirement to perform some purchase or other action.
 * @see {@link createCostRequirement}
 */
export interface Requirement {
    /** The display for this specific requirement. This is used for displays multiple requirements condensed. Required if {@link visibility} can be {@link Visibility.Visible}. */
    partialDisplay?: JSXFunction;
    /** The display for this specific requirement. Required if {@link visibility} can be {@link Visibility.Visible}. */
    display?: JSXFunction;
    visibility: ProcessedComputable<Visibility.Visible | Visibility.None>;
    requirementMet: ProcessedComputable<boolean>;
    requiresPay: ProcessedComputable<boolean>;
    pay?: VoidFunction;
}

export type Requirements = Requirement | Requirement[];

export interface CostRequirementOptions {
    resource: Resource;
    cost: Computable<DecimalSource>;
    visibility?: Computable<Visibility.Visible | Visibility.None>;
    requiresPay?: ProcessedComputable<boolean>;
    pay?: VoidFunction;
}

export function createCostRequirement<T extends CostRequirementOptions>(
    optionsFunc: () => T
): Requirement {
    return createLazyProxy(() => {
        const req = optionsFunc() as T & Partial<Requirement>;

        req.requirementMet = computed(() =>
            Decimal.gte(req.resource.value, unref(req.cost as ProcessedComputable<DecimalSource>))
        );

        req.partialDisplay = jsx(() => (
            <span
                style={
                    unref(req.requirementMet as ProcessedComputable<boolean>)
                        ? ""
                        : "color: var(--danger)"
                }
            >
                {displayResource(
                    req.resource,
                    unref(req.cost as ProcessedComputable<DecimalSource>)
                )}{" "}
                {req.resource.displayName}
            </span>
        ));
        req.display = jsx(() => (
            <div>
                {unref(req.requiresPay as ProcessedComputable<boolean>) ? "Costs: " : "Requires: "}
                {displayResource(
                    req.resource,
                    unref(req.cost as ProcessedComputable<DecimalSource>)
                )}{" "}
                {req.resource.displayName}
            </div>
        ));

        processComputable(req as T, "visibility");
        setDefault(req, "visibility", Visibility.Visible);
        processComputable(req as T, "cost");
        processComputable(req as T, "requiresPay");
        setDefault(req, "requiresPay", true);
        setDefault(req, "pay", function () {
            req.resource.value = Decimal.sub(
                req.resource.value,
                unref(req.cost as ProcessedComputable<DecimalSource>)
            ).max(0);
        });

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

export function requirementsMet(requirements: Requirements) {
    if (isArray(requirements)) {
        return requirements.every(r => unref(r.requirementMet));
    }
    return unref(requirements.requirementMet);
}

export function displayRequirements(requirements: Requirements) {
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
                            withCosts.map(r => r.partialDisplay!()),
                            <>, </>
                        )}
                    </div>
                ) : null}
                {withoutCosts.length > 0 ? (
                    <div>
                        Requires:{" "}
                        {joinJSX(
                            withoutCosts.map(r => r.partialDisplay!()),
                            <>, </>
                        )}
                    </div>
                ) : null}
            </>
        );
    }
    return requirements.display?.() ?? <></>;
}

export function payRequirements(requirements: Requirements) {
    if (isArray(requirements)) {
        requirements.filter(r => unref(r.requiresPay)).forEach(r => r.pay?.());
    } else if (unref(requirements.requiresPay)) {
        requirements.pay?.();
    }
}
