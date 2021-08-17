<template>
    <div class="resource-display" :class="{ empty }">
        <div v-if="baseAmount != undefined && baseResource != undefined">
            You have {{ baseAmount }} {{ baseResource }}
        </div>
        <div v-if="passiveGeneration != undefined">
            You are gaining {{ passiveGeneration }} {{ resource }} per second
        </div>
        <spacer
            v-if="
                (baseAmount != undefined || passiveGeneration != undefined) &&
                    (best != undefined || total != undefined)
            "
        />
        <div v-if="best != undefined">Your best {{ resource }} is {{ best }}</div>
        <div v-if="total != undefined">You have made a total of {{ total }} {{ resource }}</div>
    </div>
</template>

<script lang="ts">
import { layers } from "@/game/layers";
import player from "@/game/player";
import { DecimalSource } from "@/lib/break_eternity";
import Decimal, { formatWhole } from "@/util/bignum";
import { InjectLayerMixin } from "@/util/vue";
import { defineComponent } from "vue";

export default defineComponent({
    name: "resource-display",
    mixins: [InjectLayerMixin],
    computed: {
        baseAmount(): string | null {
            return layers[this.layer].baseAmount
                ? formatWhole(layers[this.layer].baseAmount!)
                : null;
        },
        baseResource(): string | undefined {
            return layers[this.layer].baseResource;
        },
        passiveGeneration(): string | null {
            return layers[this.layer].passiveGeneration
                ? formatWhole(
                      Decimal.times(
                          layers[this.layer].resetGain,
                          layers[this.layer].passiveGeneration === true
                              ? 1
                              : (layers[this.layer].passiveGeneration as DecimalSource)
                      )
                  )
                : null;
        },
        resource(): string {
            return layers[this.layer].resource;
        },
        best(): string | null {
            return player.layers[this.layer].best
                ? formatWhole(player.layers[this.layer].best as Decimal)
                : null;
        },
        total(): string | null {
            return player.layers[this.layer].total
                ? formatWhole(player.layers[this.layer].total as Decimal)
                : null;
        },
        empty(): boolean {
            return !(this.baseAmount || this.passiveGeneration || this.best || this.total);
        }
    }
});
</script>

<style scoped>
.resource-display:not(.empty) {
    margin: 10px;
}
</style>
