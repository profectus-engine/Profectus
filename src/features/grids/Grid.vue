<template>
    <div
        v-if="isVisible(visibility)"
        :style="{
            visibility: isHidden(visibility) ? 'hidden' : undefined
        }"
        class="table-grid"
    >
        <div v-for="row in unref(rows)" class="row-grid" :class="{ mergeAdjacent }" :key="row">
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
import { isHidden, isVisible, Visibility } from "features/feature";
import type { GridCell } from "features/grids/grid";
import settings from "game/settings";
import { processedPropType } from "util/vue";
import { computed, defineComponent, unref } from "vue";
import GridCellVue from "./GridCell.vue";

export default defineComponent({
    props: {
        visibility: {
            type: processedPropType<Visibility | boolean>(Number, Boolean),
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

        return { unref, gatherCellProps, Visibility, mergeAdjacent, isVisible, isHidden };
    }
});
</script>
