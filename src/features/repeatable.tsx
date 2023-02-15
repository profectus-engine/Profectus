import { isArray } from "@vue/shared";
import ClickableComponent from "features/clickables/Clickable.vue";
import type { CoercableComponent, OptionsFunc, Replace, StyleValue } from "features/feature";
import { Component, GatherProps, getUniqueID, jsx, setDefault, Visibility } from "features/feature";
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

export const RepeatableType = Symbol("Repeatable");

export type RepeatableDisplay =
    | CoercableComponent
    | {
          title?: CoercableComponent;
          description?: CoercableComponent;
          effectDisplay?: CoercableComponent;
          showAmount?: boolean;
      };

export interface RepeatableOptions {
    visibility?: Computable<Visibility>;
    requirements: Requirements;
    limit?: Computable<DecimalSource>;
    initialAmount?: DecimalSource;
    classes?: Computable<Record<string, boolean>>;
    style?: Computable<StyleValue>;
    mark?: Computable<boolean | string>;
    small?: Computable<boolean>;
    buyMax?: Computable<boolean>;
    display?: Computable<RepeatableDisplay>;
    onPurchase?: VoidFunction;
}

export interface BaseRepeatable {
    id: string;
    amount: Persistent<DecimalSource>;
    maxed: Ref<boolean>;
    canClick: ProcessedComputable<boolean>;
    onClick: VoidFunction;
    purchase: VoidFunction;
    type: typeof RepeatableType;
    [Component]: typeof ClickableComponent;
    [GatherProps]: () => Record<string, unknown>;
}

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
        buyMax: GetComputableType<T["buyMax"]>;
        display: Ref<CoercableComponent>;
    }
>;

export type GenericRepeatable = Replace<
    Repeatable<RepeatableOptions>,
    {
        visibility: ProcessedComputable<Visibility>;
        limit: ProcessedComputable<DecimalSource>;
    }
>;

export function createRepeatable<T extends RepeatableOptions>(
    optionsFunc: OptionsFunc<T, BaseRepeatable, GenericRepeatable>
): Repeatable<T> {
    const amount = persistent<DecimalSource>(0);
    return createLazyProxy(() => {
        const repeatable = optionsFunc();

        repeatable.id = getUniqueID("repeatable-");
        repeatable.type = RepeatableType;
        repeatable[Component] = ClickableComponent;

        repeatable.amount = amount;
        repeatable.amount[DefaultValue] = repeatable.initialAmount ?? 0;

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
        repeatable.canClick = computed(() => requirementsMet(repeatable.requirements));
        repeatable.onClick = repeatable.purchase =
            repeatable.onClick ??
            repeatable.purchase ??
            function (this: GenericRepeatable) {
                const genericRepeatable = repeatable as GenericRepeatable;
                if (!unref(genericRepeatable.canClick)) {
                    return;
                }
                payRequirements(
                    repeatable.requirements,
                    unref(genericRepeatable.buyMax)
                        ? maxRequirementsMet(genericRepeatable.requirements)
                        : 1
                );
                genericRepeatable.amount.value = Decimal.add(genericRepeatable.amount.value, 1);
                genericRepeatable.onPurchase?.();
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
                                {unref(genericRepeatable.limit) === Decimal.dInf ? (
                                    <>Amount: {formatWhole(genericRepeatable.amount.value)}</>
                                ) : (
                                    <>
                                        Amount: {formatWhole(genericRepeatable.amount.value)} /{" "}
                                        {formatWhole(unref(genericRepeatable.limit))}
                                    </>
                                )}
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
                                    unref(genericRepeatable.buyMax)
                                        ? maxRequirementsMet(genericRepeatable.requirements)
                                        : 1
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
        processComputable(repeatable as T, "buyMax");

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
                id
            };
        };

        return repeatable as unknown as Repeatable<T>;
    });
}
