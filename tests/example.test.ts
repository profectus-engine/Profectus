import Decimal from "util/bignum";

test("Decimals?", () => {
    const x = new Decimal(3);
    expect(x.m).toBe(3);
});
