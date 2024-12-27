import Clickable from "features/clickables/Clickable.vue";
import { Visibility } from "features/feature";
import { DefaultValue, Persistent, persistent } from "game/persistence";
import {
    createVisibilityRequirement,
    displayRequirements,
    maxRequirementsMet,
    payRequirements,
    Requirements,
    requirementsMet
} from "game/requirements";
import type { DecimalSource } from "util/bignum";
import Decimal, { formatWhole } from "util/bignum";
import { MaybeGetter, processGetter } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { isJSXElement, render, Renderable, VueFeature, vueFeatureMixin } from "util/vue";
import type { MaybeRef, MaybeRefOrGetter, Ref } from "vue";
import { computed, unref } from "vue";
import { ClickableOptions } from "./clickable";

/** A symbol used to identify {@link Repeatable} features. */
export const RepeatableType = Symbol("Repeatable");

/** An object that configures a {@link Repeatable}. */
export interface RepeatableOptions extends ClickableOptions {
    /** The requirement(s) to increase this repeatable. */
    requirements: Requirements;
    /** The maximum amount obtainable for this repeatable. */
    limit?: MaybeRefOrGetter<DecimalSource>;
    /** The initial amount this repeatable has on a new save / after reset. */
    initialAmount?: DecimalSource;
    /** The display to use for this repeatable. */
    display?:
        | MaybeGetter<Renderable>
        | {
              /** A header to appear at the top of the display. */
              title?: MaybeGetter<Renderable>;
              /** The main text that appears in the display. */
              description: MaybeGetter<Renderable>;
              /** A description of the current effect of this repeatable, based off its amount. */
              effectDisplay?: MaybeGetter<Renderable>;
              /** Whether or not to show the current amount of this repeatable at the bottom of the display. */
              showAmount?: boolean;
          };
}

/** An object that represents a feature with multiple "levels" with scaling requirements. */
export interface Repeatable extends VueFeature {
    /** The requirement(s) to increase this repeatable. */
    requirements: Requirements;
    /** The maximum amount obtainable for this repeatable. */
    limit: MaybeRef<DecimalSource>;
    /** The initial amount this repeatable has on a new save / after reset. */
    initialAmount?: DecimalSource;
    /** The display to use for this repeatable. */
    display?: MaybeGetter<Renderable>;
    /** Whether or not the repeatable may be clicked. */
    canClick: Ref<boolean>;
    /** A function that is called when the repeatable is clicked. */
    onClick: (event?: MouseEvent | TouchEvent) => void;
    /** The current amount this repeatable has. */
    amount: Persistent<DecimalSource>;
    /** Whether or not this repeatable's amount is at it's limit. */
    maxed: Ref<boolean>;
    /** How much amount can be increased by, or 1 if unclickable. **/
    amountToIncrease: Ref<DecimalSource>;
    /** A symbol that helps identify features of the same type. */
    type: typeof RepeatableType;
}

/**
 * Lazily creates a repeatable with the given options.
 * @param optionsFunc Repeatable options.
 */
export function createRepeatable<T extends RepeatableOptions>(optionsFunc: () => T) {
    const amount = persistent<DecimalSource>(0);
    return createLazyProxy(() => {
        const options = optionsFunc();
        const {
            requirements: _requirements,
            display: _display,
            limit,
            onClick,
            initialAmount,
            ...props
        } = options;

        if (options.classes == null) {
            options.classes = computed(() => ({ bought: unref(repeatable.maxed) }));
        } else {
            const classes = processGetter(options.classes);
            options.classes = computed(() => ({
                ...unref(classes),
                bought: unref(repeatable.maxed)
            }));
        }
        const vueFeature = vueFeatureMixin("repeatable", options, () => (
            <Clickable
                canClick={repeatable.canClick}
                onClick={repeatable.onClick}
                onHold={repeatable.onClick}
                display={repeatable.display}
            />
        ));

        const limitRequirement = {
            requirementMet: computed(
                (): DecimalSource => Decimal.sub(unref(repeatable.limit), unref(amount))
            ),
            requiresPay: false,
            visibility: Visibility.None,
            canMaximize: true
        } as const;
        const requirements: Requirements = [
            ...(Array.isArray(_requirements) ? _requirements : [_requirements]),
            limitRequirement
        ];
        if (vueFeature.visibility != null) {
            requirements.push(createVisibilityRequirement(vueFeature.visibility));
        }

        let display;
        if (typeof _display === "object" && !isJSXElement(_display)) {
            const { title, description, effectDisplay, showAmount } = _display;

            display = () => (
                <span>
                    {title == null ? null : (
                        <div>
                            {render(title, el => (
                                <h3>{el}</h3>
                            ))}
                        </div>
                    )}
                    {render(description)}
                    {showAmount === false ? null : (
                        <div>
                            <br />
                            <>Amount: {formatWhole(unref(amount))}</>
                            {Decimal.isFinite(unref(repeatable.limit)) ? (
                                <> / {formatWhole(unref(repeatable.limit))}</>
                            ) : undefined}
                        </div>
                    )}
                    {effectDisplay == null ? null : (
                        <div>
                            <br />
                            Currently: {render(effectDisplay)}
                        </div>
                    )}
                    {unref(repeatable.maxed) ? null : (
                        <div>
                            <br />
                            {displayRequirements(requirements, unref(repeatable.amountToIncrease))}
                        </div>
                    )}
                </span>
            );
        } else if (_display != null) {
            display = _display;
        }

        amount[DefaultValue] = initialAmount ?? 0;

        const repeatable = {
            type: RepeatableType,
            ...(props as Omit<typeof props, keyof VueFeature | keyof RepeatableOptions>),
            ...vueFeature,
            amount,
            requirements,
            initialAmount,
            limit: processGetter(limit) ?? Decimal.dInf,
            classes: computed(() => {
                const currClasses = unref(vueFeature.classes) || {};
                if (unref(repeatable.maxed)) {
                    currClasses.bought = true;
                }
                return currClasses;
            }),
            maxed: computed((): boolean => Decimal.gte(unref(amount), unref(repeatable.limit))),
            canClick: computed(() => requirementsMet(requirements)),
            amountToIncrease: computed(() => Decimal.clampMin(maxRequirementsMet(requirements), 1)),
            onClick(event?: MouseEvent | TouchEvent) {
                if (!unref(repeatable.canClick)) {
                    return;
                }
                const purchaseAmount = unref(repeatable.amountToIncrease) ?? 1;
                payRequirements(requirements, purchaseAmount);
                amount.value = Decimal.add(unref(amount), purchaseAmount);
                onClick?.(event);
            },
            display
        } satisfies Repeatable;

        return repeatable;
    });
}
