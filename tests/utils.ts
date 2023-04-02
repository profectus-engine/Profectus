import Decimal, { DecimalSource, format } from "util/bignum";
import { expect } from "vitest";

interface CustomMatchers<R = unknown> {
    compare_tolerance(expected: DecimalSource, tolerance?: number): R;
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Vi {
        // eslint-disable-next-line @typescript-eslint/no-empty-interface
        interface Assertion extends CustomMatchers {}
        // eslint-disable-next-line @typescript-eslint/no-empty-interface
        interface AsymmetricMatchersContaining extends CustomMatchers {}
    }
}

expect.extend({
    compare_tolerance(received: DecimalSource, expected: DecimalSource, tolerance?: number) {
        const { isNot } = this;
        let pass = false;
        if (!Decimal.isFinite(expected)) {
            pass = !Decimal.isFinite(received);
        } else if (Decimal.isNaN(expected)) {
            pass = Decimal.isNaN(received);
        } else {
            pass = Decimal.eq_tolerance(received, expected, tolerance);
        }
        return {
            // do not alter your "pass" based on isNot. Vitest does it for you
            pass,
            message: () =>
                `Expected ${received} to${
                    (isNot as boolean) ? " not" : ""
                } be close to ${expected}`,
            expected: format(expected),
            actual: format(received)
        };
    }
});
