import { Visibility } from "features/feature";
import { createResource, Resource } from "features/resources/resource";
import Formula from "game/formulas";
import {
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
    describe("Minimal requirement", () => {
        let resource: Resource;
        let requirement: Requirement;
        beforeAll(() => {
            resource = createResource(ref(10));
            requirement = createCostRequirement(() => ({
                resource,
                cost: 10
            }));
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        test("resource pass-through", () => (requirement as any).resource === resource);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        test("cost pass-through", () => (requirement as any).cost === 10);

        test("partialDisplay exists", () =>
            requirement.partialDisplay != null && typeof requirement.partialDisplay === "function");
        test("display exists", () =>
            requirement.display != null && typeof requirement.display === "function");
        test("pay exists", () => requirement.pay != null && typeof requirement.pay === "function");
        test("requirementMet exists", () =>
            requirement.requirementMet != null && isRef(requirement.requirementMet));
        test("is visible", () => requirement.visibility === Visibility.Visible);
        test("requires pay", () => requirement.requiresPay === true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        test("spends resources", () => (requirement as any).spendResources !== false);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        test("does not buy max", () => (requirement as any).buyMax !== true);
    });

    describe("Fully customized", () => {
        let resource: Resource;
        let requirement: Requirement;
        beforeAll(() => {
            resource = createResource(ref(10));
            requirement = createCostRequirement(() => ({
                resource,
                cost: 10,
                visibility: Visibility.None,
                requiresPay: false,
                buyMax: true,
                spendResources: false,
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                pay() {}
            }));
        });

        test("pay is empty function", () =>
            requirement.pay != null &&
            typeof requirement.pay === "function" &&
            requirement.pay.length === 1);
        test("is not visible", () => requirement.visibility === Visibility.None);
        test("does not require pay", () => requirement.requiresPay === false);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        test("does not spend resources", () => (requirement as any).spendResources);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        test("buys max", () => (requirement as any).buyMax);
    });

    test("Requirement met when meeting the cost", () => {
        const resource = createResource(ref(10));
        const requirement = createCostRequirement(() => ({
            resource,
            cost: 10
        }));
        expect(unref(requirement.requirementMet)).toBe(true);
    });

    test("Requirement not met when not meeting the cost", () => {
        const resource = createResource(ref(10));
        const requirement = createCostRequirement(() => ({
            resource,
            cost: 100
        }));
        expect(unref(requirement.requirementMet)).toBe(false);
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
        requirement = createVisibilityRequirement({ visibility: Visibility.Hidden });
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
                cost: Formula.variable(0)
            }))
        ];
        expect(maxRequirementsMet(requirements)).toBe(0);
    });

    test("Returns correct number of requirements met", () => {
        const requirements = [
            createBooleanRequirement(true),
            createCostRequirement(() => ({
                resource: createResource(ref(10)),
                cost: Formula.variable(0)
            }))
        ];
        expect(maxRequirementsMet(requirements)).toBe(10);
    });
});

test("Paying requirements", () => {
    const resource = createResource(ref(100));
    const noPayment = createCostRequirement(() => ({
        resource,
        cost: 10,
        requiresPay: false
    }));
    const payment = createCostRequirement(() => ({
        resource,
        cost: 10
    }));
    payRequirements([noPayment, payment]);
    expect(resource.value).compare_tolerance(90);
});
