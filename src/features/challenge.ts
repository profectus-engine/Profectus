import ChallengeComponent from "@/components/features/Challenge.vue";
import {
    CoercableComponent,
    Component,
    getUniqueID,
    persistent,
    PersistentRef,
    Replace,
    setDefault,
    StyleValue,
    Visibility
} from "@/features/feature";
import { Resource } from "@/features/resource";
import { globalBus } from "@/game/events";
import settings from "@/game/settings";
import Decimal, { DecimalSource } from "@/util/bignum";
import {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    processComputable,
    ProcessedComputable
} from "@/util/computed";
import { createProxy } from "@/util/proxies";
import { computed, Ref, unref } from "vue";
import { GenericReset } from "./reset";

export const ChallengeType = Symbol("ChallengeType");

export interface ChallengeOptions {
    visibility?: Computable<Visibility>;
    canStart?: Computable<boolean>;
    reset?: GenericReset;
    canComplete?: Computable<boolean | DecimalSource>;
    completionLimit?: Computable<DecimalSource>;
    mark?: Computable<boolean | string>;
    resource?: Resource;
    goal?: Computable<DecimalSource>;
    classes?: Computable<Record<string, boolean>>;
    style?: Computable<StyleValue>;
    display?: Computable<
        | CoercableComponent
        | {
              title?: CoercableComponent;
              description: CoercableComponent;
              goal?: CoercableComponent;
              reward?: CoercableComponent;
              effectDisplay?: CoercableComponent;
          }
    >;
    onComplete?: VoidFunction;
    onExit?: VoidFunction;
    onEnter?: VoidFunction;
}

interface BaseChallenge {
    id: string;
    completions: PersistentRef<DecimalSource>;
    completed: Ref<boolean>;
    maxed: Ref<boolean>;
    active: PersistentRef<boolean>;
    toggle: VoidFunction;
    type: typeof ChallengeType;
    [Component]: typeof ChallengeComponent;
}

export type Challenge<T extends ChallengeOptions> = Replace<
    T & BaseChallenge,
    {
        visibility: GetComputableTypeWithDefault<T["visibility"], Visibility.Visible>;
        canStart: GetComputableTypeWithDefault<T["canStart"], Ref<boolean>>;
        canComplete: GetComputableTypeWithDefault<T["canComplete"], Ref<boolean>>;
        completionLimit: GetComputableTypeWithDefault<T["completionLimit"], 1>;
        mark: GetComputableTypeWithDefault<T["mark"], Ref<boolean>>;
        goal: GetComputableType<T["goal"]>;
        classes: GetComputableType<T["classes"]>;
        style: GetComputableType<T["style"]>;
        display: GetComputableType<T["display"]>;
    }
>;

export type GenericChallenge = Replace<
    Challenge<ChallengeOptions>,
    {
        visibility: ProcessedComputable<Visibility>;
        canStart: ProcessedComputable<boolean>;
        canComplete: ProcessedComputable<boolean>;
        completionLimit: ProcessedComputable<DecimalSource>;
        mark: ProcessedComputable<boolean>;
    }
>;

export function createActiveChallenge(
    challenges: GenericChallenge[]
): Ref<GenericChallenge | undefined> {
    return computed(() => challenges.find(challenge => challenge.active.value));
}

export function createChallenge<T extends ChallengeOptions>(
    options: T & ThisType<Challenge<T>>
): Challenge<T> {
    if (options.canComplete == null && (options.resource == null || options.goal == null)) {
        console.warn(
            "Cannot create challenge without a canComplete property or a resource and goal property",
            options
        );
        throw "Cannot create challenge without a canComplete property or a resource and goal property";
    }

    const challenge: T & Partial<BaseChallenge> = options;
    challenge.id = getUniqueID("challenge-");
    challenge.type = ChallengeType;
    challenge[Component] = ChallengeComponent;

    challenge.completions = persistent(0);
    challenge.active = persistent(false);
    challenge.completed = computed(() => Decimal.gt(proxy.completions.value, 0));
    challenge.maxed = computed(() =>
        Decimal.gte(proxy.completions.value, unref(proxy.completionLimit))
    );
    challenge.toggle = function () {
        if (proxy.active.value) {
            if (proxy.canComplete && unref(proxy.canComplete) && !proxy.maxed.value) {
                let completions: boolean | DecimalSource = unref(proxy.canComplete);
                if (typeof completions === "boolean") {
                    completions = 1;
                }
                proxy.completions.value = Decimal.min(
                    Decimal.add(proxy.completions.value, completions),
                    unref(proxy.completionLimit)
                );
                proxy.onComplete?.();
            }
            proxy.active.value = false;
            proxy.onExit?.();
            proxy.reset?.reset();
        } else if (unref(proxy.canStart)) {
            proxy.reset?.reset();
            proxy.active.value = true;
            proxy.onEnter?.();
        }
    };
    processComputable(challenge as T, "visibility");
    setDefault(challenge, "visibility", Visibility.Visible);
    const visibility = challenge.visibility as ProcessedComputable<Visibility>;
    challenge.visibility = computed(() => {
        if (settings.hideChallenges === true && unref(proxy.maxed)) {
            return Visibility.None;
        }
        return unref(visibility);
    });
    if (challenge.canStart == null) {
        challenge.canStart = computed(() =>
            Decimal.lt(proxy.completions.value, unref(proxy.completionLimit))
        );
    }
    if (challenge.canComplete == null) {
        challenge.canComplete = computed(() => {
            if (!proxy.active.value || proxy.resource == null || proxy.goal == null) {
                return false;
            }
            return Decimal.gte(proxy.resource.value, unref(proxy.goal));
        });
    }
    if (challenge.mark == null) {
        challenge.mark = computed(
            () => Decimal.gt(unref(proxy.completionLimit), 1) && unref(proxy.maxed)
        );
    }

    processComputable(challenge as T, "canStart");
    processComputable(challenge as T, "canComplete");
    processComputable(challenge as T, "completionLimit");
    setDefault(challenge, "completionLimit", 1);
    processComputable(challenge as T, "mark");
    processComputable(challenge as T, "goal");
    processComputable(challenge as T, "classes");
    processComputable(challenge as T, "style");
    processComputable(challenge as T, "display");

    if (challenge.reset != null) {
        globalBus.on("reset", currentReset => {
            if (currentReset === challenge.reset && (challenge.active as Ref<boolean>).value) {
                (challenge.toggle as VoidFunction)();
            }
        });
    }

    const proxy = createProxy(challenge as unknown as Challenge<T>);
    return proxy;
}

declare module "@/game/settings" {
    interface Settings {
        hideChallenges: boolean;
    }
}

globalBus.on("loadSettings", settings => {
    setDefault(settings, "hideChallenges", false);
});
