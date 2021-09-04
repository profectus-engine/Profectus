<template>
    <div v-if="filtered != undefined" class="table">
        <master-button v-if="showMaster" style="margin-bottom: 12px;" @press="press" />
        <template v-if="rows && cols">
            <div v-for="row in rows" class="row" :key="row">
                <div v-for="col in cols" :key="col">
                    <clickable
                        v-if="filtered[row * 10 + col] !== undefined"
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
                v-for="(clickable, id) in filtered"
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
import { layers } from "@/game/layers";
import { Clickable } from "@/typings/features/clickable";
import { FilteredFeaturesMixin, InjectLayerMixin } from "@/util/vue";
import { defineComponent } from "vue";

export default defineComponent({
    name: "clickables",
    mixins: [InjectLayerMixin, FilteredFeaturesMixin<Clickable>("clickables")],
    props: {
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
