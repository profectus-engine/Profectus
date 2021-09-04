<template>
    <div v-if="filtered" class="table">
        <template v-if="rows && cols">
            <div v-for="row in rows" class="row" :key="row">
                <div v-for="col in cols" :key="col">
                    <achievement
                        v-if="filtered[row * 10 + col] !== undefined"
                        class="align"
                        :id="row * 10 + col"
                    />
                </div>
            </div>
        </template>
        <row v-else>
            <achievement v-for="(achievement, id) in filtered" :key="id" :id="id" />
        </row>
    </div>
</template>

<script lang="ts">
import { Achievement } from "@/typings/features/achievement";
import { FilteredFeaturesMixin, InjectLayerMixin } from "@/util/vue";
import { defineComponent } from "vue";

export default defineComponent({
    name: "achievements",
    mixins: [InjectLayerMixin, FilteredFeaturesMixin<Achievement>("achievements")]
});
</script>

<style scoped></style>
