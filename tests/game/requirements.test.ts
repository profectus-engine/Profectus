import { Visibility } from "features/feature";
import { createResource, Resource } from "features/resources/resource";
import Formula from "game/formulas/formulas";
import {
    CostRequirement,
    createBooleanRequirement,
    createCostRequirement,
    createVisibilityRequirement,
    maxRequirementsMet,
    payRequirements,
    Requirement,
    requirementsMet
} from "game/requirements";
import Decimal from "util/bignum";
import { beforeAll, describe, expect, test } from "vitest";
import { isRef, ref, unref } from "vue";
import "../utils";

describe("Creating cost requirement", () => {
    let resource: Resource;
    beforeAll(() => {
        resource = createResource(ref(10));
    });

    describe("Minimal requirement", () => {
        let requirement: CostRequirement;
        beforeAll(() => {
            requirement = createCostRequirement(() => ({
                resource,
                cost: 10
            }));
        });

        test("resource pass-through", () => expect(requirement.resource).toBe(resource));
        test("cost pass-through", () => expect(requirement.cost).toBe(10));

        test("partialDisplay exists", () =>
            expect(typeof requirement.partialDisplay).toBe("function"));
        test("display exists", () => expect(typeof requirement.display).toBe("function"));
        test("pay exists", () => expect(typeof requirement.pay).toBe("function"));
        test("requirementMet exists", () => {
            expect(requirement.requirementMet).not.toBeNull();
            expect(isRef(requirement.requirementMet)).toBe(true);
        });
        test("is visible", () => expect(requirement.visibility).toBe(Visibility.Visible));
        test("requires pay", () => expect(requirement.requiresPay).toBe(true));
        test("does not spend resources", () => expect(requirement.cumulativeCost).toBe(true));
        test("cannot maximize", () => expect(unref(requirement.canMaximize)).toBe(false));
    });

    describe("Fully customized", () => {
        let requirement: CostRequirement;
        beforeAll(() => {
            requirement = createCostRequirement(() => ({
                resource,
                cost: Formula.variable(resource).times(10),
                visibility: Visibility.None,
                requiresPay: false,
                cumulativeCost: false,
                maxBulkAmount: Decimal.dInf,
                directSum: 5,
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                pay() {}
            }));
        });

        test("pay is empty function", () =>
            requirement.pay != null &&
            typeof requirement.pay === "function" &&
            requirement.pay.length === 1);
        test("is not visible", () => expect(requirement.visibility).toBe(Visibility.None));
        test("does not require pay", () => expect(requirement.requiresPay).toBe(false));
        test("spends resources", () => expect(requirement.cumulativeCost).toBe(false));
        test("can maximize", () => expect(unref(requirement.canMaximize)).toBe(true));
        test("maxBulkAmount is set", () =>
            expect(unref(requirement.maxBulkAmount)).compare_tolerance(Decimal.dInf));
        test("directSum is set", () => expect(unref(requirement.directSum)).toBe(5));
    });

    test("Requirement met when meeting the cost", () => {
        const requirement = createCostRequirement(() => ({
            resource,
            cost: 10,
            cumulativeCost: false
        }));
        expect(unref(requirement.requirementMet)).toBe(1);
    });

    test("Requirement not met when not meeting the cost", () => {
        const requirement = createCostRequirement(() => ({
            resource,
            cost: 100,
            cumulativeCost: false
        }));
        expect(unref(requirement.requirementMet)).toBe(0);
    });

    describe("canMaximize works correctly", () => {
        test("Cost function cannot maximize", () =>
            expect(
                unref(
                    createCostRequirement(() => ({
                        resource,
                        cost: () => 10,
                        maxBulkAmount: Decimal.dInf
                    })).canMaximize
                )
            ).toBe(false));
        test("Integrable formula cannot maximize if maxBulkAmount is left at 1", () =>
            expect(
                unref(
                    createCostRequirement(() => ({
                        resource,
                        cost: () => 10
                    })).canMaximize
                )
            ).toBe(false));
        test("Non-invertible formula cannot maximize when max bulk amount is above direct sum", () =>
            expect(
                unref(
                    createCostRequirement(() => ({
                        resource,
                        cost: Formula.variable(resource).abs(),
                        maxBulkAmount: Decimal.dInf
                    })).canMaximize
                )
            ).toBe(false));
        test("Non-invertible formula can maximize when max bulk amount is lte direct sum", () =>
            expect(
                unref(
                    createCostRequirement(() => ({
                        resource,
                        cost: Formula.variable(resource).abs(),
                        maxBulkAmount: 20,
                        directSum: 20
                    })).canMaximize
                )
            ).toBe(true));
        test("Invertible formula can maximize if cumulativeCost is false", () =>
            expect(
                unref(
                    createCostRequirement(() => ({
                        resource,
                        cost: Formula.variable(resource).lambertw(),
                        cumulativeCost: false,
                        maxBulkAmount: Decimal.dInf
                    })).canMaximize
                )
            ).toBe(true));
        test("Invertible formula cannot maximize if cumulativeCost is true", () =>
            expect(
                unref(
                    createCostRequirement(() => ({
                        resource,
                        cost: Formula.variable(resource).lambertw(),
                        cumulativeCost: true,
                        maxBulkAmount: Decimal.dInf
                    })).canMaximize
                )
            ).toBe(false));
        test("Integrable formula can maximize if cumulativeCost is false", () =>
            expect(
                unref(
                    createCostRequirement(() => ({
                        resource,
                        cost: Formula.variable(resource).pow(2),
                        cumulativeCost: false,
                        maxBulkAmount: Decimal.dInf
                    })).canMaximize
                )
            ).toBe(true));
        test("Integrable formula can maximize if cumulativeCost is true", () =>
            expect(
                unref(
                    createCostRequirement(() => ({
                        resource,
                        cost: Formula.variable(resource).pow(2),
                        cumulativeCost: true,
                        maxBulkAmount: Decimal.dInf
                    })).canMaximize
                )
            ).toBe(true));
    });

    test("Requirements met capped by maxBulkAmount", () =>
        expect(
            unref(
                createCostRequirement(() => ({
                    resource,
                    cost: Formula.variable(resource).times(0.0001),
                    maxBulkAmount: 10,
                    cumulativeCost: false
                })).requirementMet
            )
        ).compare_tolerance(10));
});

