<template>
	<div class="field">
		<span class="field-title" v-if="title">{{ title }}</span>
		<input type="range" :value="value" @input="e => $emit('change', e.target.value)" :min="min" :max="max" />
	</div>
</template>

<script>
import './fields.css';

export default {
	name: 'TextField',
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
