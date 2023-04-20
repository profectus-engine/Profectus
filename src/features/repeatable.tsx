import { isArray } from "@vue/shared";
import ClickableComponent from "features/clickables/Clickable.vue";
import type {
    CoercableComponent,
    GenericComponent,
    OptionsFunc,
    Replace,
    StyleValue
} from "features/feature";
import { Component, GatherProps, Visibility, getUniqueID, jsx, setDefault } from "features/feature";
import { DefaultValue, Persistent, persistent } from "game/persistence";
import {
    Requirements,
    createVisibilityRequirement,
    displayRequirements,
    maxRequirementsMet,
    payRequirements,
    requirementsMet
} from "game/requirements";
import type { DecimalSource } from "util/bignum";
import Decimal, { formatWhole } from "util/bignum";
import type {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    ProcessedComputable
} from "util/computed";
import { processComputable } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { coerceComponent, isCoercableComponent } from "util/vue";
import type { Ref } from "vue";
import { computed, unref } from "vue";
import { GenericDecorator } from "./decorators/common";

/** A symbol used to identify {@link Repeatable} features. */
export const RepeatableType = Symbol("Repeatable");

/** A type that can be used to customize the {@link Repeatable} display. */
export type RepeatableDisplay =
    | CoercableComponent
    | {
          /** A header to appear at the top of the display. */
          title?: CoercableComponent;
          /** The main text that appears in the display. */
          description?: CoercableComponent;
          /** A description of the current effect of this repeatable, based off its amount. */
          effectDisplay?: CoercableComponent;
          /** Whether or not to show the current amount of this repeatable at the bottom of the display. */
          showAmount?: boolean;
      };

/** An object that configures a {@link Repeatable}. */
export interface RepeatableOptions {
    /** Whether this repeatable should be visible. */
    visibility?: Computable<Visibility | boolean>;
    /** The requirement(s) to increase this repeatable. */
    requirements: Requirements;
    /** The maximum amount obtainable for this repeatable. */
    limit?: Computable<DecimalSource>;
    /** The initial amount this repeatable has on a new save / after reset. */
    initialAmount?: DecimalSource;
    /** Dictionary of CSS classes to apply to this feature. */
    classes?: Computable<Record<string, boolean>>;
    /** CSS to apply to this feature. */
    style?: Computable<StyleValue>;
    /** Shows a marker on the corner of the feature. */
    mark?: Computable<boolean | string>;
    /** Toggles a smaller design for the feature. */
    small?: Computable<boolean>;
    /** Whether or not clicking this repeatable should attempt to maximize amount based on the requirements met. Requires {@link requirements} to be a requirement or array of requirements with {@link Requirement.canMaximize} true. */
    maximize?: Computable<boolean>;
    /** The display to use for this repeatable. */
    display?: Computable<RepeatableDisplay>;
}

/**
 * The properties that are added onto a processed {@link RepeatableOptions} to create a {@link Repeatable}.
 */
export interface BaseRepeatable {
    /** An auto-generated ID for identifying features that appear in the DOM. Will not persist between refreshes or updates. */
    id: string;
    /** The current amount this repeatable has. */
    amount: Persistent<DecimalSource>;
    /** Whether or not this repeatable's amount is at it's limit. */
    maxed: Ref<boolean>;
    /** Whether or not this repeatable can be clicked. */
    canClick: ProcessedComputable<boolean>;
    /**
     * How much amount can be increased by, or 1 if unclickable.
     * Capped at 1 if {@link RepeatableOptions.maximize} is false.
     **/
    amountToIncrease: Ref<DecimalSource>;
    /** A function that gets called when this repeatable is clicked. */
    onClick: (event?: MouseEvent | TouchEvent) => void;
    /** A symbol that helps identify features of the same type. */
    type: typeof RepeatableType;
    /** The Vue component used to render this feature. */
    [Component]: GenericComponent;
    /** A function to gather the props the vue component requires for this feature. */
    [GatherProps]: () => Record<string, unknown>;
}

/** An object that represents a feature with multiple "levels" with scaling requirements. */
export type Repeatable<T extends RepeatableOptions> = Replace<
    T & BaseRepeatable,
    {
        visibility: GetComputableTypeWithDefault<T["visibility"], Visibility.Visible>;
        requirements: GetComputableType<T["requirements"]>;
        limit: GetComputableTypeWithDefault<T["limit"], Decimal>;
        classes: GetComputableType<T["classes"]>;
        style: GetComputableType<T["style"]>;
        mark: GetComputableType<T["mark"]>;
        small: GetComputableType<T["small"]>;
        maximize: GetComputableType<T["maximize"]>;
        display: Ref<CoercableComponent>;
    }
>;

/** A type that matches any valid {@link Repeatable} object. */
export type GenericRepeatable = Replace<
    Repeatable<RepeatableOptions>,
    {
        visibility: ProcessedComputable<Visibility | boolean>;
        limit: ProcessedComputable<DecimalSource>;
    }
>;

/**
 * Lazily creates a repeatable with the given options.
 * @param optionsFunc Repeatable options.
 */