test("Creating visibility requirement", () => {
    const visibility = ref<Visibility.None | Visibility.Visible | boolean>(Visibility.Visible);
    const requirement = createVisibilityRequirement({ visibility });
    expect(unref(requirement.requirementMet)).toBe(true);
    visibility.value = true;
    expect(unref(requirement.requirementMet)).toBe(true);
    visibility.value = Visibility.None;
    expect(unref(requirement.requirementMet)).toBe(false);
    visibility.value = false;
    expect(unref(requirement.requirementMet)).toBe(false);
});

test("Creating boolean requirement", () => {
    const req = ref(true);
    const requirement = createBooleanRequirement(req);
    expect(unref(requirement.requirementMet)).toBe(true);
    req.value = false;
    expect(unref(requirement.requirementMet)).toBe(false);
});

describe("Checking all requirements met", () => {
    let metRequirement: Requirement;
    let unmetRequirement: Requirement;
    beforeAll(() => {
        metRequirement = createBooleanRequirement(true);
        unmetRequirement = createBooleanRequirement(false);
    });

    test("Returns true if no requirements", () => {
        expect(requirementsMet([])).toBe(true);
    });

    test("Returns true if all requirements met", () => {
        expect(requirementsMet([metRequirement, metRequirement])).toBe(true);
    });

    test("Returns false if any requirements unmet", () => {
        expect(requirementsMet([metRequirement, unmetRequirement])).toBe(false);
    });
});

describe("Checking maximum levels of requirements met", () => {
    test("Returns 0 if any requirement is not met", () => {
        const requirements = [
            createBooleanRequirement(false),
            createBooleanRequirement(true),
            createCostRequirement(() => ({
                resource: createResource(ref(10)),
                cost: Formula.variable(0),
                cumulativeCost: false
            }))
        ];
        expect(maxRequirementsMet(requirements)).compare_tolerance(0);
    });

    test("Returns correct number of requirements met", () => {
        const requirements = [
            createBooleanRequirement(true),
            createCostRequirement(() => ({
                resource: createResource(ref(10)),
                cost: Formula.variable(0),
                cumulativeCost: false,
                maxBulkAmount: Decimal.dInf
            }))
        ];
        expect(maxRequirementsMet(requirements)).compare_tolerance(10);
    });
});

test("Paying requirements", () => {
    const resource = createResource(ref(100));
    const noPayment = createCostRequirement(() => ({
        resource,
        cost: 10,
        requiresPay: false,
        cumulativeCost: false
    }));
    const payment = createCostRequirement(() => ({
        resource,
        cost: 10,
        cumulativeCost: false
    }));
    payRequirements([noPayment, payment]);
    expect(resource.value).compare_tolerance(90);
});
