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
import { Visibility } from "@/features/feature";
import { GridCell } from "@/features/grid";
import { defineComponent, PropType } from "vue";
import GridCellVue from "./GridCell.vue";

export default defineComponent({
    props: {
        visibility: {
            type: Object as PropType<Visibility>,
            required: true
        },
        rows: {
            type: Number,
            required: true
        },
        cols: {
            type: Number,
            required: true
        },
        cells: {
            type: Object as PropType<Record<string, GridCell>>,
            required: true
        }
    },
    setup() {
        return { GridCell: GridCellVue, Visibility };
    }
});
</script>
