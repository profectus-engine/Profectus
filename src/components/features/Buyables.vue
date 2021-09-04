<template>
    <div v-if="filtered" class="table">
        <respec-button
            v-if="showRespec"
            style="margin-bottom: 12px;"
            :confirmRespec="confirmRespec"
            :respecWarningDisplay="respecWarningDisplay"
            @set-confirm-respec="setConfirmRespec"
            @respec="respec"
        />
        <template v-if="rows && cols">
            <div v-for="row in rows" class="row" :key="row">
                <div v-for="col in cols" :key="col">
                    <buyable
                        v-if="filtered[row * 10 + col] !== undefined"
                        class="align buyable-container"
                        :style="{ height }"
                        :id="row * 10 + col"
                        :size="height === 'inherit' ? null : height"
                    />
                </div>
            </div>
        </template>
        <row v-else>
            <buyable
                v-for="(buyable, id) in filtered"
                :key="id"
                class="align buyable-container"
                :style="{ height }"
                :id="id"
                :size="height === 'inherit' ? null : height"
            />
        </row>
    </div>
</template>

<script lang="ts">
import { layers } from "@/game/layers";
import player from "@/game/player";
import { CoercableComponent } from "@/typings/component";
import { Buyable } from "@/typings/features/buyable";
import { FilteredFeaturesMixin, InjectLayerMixin } from "@/util/vue";
import { defineComponent } from "vue";

export default defineComponent({
    name: "buyables",
    mixins: [InjectLayerMixin, FilteredFeaturesMixin<Buyable>("buyables")],
    props: {
        height: {
            type: [Number, String],
            default: "inherit"
        }
    },
    computed: {
        showRespec(): boolean | undefined {
            return layers[this.layer].buyables!.showRespecButton;
        },
        confirmRespec(): boolean {
            return player.layers[this.layer].confirmRespecBuyables;
        },
        respecWarningDisplay(): CoercableComponent | undefined {
            return layers[this.layer].buyables?.respecWarningDisplay;
        }
    },
    methods: {
        setConfirmRespec(value: boolean) {
            player.layers[this.layer].confirmRespecBuyables = value;
        },
        respec() {
            layers[this.layer].buyables!.respec?.();
        }
    }
});
</script>

<style scoped>
.buyable-container {
    margin-left: 7px;
    margin-right: 7px;
}
</style>
