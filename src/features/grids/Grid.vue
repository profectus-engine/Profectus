<template>
    <div
        v-if="isVisible(visibility)"
        :style="{
            visibility: isHidden(visibility) ? 'hidden' : undefined
        }"
        class="table-grid"
    >
        <div v-for="row in unref(rows)" class="row-grid" :class="{ mergeAdjacent }" :key="row">
            <GridCellVue
                v-for="col in unref(cols)"
                :key="col"
                v-bind="gatherCellProps(unref(cells)[row * 100 + col])"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import "components/common/table.css";
import themes from "data/themes";
import { isHidden, isVisible, Visibility } from "features/feature";
import type { GridCell } from "features/grids/grid";
import settings from "game/settings";
import { computed, unref } from "vue";
import GridCellVue from "./GridCell.vue";

defineProps<{
    visibility: Visibility | boolean;
    rows: number;
    cols: number;
    cells: Record<string, GridCell>;
}>();

const mergeAdjacent = computed(() => themes[settings.theme].mergeAdjacent);

function gatherCellProps(cell: GridCell) {
    const { visibility, onClick, onHold, display, title, style, canClick, id } = cell;
    return { visibility, onClick, onHold, display, title, style, canClick, id };
}
</script>
