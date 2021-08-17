<template>
    <component :is="challengeDescription" v-bind="$attrs" />
    <div>Goal: <component :is="goalDescription" /></div>
    <div>Reward: <component :is="rewardDescription" /></div>
    <component v-if="rewardDisplay" :is="rewardDisplay" />
</template>

<script lang="ts">
import { layers } from "@/game/layers";
import { Challenge } from "@/typings/features/challenge";
import { coerceComponent, InjectLayerMixin } from "@/util/vue";
import { Component, defineComponent } from "vue";

export default defineComponent({
    name: "default-challenge-display",
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
        challengeDescription(): Component | string {
            return coerceComponent(this.challenge.challengeDescription, "div");
        },
        goalDescription(): Component | string {
            if (this.challenge.goalDescription) {
                return coerceComponent(this.challenge.goalDescription);
            }
            return coerceComponent(
                `{{ format(${this.challenge.goal}) }} ${this.challenge.currencyDisplayName ||
                    "points"}`
            );
        },
        rewardDescription(): Component | string {
            return coerceComponent(this.challenge.rewardDescription);
        },
        rewardDisplay(): Component | string | null {
            if (this.challenge.rewardDisplay) {
                return coerceComponent(`Currently: ${this.challenge.rewardDisplay}`);
            }
            return null;
        }
    }
});
</script>

<style scoped></style>
