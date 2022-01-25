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

<script lang="ts">
import { FeatureComponent, Visibility } from "@/features/feature";
import { GenericGrid } from "@/features/grid";
import { defineComponent } from "vue";
import GridCell from "./GridCell.vue";

// https://github.com/thepaperpilot/The-Modding-Tree-X/issues/1
export default defineComponent(function Grid(props: FeatureComponent<GenericGrid>) {
    return { ...props, GridCell, Visibility };
});
</script>
