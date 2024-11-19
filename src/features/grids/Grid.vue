<template>
    <div class="table-grid">
        <Cells />
    </div>
</template>

<script setup lang="tsx">
import "components/common/table.css";
import themes from "data/themes";
import type { Grid } from "features/grids/grid";
import settings from "game/settings";
import { render } from "util/vue";
import { computed, unref } from "vue";

const props = defineProps<{
    rows: Grid["rows"];
    cols: Grid["cols"];
    cells: Grid["cells"];
}>();

const mergeAdjacent = computed(() => themes[settings.theme].mergeAdjacent);

const Cells = () => new Array(unref(props.rows)).fill(0).map((_, row) => <div class={{ "row-grid": true, mergeAdjacent: mergeAdjacent.value }}>
    {new Array(unref(props.cols)).map((_, col) => render(props.cells[row][col]))}
    </div>);
</script>
