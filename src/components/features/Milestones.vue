<template>
    <div v-if="filtered" class="table">
        <milestone v-for="(milestone, id) in filtered" :key="id" :id="id" />
    </div>
</template>

<script lang="ts">
import { Milestone } from "@/typings/features/milestone";
import { FilteredFeaturesMixin, InjectLayerMixin } from "@/util/vue";
import { defineComponent } from "vue";

export default defineComponent({
    name: "milestones",
    mixins: [InjectLayerMixin, FilteredFeaturesMixin<Milestone>("milestones")]
});
</script>

<style scoped></style>
