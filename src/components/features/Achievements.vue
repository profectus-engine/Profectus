<template>
    <div v-if="filteredAchievements" class="table">
        <template v-if="filteredAchievements.rows && filteredAchievements.cols">
            <div v-for="row in filteredAchievements.rows" class="row" :key="row">
                <div v-for="col in filteredAchievements.cols" :key="col">
                    <achievement
                        v-if="filteredAchievements[row * 10 + col] !== undefined"
                        class="align"
                        :id="row * 10 + col"
                    />
                </div>
            </div>
        </template>
        <template v-frag v-else>
            <achievement v-for="(achievement, id) in filteredAchievements" :key="id" :id="id" />
        </template>
    </div>
</template>

<script lang="ts">
import { layers } from "@/game/layers";
import { Achievement } from "@/typings/features/achievement";
import { getFiltered, InjectLayerMixin } from "@/util/vue";
import { defineComponent, PropType } from "vue";

export default defineComponent({
    name: "achievements",
    mixins: [InjectLayerMixin],
    props: {
        achievements: {
            type: Object as PropType<Array<string>>
        }
    },
    computed: {
        filteredAchievements(): Record<string, Achievement> {
            if (layers[this.layer].achievements) {
                return getFiltered<Achievement>(
                    layers[this.layer].achievements!.data,
                    this.achievements
                );
            }
            return {};
        }
    }
});
</script>

<style scoped></style>
