<template>
    <div v-if="filteredClickables" class="table">
        <master-button v-if="showMaster" style="margin-bottom: 12px;" @press="press" />
        <template v-if="filteredClickables.rows && filteredClickables.cols">
            <div v-for="row in filteredClickables.rows" class="row" :key="row">
                <div v-for="col in filteredClickables.cols" :key="col">
                    <clickable
                        v-if="filteredClickables[row * 10 + col] !== undefined"
                        class="align clickable-container"
                        :style="{ height }"
                        :id="row * 10 + col"
                        :size="height === 'inherit' ? null : height"
                    />
                </div>
            </div>
        </template>
        <row v-else>
            <clickable
                v-for="(clickable, id) in filteredClickables"
                :key="id"
                class="align clickable-container"
                :style="{ height }"
                :id="id"
                :size="height === 'inherit' ? null : height"
            />
        </row>
    </div>
</template>

<script lang="ts">
import { Clickable } from "@/typings/features/clickable";
import { defineComponent, PropType } from "vue";
import { layers } from "@/game/layers";
import { getFiltered, InjectLayerMixin } from "@/util/vue";

export default defineComponent({
    name: "clickables",
    mixins: [InjectLayerMixin],
    props: {
        achievements: {
            type: Object as PropType<Array<string>>
        },
        showMasterButton: {
            type: Boolean,
            default: null
        },
        height: {
            type: [Number, String],
            default: "inherit"
        }
    },
    computed: {
        filteredClickables(): Record<string, Clickable> {
            return getFiltered(layers[this.layer].clickables!.data, this.clickables);
        },
        showMaster(): boolean | undefined {
            if (layers[this.layer].clickables?.masterButtonClick == undefined) {
                return false;
            }
            if (this.showMasterButton != undefined) {
                return this.showMasterButton;
            }
            return layers[this.layer].clickables?.showMasterButton;
        }
    },
    methods: {
        press() {
            layers[this.layer].clickables?.masterButtonClick?.();
        }
    }
});
</script>

<style scoped>
.clickable-container {
    margin-left: 7px;
    margin-right: 7px;
}
</style>
