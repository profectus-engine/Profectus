<template>
    <div
        v-if="challenge.shown"
        :style="style"
        :class="{
            feature: true,
            [layer]: true,
            challenge: true,
            resetNotify: challenge.active,
            notify: challenge.active && challenge.canComplete,
            done: challenge.completed,
            maxed: challenge.maxed
        }"
    >
        <div v-if="title"><component :is="title" /></div>
        <button :style="{ backgroundColor: challenge.maxed ? null : buttonColor }" @click="toggle">
            {{ buttonText }}
        </button>
        <component v-if="fullDisplay" :is="fullDisplay" />
        <default-challenge-display v-else :id="id" />
        <mark-node :mark="challenge.mark" />
        <branch-node :branches="challenge.branches" :id="id" featureType="challenge" />
    </div>
</template>

<script lang="ts">
import { layers } from "@/game/layers";
import { Challenge } from "@/typings/features/challenge";
import { coerceComponent, InjectLayerMixin } from "@/util/vue";
import { Component, defineComponent } from "vue";

export default defineComponent({
    name: "challenge",
    mixins: [InjectLayerMixin],
    props: {
        id: {
            type: [Number, String],
            required: true
        }
    },
    computed: {
        challenge(): Challenge {
            return layers[this.layer].challenges!.data[this.id];
        },
        style(): Array<Partial<CSSStyleDeclaration> | undefined> {
            return [layers[this.layer].componentStyles?.challenge, this.challenge.style];
        },
        title(): Component | string | null {
            if (this.challenge.titleDisplay) {
                return coerceComponent(this.challenge.titleDisplay, "div");
            }
            if (this.challenge.name) {
                return coerceComponent(this.challenge.name, "h3");
            }
            return null;
        },
        buttonColor(): string {
            return layers[this.layer].color;
        },
        buttonText(): string {
            if (this.challenge.active) {
                return this.challenge.canComplete ? "Finish" : "Exit Early";
            }
            if (this.challenge.maxed) {
                return "Completed";
            }
            return "Start";
        },
        fullDisplay(): Component | string | null {
            if (this.challenge.fullDisplay) {
                return coerceComponent(this.challenge.fullDisplay, "div");
            }
            return null;
        }
    },
    methods: {
        toggle() {
            this.challenge.toggle();
        }
    }
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
    cursor: pointer;
    box-shadow: none !important;
    background: transparent;
}

.challenge.maxed button {
    cursor: unset;
}
</style>
