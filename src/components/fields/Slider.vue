<template>
	<div class="field">
		<span class="field-title" v-if="title">{{ title }}</span>
		<tooltip :text="`${value}`">
			<input type="range" :value="value" @input="e => $emit('change', parseInt(e.target.value))" :min="min" :max="max" />
		</tooltip>
	</div>
</template>

<script>
export default {
	name: 'Slider',
	props: {
		title: String,
		value: Number,
		min: Number,
		max: Number
	}
};
</script>

<style scoped>
</style>
