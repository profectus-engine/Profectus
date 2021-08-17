<template>
    <div v-if="filteredUpgrades" class="table">
        <template v-if="filteredUpgrades.rows && filteredUpgrades.cols">
            <div v-for="row in filteredUpgrades.rows" class="row" :key="row">
                <div v-for="col in filteredUpgrades.cols" :key="col">
                    <upgrade
                        v-if="filteredUpgrades[row * 10 + col] !== undefined"
                        class="align"
                        :id="row * 10 + col"
                    />
                </div>
            </div>
        </template>
        <row v-else>
            <upgrade v-for="(upgrade, id) in filteredUpgrades" :key="id" class="align" :id="id" />
        </row>
    </div>
</template>

<script lang="ts">
import { layers } from "@/game/layers";
import { Upgrade } from "@/typings/features/upgrade";
import { getFiltered, InjectLayerMixin } from "@/util/vue";
import { defineComponent, PropType } from "vue";

export default defineComponent({
    name: "upgrades",
    mixins: [InjectLayerMixin],
    props: {
        upgrades: {
            type: Object as PropType<Array<string>>
        }
    },
    computed: {
        filteredUpgrades(): Record<string, Upgrade> {
            if (layers[this.layer].upgrades) {
                return getFiltered<Upgrade>(layers[this.layer].upgrades!.data, this.upgrades);
            }
            return {};
        }
    }
});
</script>

<style scoped></style>
