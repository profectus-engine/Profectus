<template>
    <div v-if="filteredChallenges" class="table">
        <template v-if="filteredChallenges.rows && filteredChallenges.cols">
            <div v-for="row in filteredChallenges.rows" class="row" :key="row">
                <div v-for="col in filteredChallenges.cols" :key="col">
                    <challenge
                        v-if="filteredChallenges[row * 10 + col] !== undefined"
                        :id="row * 10 + col"
                    />
                </div>
            </div>
        </template>
        <row v-else>
            <challenge v-for="(challenge, id) in filteredChallenges" :key="id" :id="id" />
        </row>
    </div>
</template>

<script lang="ts">
import { layers } from "@/game/layers";
import { Challenge } from "@/typings/features/challenge";
import { getFiltered, InjectLayerMixin } from "@/util/vue";
import { defineComponent, PropType } from "vue";

export default defineComponent({
    name: "challenges",
    mixins: [InjectLayerMixin],
    props: {
        challenges: {
            type: Object as PropType<Array<string>>
        }
    },
    computed: {
        filteredChallenges(): Record<string, Challenge> {
            return getFiltered(layers[this.layer].challenges!.data, this.challenges);
        }
    }
});
</script>

<style scoped></style>
