<template>
    <div
        v-if="visibility !== Visibility.None"
        v-show="visibility === Visibility.Visible"
        :style="style"
        :class="{
            feature: true,
            challenge: true,
            resetNotify: active,
            notify: active && canComplete,
            done: completed,
            canStart,
            maxed,
            ...classes
        }"
    >
        <button class="toggleChallenge" @click="toggle">
            {{ buttonText }}
        </button>
        <component v-if="component" :is="component" />
        <default-challenge-display v-else :id="id" />
        <MarkNode :mark="mark" />
        <LinkNode :id="id" />
    </div>
</template>

<script setup lang="tsx">
import { GenericChallenge } from "@/features/challenge";
import { FeatureComponent, Visibility } from "@/features/feature";
import { coerceComponent, isCoercableComponent } from "@/util/vue";
import { computed, toRefs } from "vue";

const props = toRefs(defineProps<FeatureComponent<GenericChallenge>>());

const buttonText = computed(() => {
    if (props.active.value) {
        return props.canComplete.value ? "Finish" : "Exit Early";
    }
    if (props.maxed.value) {
        return "Completed";
    }
    return "Start";
});

const component = computed(() => {
    const display = props.display.value;
    if (display == null) {
        return null;
    }
    if (isCoercableComponent(display)) {
        return coerceComponent(display);
    }
    return (
        <span>
            <template v-if={display.title}>
                {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                <component v-is={coerceComponent(display.title!, "h3")} />
            </template>
            <component v-is={coerceComponent(display.description, "div")} />
            <div v-if={display.goal}>
                <br />
                {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                Goal: <component v-is={coerceComponent(display.goal!)} />
            </div>
            <div v-if={display.reward}>
                <br />
                {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                Reward: <component v-is={coerceComponent(display.reward!)} />
            </div>
            <div v-if={display.effectDisplay}>
                Currently: {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                <component v-is={coerceComponent(display.effectDisplay!)} />
            </div>
        </span>
    );
});
</script>

<style scoped>
.challenge {
    background-color: var(--locked);
    width: 300px;
    min-height: 300px;
    color: black;
    font-size: 15px;
    display: flex;
    flex-flow: column;
    align-items: center;
}

.challenge.done {
    background-color: var(--bought);
}

.challenge button {
    min-height: 50px;
    width: 120px;
    border-radius: var(--border-radius);
    box-shadow: none !important;
    background: transparent;
}

.challenge.canStart button {
    cursor: pointer;
    background-color: var(--layer-color);
}
</style>
