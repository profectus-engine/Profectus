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
                cost: 10,
                spendResources: false
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
        test("does not spend resources", () => expect(requirement.spendResources).toBe(false));
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
                maximize: true,
                spendResources: true,
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
        test("spends resources", () => expect(requirement.spendResources).toBe(true));
        test("can maximize", () => expect(unref(requirement.canMaximize)).toBe(true));
    });

    test("Requirement met when meeting the cost", () => {
        const requirement = createCostRequirement(() => ({
            resource,
            cost: 10,
            spendResources: false
        }));
        expect(unref(requirement.requirementMet)).toBe(true);
    });

    test("Requirement not met when not meeting the cost", () => {
        const requirement = createCostRequirement(() => ({
            resource,
            cost: 100,
            spendResources: false
        }));
        expect(unref(requirement.requirementMet)).toBe(false);
    });

    describe("canMaximize works correctly", () => {
        test("Cost function cannot maximize", () =>
            expect(
                unref(
                    createCostRequirement(() => ({
                        resource,
                        cost: () => 10
                    })).canMaximize
                )
            ).toBe(false));
        test("Non-invertible formula cannot maximize", () =>
            expect(
                unref(
                    createCostRequirement(() => ({
                        resource,
                        cost: Formula.variable(resource).abs()
                    })).canMaximize
                )
            ).toBe(false));
        test("Invertible formula can maximize if spendResources is false", () =>
            expect(
                unref(
                    createCostRequirement(() => ({
                        resource,
                        cost: Formula.variable(resource).lambertw(),
                        spendResources: false
                    })).canMaximize
                )
            ).toBe(true));
        test("Invertible formula cannot maximize if spendResources is true", () =>
            expect(
                unref(
                    createCostRequirement(() => ({
                        resource,
                        cost: Formula.variable(resource).lambertw(),
                        spendResources: true
                    })).canMaximize
                )
            ).toBe(false));
        test("Integrable formula can maximize if spendResources is false", () =>
            expect(
                unref(
                    createCostRequirement(() => ({
                        resource,
                        cost: Formula.variable(resource).pow(2),
                        spendResources: false
                    })).canMaximize
                )
            ).toBe(true));
        test("Integrable formula can maximize if spendResources is true", () =>
            expect(
                unref(
                    createCostRequirement(() => ({
                        resource,
                        cost: Formula.variable(resource).pow(2),
                        spendResources: true
                    })).canMaximize
                )
            ).toBe(true));
    });
});

describe("Creating visibility requirement", () => {
    test("Requirement met when visible", () => {
        const requirement = createVisibilityRequirement({ visibility: Visibility.Visible });
        expect(unref(requirement.requirementMet)).toBe(true);
    });

    test("Requirement not met when not visible", () => {
        let requirement = createVisibilityRequirement({ visibility: Visibility.None });
        expect(unref(requirement.requirementMet)).toBe(false);
        requirement = createVisibilityRequirement({ visibility: false });
        expect(unref(requirement.requirementMet)).toBe(false);
    });
});

describe("Creating boolean requirement", () => {
    test("Requirement met when true", () => {
        const requirement = createBooleanRequirement(ref(true));
        expect(unref(requirement.requirementMet)).toBe(true);
    });

    test("Requirement not met when false", () => {
        const requirement = createBooleanRequirement(ref(false));
        expect(unref(requirement.requirementMet)).toBe(false);
    });
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
                spendResources: false
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
                spendResources: false
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
        spendResources: false
    }));
    const payment = createCostRequirement(() => ({
        resource,
        cost: 10,
        spendResources: false
    }));
    payRequirements([noPayment, payment]);
    expect(resource.value).compare_tolerance(90);
});
