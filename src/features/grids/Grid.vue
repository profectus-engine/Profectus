<template>
    <div
        v-if="unref(visibility) !== Visibility.None"
        :style="{
            visibility: unref(visibility) === Visibility.Hidden ? 'hidden' : undefined
        }"
        class="table"
    >
        <div v-for="row in unref(rows)" class="row" :class="{ mergeAdjacent }" :key="row">
            <GridCell
                v-for="col in unref(cols)"
                :key="col"
                v-bind="gatherCellProps(unref(cells)[row * 100 + col])"
            />
        </div>
    </div>
</template>

<script lang="ts">
import "components/common/table.css";
import themes from "data/themes";
import { Visibility } from "features/feature";
import { GridCell } from "features/grids/grid";
import settings from "game/settings";
import { processedPropType } from "util/vue";
import { computed, defineComponent, unref } from "vue";
import GridCellVue from "./GridCell.vue";

export default defineComponent({
    props: {
        visibility: {
            type: processedPropType<Visibility>(Number),
            required: true
        },
        rows: {
            type: processedPropType<number>(Number),
            required: true
        },
        cols: {
            type: processedPropType<number>(Number),
            required: true
        },
        cells: {
            type: processedPropType<Record<string, GridCell>>(Object),
            required: true
        }
    },
    components: { GridCell: GridCellVue },
    setup() {
        const mergeAdjacent = computed(() => themes[settings.theme].mergeAdjacent);

        function gatherCellProps(cell: GridCell) {
            const { visibility, onClick, onHold, display, title, style, canClick, id } = cell;
            return { visibility, onClick, onHold, display, title, style, canClick, id };
        }

        return { unref, gatherCellProps, Visibility, mergeAdjacent };
    }
});
</script>
