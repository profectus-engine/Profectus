<template>
    <div v-if="filtered" class="table">
        <template v-if="rows && cols">
            <div v-for="row in rows" class="row" :key="row">
                <div v-for="col in cols" :key="col">
                    <upgrade
                        v-if="filtered[row * 10 + col] !== undefined"
                        class="align"
                        :id="row * 10 + col"
                    />
                </div>
            </div>
        </template>
        <row v-else>
            <upgrade v-for="(upgrade, id) in filtered" :key="id" class="align" :id="id" />
        </row>
    </div>
</template>

<script lang="ts">
import { Upgrade } from "@/typings/features/upgrade";
import { FilteredFeaturesMixin, InjectLayerMixin } from "@/util/vue";
import { defineComponent } from "vue";

export default defineComponent({
    name: "upgrades",
    mixins: [InjectLayerMixin, FilteredFeaturesMixin<Upgrade>("upgrades")]
});
</script>

<style scoped></style>
