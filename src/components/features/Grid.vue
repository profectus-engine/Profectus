<template>
    <div v-if="grid" class="table">
        <div v-for="row in grid.rows" class="row" :key="row">
            <div v-for="col in grid.cols" :key="col">
                <grid-cell class="align" :id="id" :cell="row * 100 + col" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { layers } from "@/game/layers";
import { Grid } from "@/typings/features/grid";
import { InjectLayerMixin } from "@/util/vue";
import { defineComponent } from "vue";

export default defineComponent({
    name: "grid",
    mixins: [InjectLayerMixin],
    props: {
        id: {
            type: [Number, String],
            required: true
        }
    },
    computed: {
        grid(): Grid {
            return layers[this.layer].grids!.data[this.id];
        }
    }
});
</script>

<style scoped></style>
