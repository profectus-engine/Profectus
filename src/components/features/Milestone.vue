<template>
    <div
        v-if="milestone.shown"
        :style="style"
        :class="{ feature: true, milestone: true, done: milestone.earned }"
    >
        <div v-if="requirementDisplay"><component :is="requirementDisplay" /></div>
        <div v-if="effectDisplay"><component :is="effectDisplay" /></div>
        <component v-if="optionsDisplay" :is="optionsDisplay" />
        <branch-node :branches="milestone.branches" :id="id" featureType="milestone" />
    </div>
</template>

<script lang="ts">
import { layers } from "@/game/layers";
import { Milestone } from "@/typings/features/milestone";
import { coerceComponent, InjectLayerMixin } from "@/util/vue";
import { Component, defineComponent } from "vue";

export default defineComponent({
    name: "milestone",
    mixins: [InjectLayerMixin],
    props: {
        id: {
            type: [Number, String],
            required: true
        }
    },
    computed: {
        milestone(): Milestone {
            return layers[this.layer].milestones!.data[this.id];
        },
        style(): Array<Partial<CSSStyleDeclaration> | undefined> {
            return [layers[this.layer].componentStyles?.milestone, this.milestone.style];
        },
        requirementDisplay(): Component | string | null {
            if (this.milestone.requirementDisplay) {
                return coerceComponent(this.milestone.requirementDisplay, "h3");
            }
            return null;
        },
        effectDisplay(): Component | string | null {
            if (this.milestone.effectDisplay) {
                return coerceComponent(this.milestone.effectDisplay, "b");
            }
            return null;
        },
        optionsDisplay(): Component | string | null {
            if (this.milestone.optionsDisplay && this.milestone.earned) {
                return coerceComponent(this.milestone.optionsDisplay, "div");
            }
            return null;
        }
    }
});
</script>

<style scoped>
.milestone {
    width: calc(100% - 10px);
    min-width: 120px;
    padding-left: 5px;
    padding-right: 5px;
    min-height: 75px;
    background-color: var(--locked);
    border-width: 4px;
    border-radius: 5px;
    color: rgba(0, 0, 0, 0.5);
    margin: 0;
}

.milestone.done {
    background-color: var(--bought);
    cursor: default;
}
</style>
