<template>
    <span>
        {{ resetDescription }}<b>{{ resetGain }}</b>
        {{ resource }}
        <br v-if="nextAt" /><br v-if="nextAt" />
        {{ nextAt }}
    </span>
</template>

<script lang="ts">
import { layers } from "@/game/layers";
import player from "@/game/player";
import Decimal, { format, formatWhole } from "@/util/bignum";
import { InjectLayerMixin } from "@/util/vue";
import { defineComponent } from "vue";

export default defineComponent({
    name: "default-prestige-button-display",
    mixins: [InjectLayerMixin],
    computed: {
        resetDescription(): string {
            if (player.layers[this.layer].points.lt(1e3) || layers[this.layer].type === "static") {
                return layers[this.layer].resetDescription || "Reset for ";
            }
            return "";
        },
        resetGain(): string {
            return formatWhole(layers[this.layer].resetGain);
        },
        resource(): string {
            return layers[this.layer].resource;
        },
        showNextAt(): boolean {
            if (layers[this.layer].showNextAt != undefined) {
                return layers[this.layer].showNextAt!;
            } else {
                return layers[this.layer].type === "static"
                    ? player.layers[this.layer].points.lt(30) // static
                    : player.layers[this.layer].points.lt(1e3) &&
                          layers[this.layer].resetGain.lt(100); // normal
            }
        },
        nextAt(): string {
            if (this.showNextAt) {
                let prefix;
                if (layers[this.layer].type === "static") {
                    if (
                        Decimal.gte(layers[this.layer].baseAmount!, layers[this.layer].nextAt) &&
                        layers[this.layer].canBuyMax !== false
                    ) {
                        prefix = "Next:";
                    } else {
                        prefix = "Req:";
                    }

                    const baseAmount = formatWhole(layers[this.layer].baseAmount!);
                    const nextAt = (layers[this.layer].roundUpCost ? formatWhole : format)(
                        layers[this.layer].nextAtMax
                    );
                    const baseResource = layers[this.layer].baseResource;

                    return `${prefix} ${baseAmount} / ${nextAt} ${baseResource}`;
                } else {
                    let amount;
                    if (layers[this.layer].roundUpCost) {
                        amount = formatWhole(layers[this.layer].nextAt);
                    } else {
                        amount = format(layers[this.layer].nextAt);
                    }
                    return `Next at ${amount} ${layers[this.layer].baseResource}`;
                }
            }
            return "";
        }
    }
});
</script>

<style scoped></style>
