import {
    Conversion,
    ConversionOptions,
    createIndependentConversion,
    createLinearScaling
} from "features/conversion";
import { createResource, Resource } from "features/resources/resource";
import Decimal, { DecimalSource } from "util/bignum";
import { it, beforeEach, describe, expect } from "@jest/globals";

/**
 * In this test suite `bugs` are converted to `headaches` using the default scalingFunction.
 * The example values from the documentation are tested on `currentGain()`, `currentAt()` and `nextAt()`
 */
describe("LinearScalingFunction", () => {
    let bugResource: Resource;
    let headacheResource: Resource;
    let bugsToHeadachesConversion: Conversion<ConversionOptions>;

    beforeEach(() => {
        bugResource = createResource<DecimalSource>(0, "Bugs");
        headacheResource = createResource<DecimalSource>(0, "Headaches");
        bugsToHeadachesConversion = createIndependentConversion(() => {
            return {
                baseResource: bugResource,
                gainResource: headacheResource,
                scaling: createLinearScaling(10, 0.5),
                buyMax: true
            };
        });
    });

    it.each([
        [10, 1],
        [12, 2],
        [14, 3],
        [15, 3],
        [20, 6]
    ])(
        "Turns %i bugs into an expectedGain of %i",
        async (bugCount: number, expectedGain: number) => {
            // Arrange
            bugResource.value = Decimal.add(bugCount, bugResource.value);

            // Act
            const currentGain = bugsToHeadachesConversion.currentGain.value;

            // Assert
            expect(currentGain).toEqual(new Decimal(expectedGain));
        }
    );

    it.each([
        [-1, 0],
        [9, 0],
        [10, 10],
        [11, 10],
        [17, 16],
        [21, 20]
    ])(
        "Calculates for %i bugs the currentAt at %i",
        async (bugCount: number, expectedAt: number) => {
            // Arrange
            bugResource.value = Decimal.add(bugCount, bugResource.value);

            // Act
            const currentAt = bugsToHeadachesConversion.currentAt.value;

            // Assert
            expect(currentAt).toEqual(new Decimal(expectedAt));
        }
    );

    it.each([
        [-10, 10],
        [9, 10],
        [10, 12],
        [11, 12],
        [14, 16]
    ])(
        "Calculates for %i bugs the nextAt at %i",
        async (bugCount: number, expectedNextAt: number) => {
            // Arrange
            bugResource.value = Decimal.add(bugCount, bugResource.value);

            // Act
            const nextAt = bugsToHeadachesConversion.nextAt.value;

            // Assert
            expect(nextAt).toEqual(new Decimal(expectedNextAt));
        }
    );
});
