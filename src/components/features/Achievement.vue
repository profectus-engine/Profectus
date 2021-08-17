<template>
    <tooltip v-if="achievement.unlocked" :display="tooltip">
        <div
            :style="style"
            :class="{
                [layer]: true,
                feature: true,
                achievement: true,
                locked: !achievement.earned,
                bought: achievement.earned
            }"
        >
            <component v-if="display" :is="display" />
            <branch-node :branches="achievement.branches" :id="id" featureType="achievement" />
        </div>
    </tooltip>
</template>

<script lang="ts">
import { layers } from "@/game/layers";
import { CoercableComponent } from "@/typings/component";
import { Achievement } from "@/typings/features/achievement";
import { coerceComponent, InjectLayerMixin } from "@/util/vue";
import { Component, defineComponent } from "vue";

export default defineComponent({
    name: "achievement",
    mixins: [InjectLayerMixin],
    props: {
        id: {
            type: [Number, String],
            required: true
        }
    },
    computed: {
        achievement(): Achievement {
            return layers[this.layer].achievements!.data[this.id];
        },
        style(): Array<Partial<CSSStyleDeclaration> | undefined> {
            return [
                layers[this.layer].componentStyles?.achievement,
                this.achievement.style,
                this.achievement.image && this.achievement.earned
                    ? {
                          backgroundImage: `url(${this.achievement.image}`
                      }
                    : undefined
            ];
        },
        display(): Component | string {
            if (this.achievement.display) {
                return coerceComponent(this.achievement.display, "h3");
            }
            return coerceComponent(this.achievement.name!, "h3");
        },
        tooltip(): CoercableComponent {
            if (this.achievement.earned) {
                return this.achievement.doneTooltip || this.achievement.tooltip || "You did it!";
            }
            return this.achievement.goalTooltip || this.achievement.tooltip || "LOCKED";
        }
    }
});
</script>

<style scoped>
.achievement {
    height: 90px;
    width: 90px;
    font-size: 10px;
    color: white;
    text-shadow: 0 0 2px #000000;
}
</style>
