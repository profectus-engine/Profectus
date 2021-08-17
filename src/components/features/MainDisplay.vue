<template>
    <div>
        <span v-if="showPrefix">You have </span>
        <resource :amount="amount" :color="color" />
        {{ resource
        }}<!-- remove whitespace -->
        <span v-if="effectDisplay">, <component :is="effectDisplay"/></span>
        <br /><br />
    </div>
</template>

<script lang="ts">
import { layers } from "@/game/layers";
import player from "@/game/player";
import { format, formatWhole } from "@/util/bignum";
import { coerceComponent, InjectLayerMixin } from "@/util/vue";
import { Component, defineComponent } from "vue";

export default defineComponent({
    name: "main-display",
    mixins: [InjectLayerMixin],
    props: {
        precision: Number
    },
    computed: {
        style(): Partial<CSSStyleDeclaration> | undefined {
            return layers[this.layer].componentStyles?.["main-display"];
        },
        resource(): string {
            return layers[this.layer].resource;
        },
        effectDisplay(): Component | string | undefined {
            return (
                layers[this.layer].effectDisplay &&
                coerceComponent(layers[this.layer].effectDisplay!)
            );
        },
        showPrefix(): boolean {
            return player.layers[this.layer].points.lt("1e1000");
        },
        color(): string {
            return layers[this.layer].color;
        },
        amount(): string {
            return this.precision == undefined
                ? formatWhole(player.layers[this.layer].points)
                : format(player.layers[this.layer].points, this.precision);
        }
    }
});
</script>

<style scoped></style>
