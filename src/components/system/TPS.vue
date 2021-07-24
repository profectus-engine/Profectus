<template>
	<div class="tpsDisplay" v-if="tps !== 'NaN'">
		TPS: {{ tps }}
	</div>
</template>

<script>
import Decimal, { formatWhole } from '../../util/bignum';
import player from '../../game/player';

export default {
	name: 'TPS',
	computed: {
		tps() {
			return formatWhole(Decimal.div(player.lastTenTicks.length, player.lastTenTicks.reduce((acc, curr) => acc + curr, 0)))
		}
	}
};
</script>

<style scoped>
.tpsDisplay {
	position: absolute;
	left: 10px;
	bottom: 10px;
	z-index: 100;
}
</style>
