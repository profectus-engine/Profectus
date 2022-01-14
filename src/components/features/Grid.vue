<template>
    <div
        v-if="visibility !== Visibility.None"
        v-show="visibility === Visibility.Visible"
        class="table"
    >
        <div v-for="row in rows" class="row" :key="row">
            <div v-for="col in cols" :key="col">
                <GridCell v-bind="cells[row * 100 + col]" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { FeatureComponent, Visibility } from "@/features/feature";
import { GenericGrid } from "@/features/grid";
import GridCell from "./GridCell.vue";

defineProps<FeatureComponent<GenericGrid>>();
</script>

<style scoped></style>
