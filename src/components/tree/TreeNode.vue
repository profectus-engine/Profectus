<template>
    <tooltip
        :display="tooltip"
        :force="forceTooltip"
        :class="{
            ghost: layer.layerShown === 'ghost',
            treeNode: true,
            [id]: true,
            hidden: !layer.layerShown,
            locked: !unlocked,
            notify: layer.notify && unlocked,
            resetNotify: layer.resetNotify,
            can: unlocked,
            small
        }"
    >
        <LayerProvider :index="tab.index" :layer="id">
            <button v-if="layer.shown" @click="clickTab" :style="style" :disabled="!unlocked">
                <component :is="display" />
                <branch-node :branches="layer.branches" :id="id" featureType="tree-node" />
            </button>
            <mark-node :mark="layer.mark" />
        </LayerProvider>
    </tooltip>
</template>

<script lang="ts">
import { layers } from "@/game/layers";
import player from "@/game/player";
import { CoercableComponent } from "@/typings/component";
import { Layer } from "@/typings/layer";
import { coerceComponent } from "@/util/vue";
import { Component, defineComponent } from "vue";

export default defineComponent({
    name: "tree-node",
    props: {
        id: {
            type: [String, Number],
            required: true
        },
        small: Boolean,
        append: Boolean
    },
    emits: ["show-modal"],
    inject: ["tab"],
    computed: {
        layer(): Layer {
            return layers[this.id];
        },
        unlocked(): boolean {
            if (this.layer.canClick != undefined) {
                return this.layer.canClick;
            }
            return this.layer.unlocked;
        },
        style(): Array<Partial<CSSStyleDeclaration> | undefined> {
            return [
                this.unlocked ? { backgroundColor: this.layer.color } : undefined,
                this.layer.notify && this.unlocked
                    ? {
                          boxShadow: `-4px -4px 4px rgba(0, 0, 0, 0.25) inset, 0 0 20px ${this.layer.trueGlowColor}`
                      }
                    : undefined,
                this.layer.nodeStyle
            ];
        },
        display(): Component | string {
            if (this.layer.display != undefined) {
                return coerceComponent(this.layer.display);
            } else if (this.layer.image != undefined) {
                return coerceComponent(`<img src=${this.layer.image}/>`);
            } else {
                return coerceComponent(this.layer.symbol);
            }
        },
        forceTooltip(): boolean {
            return player.layers[this.id].forceTooltip === true;
        },
        tooltip(): CoercableComponent {
            if (this.layer.canClick != undefined) {
                if (this.layer.canClick) {
                    return this.layer.tooltip || "I am a button!";
                } else {
                    return this.layer.tooltipLocked || this.layer.tooltip || "I am a button!";
                }
            }
            if (player.layers[this.id].unlocked) {
                return (
                    this.layer.tooltip ||
                    `{{ formatWhole(player.${this.id}.points) }} {{ layers.${this.id}.resource }}`
                );
            } else {
                return (
                    this.layer.tooltipLocked ||
                    `Reach {{ formatWhole(layers.${this.id}.requires) }} {{ layers.${this.id}.baseResource }} to unlock (You have {{ formatWhole(layers.${this.id}.baseAmount) }} {{ layers.${this.id}.baseResource }})`
                );
            }
        }
    },
    methods: {
        clickTab(e: MouseEvent) {
            if (e.shiftKey) {
                player.layers[this.id].forceTooltip = !player.layers[this.id].forceTooltip;
            } else if (this.layer.click != undefined) {
                this.layer.click();
            } else if (this.layer.modal) {
                this.$emit("show-modal", this.id);
            } else if (this.append) {
                if (player.tabs.includes(this.id.toString())) {
                    const index = player.tabs.lastIndexOf(this.id.toString());
                    player.tabs = [...player.tabs.slice(0, index), ...player.tabs.slice(index + 1)];
                } else {
                    player.tabs = [...player.tabs, this.id.toString()];
                }
            } else {
                player.tabs = [
                    ...player.tabs.slice(
                        0,
                        ((this as unknown) as { tab: { index: number } }).tab.index + 1
                    ),
                    this.id.toString()
                ];
            }
        }
    }
});
</script>

<style scoped>
.treeNode {
    height: 100px;
    width: 100px;
    border-radius: 50%;
    padding: 0;
    margin: 0 10px 0 10px;
}

.treeNode button {
    width: 100%;
    height: 100%;
    border: 2px solid rgba(0, 0, 0, 0.125);
    border-radius: inherit;
    font-size: 40px;
    color: rgba(0, 0, 0, 0.5);
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.25);
    box-shadow: -4px -4px 4px rgba(0, 0, 0, 0.25) inset, 0px 0px 20px var(--background);
    text-transform: capitalize;
}

.treeNode.small {
    height: 60px;
    width: 60px;
}

.treeNode.small button {
    font-size: 30px;
}

.ghost {
    visibility: hidden;
    pointer-events: none;
}
</style>
