<template>
	<span>
		{{ resetDescription }}<b>{{ resetGain }}</b>
		{{ resource }}
		<br v-if="nextAt"/><br v-if="nextAt"/>
		{{ nextAt }}
	</span>
</template>

<script>
import { layers } from '../../store/layers';
import { player } from '../../store/proxies';
import { format, formatWhole } from '../../util/bignum';

export default {
	name: 'default-prestige-button-display',
	inject: [ 'tab' ],
	props: {
		layer: String
	},
	computed: {
		resetDescription() {
			if (player[this.layer || this.tab.layer].points.lt(1e3) || layers[this.layer || this.tab.layer].type === "static") {
				return layers[this.layer || this.tab.layer].resetDescription || "Reset for ";
			}
			return "";
		},
		resetGain() {
			return formatWhole(layers[this.layer || this.tab.layer].resetGain);
		},
		resource() {
			return layers[this.layer || this.tab.layer].resource;
		},
		showNextAt() {
			if (layers[this.layer || this.tab.layer].showNextAt != undefined) {
				return layers[this.layer || this.tab.layer].showNextAt;
			} else {
				return layers[this.layer || this.tab.layer].type === "static" ?
					player[this.layer || this.tab.layer].points.lt(30) : 											// static
					player[this.layer || this.tab.layer].points.lt(1e3) && layers[this.layer ||
						this.tab.layer].resetGain.lt(100);	// normal
			}
		},
		nextAt() {
			if (this.showNextAt) {
				let prefix;
				if (layers[this.layer || this.tab.layer].type === "static") {
					if (layers[this.layer || this.tab.layer].baseAmount.gte(layers[this.layer || this.tab.layer].nextAt) &&
						layers[this.layer || this.tab.layer].canBuyMax !== false) {
						prefix = "Next:";
					} else {
						prefix = "Req:";
					}

					const baseAmount = formatWhole(layers[this.layer || this.tab.layer].baseAmount);
					const nextAt = (layers[this.layer || this.tab.layer].roundUpCost ? formatWhole : format)(layers[this.layer || this.tab.layer].nextAtMax);
					const baseResource = layers[this.layer || this.tab.layer].baseResource;

					return `${prefix} ${baseAmount} / ${nextAt} ${baseResource}`;
				} else {
					let amount;
					if (layers[this.layer || this.tab.layer].roundUpCost) {
						amount = formatWhole(layers[this.layer || this.tab.layer].nextAt);
					} else {
						amount = format(layers[this.layer || this.tab.layer].nextAt);
					}
					return `Next at ${amount} ${layers[this.layer || this.tab.layer].baseResource}`;
				}
			}
			return "";
		}
	}
};
</script>

<style scoped>
</style>
