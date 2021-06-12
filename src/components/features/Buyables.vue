<template>
	<div v-if="filteredBuyables" class="table">
		<respec-button v-if="showRespec" style="margin-bottom: 12px;" :confirmRespec="confirmRespec"
			@set-confirm-respec="setConfirmRespec" @respec="respec" />
		<div v-frag v-if="filteredBuyables.rows && filteredBuyables.cols">
			<div v-for="row in filteredBuyables.rows" class="row" :key="row">
				<div v-for="col in filteredBuyables.cols" :key="col">
					<buyable v-if="filteredBuyables[row * 10 + col] !== undefined" class="align buyable-container" :style="{ height }"
						:id="row * 10 + col" :size="height === 'inherit' ? null : height" />
				</div>
			</div>
		</div>
		<frament v-else>
			<buyable v-for="(buyable, id) in filteredBuyables" :key="id" class="align buyable-container" :style="{ height }"
						:id="id" :size="height === 'inherit' ? null : height" />
		</frament>
	</div>
</template>

<script>
import { layers } from '../../store/layers';
import { player } from '../../store/proxies';
import { getFiltered } from '../../util/vue';
import './table.css';

export default {
	name: 'buyables',
	inject: [ 'tab' ],
	props: {
		layer: String,
		buyables: Array,
		height: {
			type: [ Number, String ],
			default: "inherit"
		}
	},
	computed: {
		filteredBuyables() {
			return getFiltered(layers[this.layer || this.tab.layer].buyables, this.buyables);
		},
		showRespec() {
			return layers[this.layer || this.tab.layer].buyables.showRespec;
		},
		confirmRespec() {
			return player[this.layer || this.tab.layer].buyables.confirmRespec;
		}
	},
	methods: {
		setConfirmRespec(value) {
			if (this.confirmRespec != undefined) {
				this.$emit("set-confirm-respec", value);
			} else {
				player[this.layer || this.tab.layer].buyables.confirmRespec = value;
			}
		},
		respec() {
			// If they're controlling confirmRespec, assume they're also controlling what's being respecced
			if (this.confirmRespec != undefined) {
				this.$emit("respec");
			} else {
				layers[this.layer || this.tab.layer].buyables.respec();
			}
		}
	}
};
</script>

<style scoped>
.buyable-container {
	margin-left: 7px;
	margin-right: 7px;
}
</style>
