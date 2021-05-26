<template>
	<span><slot /></span>
</template>

<script>
export default {
	name: 'LayerProvider',
	props: {
		layer: String,
		index: Number
	},
	provide() {
		const { layer, index } = this;
		return { layer, index };
	}
};
</script>

<style scoped>
</style>
