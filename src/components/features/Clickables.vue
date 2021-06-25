<template>
	<div v-if="filteredClickables" class="table">
		<master-button v-if="showMasterButton" style="margin-bottom: 12px;" @press="press" />
		<div v-frag v-if="filteredClickables.rows && filteredClickables.cols">
			<div v-for="row in filteredClickables.rows" class="row" :key="row">
				<div v-for="col in filteredClickables.cols" :key="col">
					<clickable v-if="filteredClickables[row * 10 + col] !== undefined" class="align clickable-container"
						:style="{ height }" :id="row * 10 + col" :size="height === 'inherit' ? null : height" />
				</div>
			</div>
		</div>
		<div v-frag v-else>
			<clickable v-for="(clickable, id) in filteredClickables" :key="id" class="align clickable-container" :style="{ height }"
						:id="id" :size="height === 'inherit' ? null : height" />
		</div>
	</div>
</template>

<script>
import { layers } from '../../store/layers';
import { getFiltered } from '../../util/vue';

export default {
	name: 'clickables',
	inject: [ 'tab' ],
	props: {
		layer: String,
		clickables: Array,
		showMaster: {
			type: Boolean,
			default: null
		},
		height: {
			type: [ Number, String ],
			default: "inherit"
		}
	},
	computed: {
		filteredClickables() {
			return getFiltered(layers[this.layer || this.tab.layer].clickables, this.clickables);
		},
		showMasterButton() {
			console.log(layers[this.layer || this.tab.layer].clickables?.masterButtonClick, this.showMaster, layers[this.layer || this.tab.layer].clickables?.showMaster)
			if (layers[this.layer || this.tab.layer].clickables?.masterButtonClick == undefined) {
				return false;
			}
			if (this.showMaster != undefined) {
				return this.showMaster;
			}
			return layers[this.layer || this.tab.layer].clickables?.showMaster;
		}
	},
	methods: {
		press() {
			layers[this.layer || this.tab.layer].clickables.masterButtonClick();
		}
	}
};
</script>

<style scoped>
.clickable-container {
	margin-left: 7px;
	margin-right: 7px;
}
</style>
