<template>
    <div v-if="filteredBuyables" class="table">
        <respec-button
            v-if="showRespec"
            style="margin-bottom: 12px;"
            :confirmRespec="confirmRespec"
            :respecWarningDisplay="respecWarningDisplay"
            @set-confirm-respec="setConfirmRespec"
            @respec="respec"
        />
        <template v-if="filteredBuyables.rows && filteredBuyables.cols">
            <div v-for="row in filteredBuyables.rows" class="row" :key="row">
                <div v-for="col in filteredBuyables.cols" :key="col">
                    <buyable
                        v-if="filteredBuyables[row * 10 + col] !== undefined"
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
                v-for="(buyable, id) in filteredBuyables"
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
import { getFiltered, InjectLayerMixin } from "@/util/vue";
import { defineComponent, PropType } from "vue";

export default defineComponent({
    name: "buyables",
    mixins: [InjectLayerMixin],
    props: {
        buyables: {
            type: Object as PropType<Array<string>>
        },
        height: {
            type: [Number, String],
            default: "inherit"
        }
    },
    computed: {
        filteredBuyables(): Record<string, Buyable> {
            if (layers[this.layer].buyables) {
                return getFiltered<Buyable>(layers[this.layer].buyables!.data, this.buyables);
            }
            return {};
        },
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
