<template>
	<slot />
</template>

<script>
export default {
	name: 'LayerProvider',
	provide() {
		return {
			'tab': {
				layer: this.layer,
				index: this.index
			}
		};
	},
	props: {
		layer: String,
		index: Number
	}
};
</script>

<style scoped>
</style>
