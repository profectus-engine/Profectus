<template>
    <div v-if="filteredMilestones" class="table">
        <milestone v-for="(milestone, id) in filteredMilestones" :key="id" :id="id" />
    </div>
</template>

<script lang="ts">
import { layers } from "@/game/layers";
import { Milestone } from "@/typings/features/milestone";
import { getFiltered, InjectLayerMixin } from "@/util/vue";
import { defineComponent, PropType } from "vue";

export default defineComponent({
    name: "milestones",
    mixins: [InjectLayerMixin],
    props: {
        milestones: {
            type: Object as PropType<Array<string>>
        }
    },
    computed: {
        filteredMilestones(): Record<string, Milestone> {
            if (layers[this.layer].milestones) {
                return getFiltered<Milestone>(layers[this.layer].milestones!.data, this.milestones);
            }
            return {};
        }
    }
});
</script>

<style scoped></style>
