<template>
	<LayerProvider :layer="layer" :index="index">
		<div>
		</div>
	</LayerProvider>
</template>

<script>
import LayerProvider from './LayerProvider';

export default {
	name: 'layer-tab',
	props: {
		layer: String,
		index: Number
	},
	components: {
		LayerProvider
	}
};
</script>

<style scoped>
</style>