export function createRepeatable<T extends RepeatableOptions>(
    optionsFunc: OptionsFunc<T, BaseRepeatable, GenericRepeatable>,
    ...decorators: GenericDecorator[]
): Repeatable<T> {
    const amount = persistent<DecimalSource>(0);
    const decoratedData = decorators.reduce(
        (current, next) => Object.assign(current, next.getPersistentData?.()),
        {}
    );
    return createLazyProxy<Repeatable<T>, Repeatable<T>>(feature => {
        const repeatable = optionsFunc.call(feature, feature);

        repeatable.id = getUniqueID("repeatable-");
        repeatable.type = RepeatableType;
        repeatable[Component] = ClickableComponent as GenericComponent;

        for (const decorator of decorators) {
            decorator.preConstruct?.(repeatable);
        }

        repeatable.amount = amount;
        repeatable.amount[DefaultValue] = repeatable.initialAmount ?? 0;

        Object.assign(repeatable, decoratedData);

        const limitRequirement = {
            requirementMet: computed(() =>
                Decimal.sub(
                    unref((repeatable as GenericRepeatable).limit),
                    (repeatable as GenericRepeatable).amount.value
                )
            ),
            requiresPay: false,
            visibility: Visibility.None
        } as const;
        const visibilityRequirement = createVisibilityRequirement(repeatable as GenericRepeatable);
        if (isArray(repeatable.requirements)) {
            repeatable.requirements.unshift(visibilityRequirement);
            repeatable.requirements.push(limitRequirement);
        } else {
            repeatable.requirements = [
                visibilityRequirement,
                repeatable.requirements,
                limitRequirement
            ];
        }

        repeatable.maxed = computed(() =>
            Decimal.gte(
                (repeatable as GenericRepeatable).amount.value,
                unref((repeatable as GenericRepeatable).limit)
            )
        );
        processComputable(repeatable as T, "classes");
        const classes = repeatable.classes as
            | ProcessedComputable<Record<string, boolean>>
            | undefined;
        repeatable.classes = computed(() => {
            const currClasses = unref(classes) || {};
            if ((repeatable as GenericRepeatable).maxed.value) {
                currClasses.bought = true;
            }
            return currClasses;
        });
        repeatable.amountToIncrease = computed(() =>
            unref((repeatable as GenericRepeatable).maximize)
                ? maxRequirementsMet(repeatable.requirements)
                : 1
        );
        repeatable.canClick = computed(() => requirementsMet(repeatable.requirements));
        const onClick = repeatable.onClick;
        repeatable.onClick = function (this: GenericRepeatable, event?: MouseEvent | TouchEvent) {
            const genericRepeatable = repeatable as GenericRepeatable;
            if (!unref(genericRepeatable.canClick)) {
                return;
            }
            payRequirements(repeatable.requirements, unref(repeatable.amountToIncrease));
            genericRepeatable.amount.value = Decimal.add(genericRepeatable.amount.value, 1);
            onClick?.(event);
        };
        processComputable(repeatable as T, "display");
        const display = repeatable.display;
        repeatable.display = jsx(() => {
            // TODO once processComputable types correctly, remove this "as X"
            const currDisplay = unref(display) as RepeatableDisplay;
            if (isCoercableComponent(currDisplay)) {
                const CurrDisplay = coerceComponent(currDisplay);
                return <CurrDisplay />;
            }
            if (currDisplay != null) {
                const genericRepeatable = repeatable as GenericRepeatable;
                const Title = coerceComponent(currDisplay.title ?? "", "h3");
                const Description = coerceComponent(currDisplay.description ?? "");
                const EffectDisplay = coerceComponent(currDisplay.effectDisplay ?? "");

                return (
                    <span>
                        {currDisplay.title == null ? null : (
                            <div>
                                <Title />
                            </div>
                        )}
                        {currDisplay.description == null ? null : <Description />}
                        {currDisplay.showAmount === false ? null : (
                            <div>
                                <br />
                                joinJSX(
                                <>Amount: {formatWhole(genericRepeatable.amount.value)}</>,
                                {unref(genericRepeatable.limit) !== Decimal.dInf ? (
                                    <> / {formatWhole(unref(genericRepeatable.limit))}</>
                                ) : undefined}
                                )
                            </div>
                        )}
                        {currDisplay.effectDisplay == null ? null : (
                            <div>
                                <br />
                                Currently: <EffectDisplay />
                            </div>
                        )}
                        {genericRepeatable.maxed.value ? null : (
                            <div>
                                <br />
                                {displayRequirements(
                                    genericRepeatable.requirements,
                                    unref(repeatable.amountToIncrease)
                                )}
                            </div>
                        )}
                    </span>
                );
            }
            return "";
        });

        processComputable(repeatable as T, "visibility");
        setDefault(repeatable, "visibility", Visibility.Visible);
        processComputable(repeatable as T, "limit");
        setDefault(repeatable, "limit", Decimal.dInf);
        processComputable(repeatable as T, "style");
        processComputable(repeatable as T, "mark");
        processComputable(repeatable as T, "small");
        processComputable(repeatable as T, "maximize");

        for (const decorator of decorators) {
            decorator.postConstruct?.(repeatable);
        }

        const decoratedProps = decorators.reduce(
            (current, next) => Object.assign(current, next.getGatheredProps?.(repeatable)),
            {}
        );
        repeatable[GatherProps] = function (this: GenericRepeatable) {
            const { display, visibility, style, classes, onClick, canClick, small, mark, id } =
                this;
            return {
                display,
                visibility,
                style: unref(style),
                classes,
                onClick,
                canClick,
                small,
                mark,
                id,
                ...decoratedProps
            };
        };

        return repeatable as unknown as Repeatable<T>;
    });
}
