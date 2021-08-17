<template>
    <div class="infobox" v-if="infobox.unlocked" :style="style" :class="{ collapsed, stacked }">
        <button class="title" :style="titleStyle" @click="toggle">
            <span class="toggle">▼</span>
            <component :is="title" />
        </button>
        <collapse-transition>
            <div v-if="!collapsed" class="body" :style="{ backgroundColor: borderColor }">
                <component :is="body" :style="bodyStyle" />
            </div>
        </collapse-transition>
        <branch-node :branches="infobox.branches" :id="id" featureType="infobox" />
    </div>
</template>

<script lang="ts">
import themes from "@/data/themes";
import { layers } from "@/game/layers";
import player from "@/game/player";
import { Infobox } from "@/typings/features/infobox";
import { coerceComponent, InjectLayerMixin } from "@/util/vue";
import { Component, defineComponent } from "vue";

export default defineComponent({
    name: "infobox",
    mixins: [InjectLayerMixin],
    props: {
        id: {
            type: [Number, String],
            required: true
        }
    },
    computed: {
        infobox(): Infobox {
            return layers[this.layer].infoboxes!.data[this.id];
        },
        borderColor(): string {
            return this.infobox.borderColor || layers[this.layer].color;
        },
        style(): Array<Partial<CSSStyleDeclaration> | undefined> {
            return [
                { borderColor: this.borderColor },
                layers[this.layer].componentStyles?.infobox,
                this.infobox.style
            ];
        },
        titleStyle(): Array<Partial<CSSStyleDeclaration> | undefined> {
            return [
                { backgroundColor: layers[this.layer].color },
                layers[this.layer].componentStyles?.["infobox-title"],
                this.infobox.titleStyle
            ];
        },
        bodyStyle(): Array<Partial<CSSStyleDeclaration> | undefined> {
            return [layers[this.layer].componentStyles?.["infobox-body"], this.infobox.bodyStyle];
        },
        title(): Component | string {
            if (this.infobox.title) {
                return coerceComponent(this.infobox.title);
            }
            return coerceComponent(layers[this.layer].name || this.layer);
        },
        body(): Component | string {
            return coerceComponent(this.infobox.body);
        },
        collapsed(): boolean {
            return player.layers[this.layer].infoboxes[this.id];
        },
        stacked(): boolean {
            return themes[player.theme].stackedInfoboxes;
        }
    },
    methods: {
        toggle() {
            player.layers[this.layer].infoboxes[this.id] = !player.layers[this.layer].infoboxes[
                this.id
            ];
        }
    }
});
</script>

<style scoped>
.infobox {
    position: relative;
    width: 600px;
    max-width: 95%;
    margin-top: 0;
    text-align: left;
    border-style: solid;
    border-width: 0px;
    box-sizing: border-box;
    border-radius: 5px;
}

.infobox.stacked {
    border-width: 4px;
}

.infobox:not(.stacked) + .infobox:not(.stacked) {
    margin-top: 20px;
}

.infobox + :not(.infobox) {
    margin-top: 10px;
}

.title {
    font-size: 24px;
    color: black;
    cursor: pointer;
    border: none;
    padding: 4px;
    width: auto;
    text-align: left;
    padding-left: 30px;
}

.infobox:not(.stacked) .title {
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
}

.infobox.stacked + .infobox.stacked {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    margin-top: -5px;
}

.stacked .title {
    width: 100%;
}

.collapsed:not(.stacked) .title::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 4px;
    background-color: inherit;
}

.toggle {
    position: absolute;
    left: 10px;
}

.collapsed .toggle {
    transform: rotate(-90deg);
}

.body {
    transition-duration: 0.5s;
    border-radius: 5px;
    border-top-left-radius: 0;
}

.infobox:not(.stacked) .body {
    padding: 4px;
}

.body > * {
    padding: 8px;
    width: 100%;
    display: block;
    box-sizing: border-box;
    border-radius: 5px;
    border-top-left-radius: 0;
    background-color: var(--background);
}
</style>
