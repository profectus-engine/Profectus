<template>
	<div v-frag>
		<slot />
	</div>
</template>

<script>
import { ReactiveProvideMixin } from 'vue-reactive-provide';

export default {
	name: 'LayerProvider',
	mixins: [
		ReactiveProvideMixin({
			name: 'tab',
			props: true
		})
	],
	props: {
		layer: String,
		index: Number
	}
};
</script>

<style scoped>
</style>
