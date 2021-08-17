<template>
    <div v-if="microtabs" class="microtabs">
        <LayerProvider :layer="layer" :index="tab.index">
            <div v-if="microtabs" class="tabs" :class="{ floating }">
                <tab-button
                    v-for="(microtab, id) in microtabs"
                    @selectTab="selectMicrotab(id)"
                    :key="id"
                    :activeTab="id === activeMicrotab?.id"
                    :options="microtab"
                    :text="id"
                />
            </div>
            <template v-if="activeMicrotab">
                <layer-tab v-if="embed" :layer="embed" />
                <component v-else :is="display" />
            </template>
        </LayerProvider>
    </div>
</template>

<script lang="ts">
import themes from "@/data/themes";
import { layers } from "@/game/layers";
import player from "@/game/player";
import { Microtab, MicrotabFamily } from "@/typings/features/subtab";
import { coerceComponent, InjectLayerMixin } from "@/util/vue";
import { Component, defineComponent } from "vue";

export default defineComponent({
    name: "microtab",
    mixins: [InjectLayerMixin],
    props: {
        family: {
            type: String,
            required: true
        },
        id: {
            type: String,
            required: true
        }
    },
    computed: {
        floating() {
            return themes[player.theme].floatingTabs;
        },
        tabFamily(): MicrotabFamily {
            return layers[this.layer].microtabs![this.family];
        },
        microtabs(): Record<string, Microtab> {
            return Object.keys(this.tabFamily.data)
                .filter(
                    microtab =>
                        microtab !== "activeMicrotab" &&
                        this.tabFamily.data[microtab].isProxy &&
                        this.tabFamily.data[microtab].unlocked !== false
                )
                .reduce((acc: Record<string, Microtab>, curr) => {
                    acc[curr] = this.tabFamily.data[curr];
                    return acc;
                }, {});
        },
        activeMicrotab(): Microtab | undefined {
            return this.id != undefined
                ? this.tabFamily.data[this.id]
                : this.tabFamily.activeMicrotab;
        },
        embed(): string | undefined {
            return this.activeMicrotab!.embedLayer;
        },
        display(): Component | string | undefined {
            return this.activeMicrotab!.display && coerceComponent(this.activeMicrotab!.display!);
        }
    },
    methods: {
        selectMicrotab(tab: string) {
            player.subtabs[this.layer][this.family] = tab;
        }
    }
});
</script>

<style scoped>
.microtabs {
    margin: var(--feature-margin) -11px;
    position: relative;
    border: solid 4px var(--separator);
}

.tabs:not(.floating) {
    text-align: left;
    border-bottom: inherit;
    border-width: 4px;
    box-sizing: border-box;
    height: 50px;
}
</style>

<style>
.microtabs .sticky {
    margin-left: unset !important;
    margin-right: unset !important;
}
</style>
