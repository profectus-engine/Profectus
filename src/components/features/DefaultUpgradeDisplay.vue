<template>
    <span>
        <div v-if="title"><component :is="title" /></div>
        <component :is="description" />
        <div v-if="effectDisplay"><br />Currently: <component :is="effectDisplay" /></div>
        <br />
        Cost: {{ cost }} {{ costResource }}
    </span>
</template>

<script lang="ts">
import { layers } from "@/game/layers";
import { Upgrade } from "@/typings/features/upgrade";
import { formatWhole } from "@/util/bignum";
import { coerceComponent, InjectLayerMixin } from "@/util/vue";
import { Component, defineComponent } from "vue";

export default defineComponent({
    name: "default-upgrade-display",
    mixins: [InjectLayerMixin],
    props: {
        id: {
            type: [Number, String],
            required: true
        }
    },
    computed: {
        upgrade(): Upgrade {
            return layers[this.layer].upgrades!.data[this.id];
        },
        title(): Component | string | null {
            if (this.upgrade.title) {
                return coerceComponent(this.upgrade.title, "h3");
            }
            return null;
        },
        description(): Component | string {
            return coerceComponent(this.upgrade.description, "div");
        },
        effectDisplay(): Component | string | null {
            if (this.upgrade.effectDisplay) {
                return coerceComponent(this.upgrade.effectDisplay);
            }
            return null;
        },
        cost(): string {
            return formatWhole(this.upgrade.cost);
        },
        costResource(): string {
            return this.upgrade.currencyDisplayName || layers[this.layer].resource;
        }
    }
});
</script>

<style scoped></style>
