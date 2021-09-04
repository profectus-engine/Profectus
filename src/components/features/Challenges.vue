<template>
    <div v-if="filtered" class="table">
        <template v-if="rows && cols">
            <div v-for="row in rows" class="row" :key="row">
                <div v-for="col in cols" :key="col">
                    <challenge v-if="filtered[row * 10 + col] !== undefined" :id="row * 10 + col" />
                </div>
            </div>
        </template>
        <row v-else>
            <challenge v-for="(challenge, id) in filtered" :key="id" :id="id" />
        </row>
    </div>
</template>

<script lang="ts">
import { Challenge } from "@/typings/features/challenge";
import { FilteredFeaturesMixin, InjectLayerMixin } from "@/util/vue";
import { defineComponent } from "vue";

export default defineComponent({
    name: "challenges",
    mixins: [InjectLayerMixin, FilteredFeaturesMixin<Challenge>("challenges")]
});
</script>

<style scoped></style>
