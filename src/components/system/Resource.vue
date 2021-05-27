<template>
	<h2 v-bind:style="{ color, 'text-shadow': '0px 0px 10px ' + color }">
		{{ amount }}
	</h2>
</template>

<script>
export default {
	name: 'resource',
	props: {
		color: String,
		amount: String
	}
};
</script>

<style scoped>
</style>
