<template>
	<div class="tpsDisplay">
		TPS: {{ tps }}
	</div>
</template>

<script>
import Decimal, { format } from '../../util/bignum';

export default {
	name: 'TPS',
	computed: {
		tps() {
			const lastTenTicks = this.$store.state.lastTenTicks;
			return format(Decimal.div(lastTenTicks.length, lastTenTicks.reduce((acc, curr) => acc + curr, 0)))
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
