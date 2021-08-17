<template>
    <button
        @click="$emit('selectTab')"
        class="tabButton"
        :style="style"
        :class="{
            notify: options.notify,
            resetNotify: options.resetNotify,
            floating,
            activeTab
        }"
    >
        {{ text }}
    </button>
</template>

<script lang="ts">
import themes from "@/data/themes";
import { layers } from "@/game/layers";
import player from "@/game/player";
import { Subtab } from "@/typings/features/subtab";
import { InjectLayerMixin } from "@/util/vue";
import { defineComponent, PropType } from "vue";

export default defineComponent({
    name: "tab-button",
    mixins: [InjectLayerMixin],
    props: {
        text: String,
        options: {
            type: Object as PropType<Subtab>,
            required: true
        },
        activeTab: Boolean
    },
    emits: ["selectTab"],
    computed: {
        floating(): boolean {
            return themes[player.theme].floatingTabs;
        },
        style(): Array<Partial<CSSStyleDeclaration> | undefined> {
            return [
                this.floating || this.activeTab
                    ? {
                          borderColor: layers[this.layer].color
                      }
                    : undefined,
                layers[this.layer].componentStyles?.["tab-button"],
                this.options.resetNotify && this.options.glowColor
                    ? {
                          boxShadow: this.floating
                              ? `-2px -4px 4px rgba(0, 0, 0, 0) inset, 0 0 8px ${this.options.glowColor}`
                              : `0px 10px 7px -10px ${this.options.glowColor}`
                      }
                    : undefined,
                this.options.notify && this.options.glowColor
                    ? {
                          boxShadow: this.floating
                              ? `-2px -4px 4px rgba(0, 0, 0, 0) inset, 0 0 20px ${this.options.glowColor}`
                              : `0px 15px 7px -10px ${this.options.glowColor}`
                      }
                    : undefined,
                this.options.buttonStyle
            ];
        }
    }
});
</script>

<style scoped>
.tabButton {
    background-color: transparent;
    color: var(--color);
    font-size: 20px;
    cursor: pointer;
    padding: 5px 20px;
    margin: 5px;
    border-radius: 5px;
    border: 2px solid;
    flex-shrink: 0;
}

.tabButton:hover {
    transform: scale(1.1, 1.1);
    text-shadow: 0 0 7px var(--color);
}

.tabButton:not(.floating) {
    height: 50px;
    margin: 0;
    border-left: none;
    border-right: none;
    border-top: none;
    border-bottom-width: 4px;
    border-radius: 0;
    transform: unset;
}

.tabButton:not(.floating):not(.activeTab) {
    border-bottom-color: transparent;
}
</style>
