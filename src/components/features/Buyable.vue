<template>
    <div v-if="buyable.unlocked" style="display: grid">
        <button
            :style="style"
            @click="buyable.buy"
            @mousedown="start"
            @mouseleave="stop"
            @mouseup="stop"
            @touchstart="start"
            :class="{
                feature: true,
                [layer]: true,
                buyable: true,
                can: buyable.canBuy,
                locked: !buyable.canAfford,
                bought
            }"
            @touchend="stop"
            @touchcancel="stop"
            :disabled="!buyable.canBuy"
        >
            <div v-if="title">
                <component :is="title" />
            </div>
            <component :is="display" style="white-space: pre-line;" />
            <mark-node :mark="buyable.mark" />
            <branch-node :branches="buyable.branches" :id="id" featureType="buyable" />
        </button>
        <div
            v-if="
                (buyable.sellOne !== undefined && buyable.canSellOne !== false) ||
                    (buyable.sellAll !== undefined && buyable.canSellAll !== false)
            "
            style="width: 100%"
        >
            <button
                @click="buyable.sellAll"
                v-if="buyable.sellAll !== undefined && buyable.canSellAll !== false"
                :class="{
                    'buyable-button': true,
                    can: buyable.unlocked,
                    locked: !buyable.unlocked,
                    feature: true
                }"
                :style="{ 'background-color': buyable.canSellAll ? layerColor : '' }"
            >
                Sell All
            </button>
            <button
                @click="buyable.sellOne"
                v-if="buyable.sellOne !== undefined && buyable.canSellOne !== false"
                :class="{
                    'buyable-button': true,
                    can: buyable.unlocked,
                    locked: !buyable.unlocked,
                    feature: true
                }"
                :style="{ 'background-color': buyable.canSellOne ? layerColor : '' }"
            >
                Sell One
            </button>
        </div>
    </div>
</template>

<script lang="ts">
import { layers } from "@/game/layers";
import player from "@/game/player";
import { Buyable } from "@/typings/features/buyable";
import { coerceComponent, InjectLayerMixin } from "@/util/vue";
import { Component, defineComponent } from "vue";

export default defineComponent({
    name: "buyable",
    mixins: [InjectLayerMixin],
    props: {
        id: {
            type: [Number, String],
            required: true
        },
        size: Number
    },
    data() {
        return {
            interval: null,
            time: 0
        } as {
            interval: number | null;
            time: number;
        };
    },
    computed: {
        buyable(): Buyable {
            return layers[this.layer].buyables!.data[this.id];
        },
        bought(): boolean {
            return player.layers[this.layer].buyables[this.id].gte(this.buyable.purchaseLimit);
        },
        style(): Array<Partial<CSSStyleDeclaration> | undefined> {
            return [
                this.buyable.canBuy ? { backgroundColor: layers[this.layer].color } : undefined,
                this.size ? { height: this.size + "px", width: this.size + "px" } : undefined,
                layers[this.layer].componentStyles?.buyable,
                this.buyable.style
            ];
        },
        title(): Component | string | null {
            if (this.buyable.title) {
                return coerceComponent(this.buyable.title, "h2");
            }
            return null;
        },
        display(): Component | string {
            return coerceComponent(this.buyable.display, "div");
        },
        layerColor(): string {
            return layers[this.layer].color;
        }
    },
    methods: {
        start() {
            if (!this.interval) {
                this.interval = setInterval(this.buyable.buy, 250);
            }
        },
        stop() {
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = null;
                this.time = 0;
            }
        }
    }
});
</script>

<style scoped>
.buyable {
    min-height: 200px;
    width: 200px;
    font-size: 10px;
}

.buyable-button {
    width: calc(100% - 10px);
}
</style>
