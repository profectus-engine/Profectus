<template>
	<div class="field">
		<span class="field-title" v-if="title">{{ title }}</span>
		<textarea-autosize v-if="textarea" :placeholder="placeholder" :value="value" @input="value => $emit('change', value)" />
		<input v-else type="text" :value="value" @input="e => $emit('change', e.target.value)" :placeholder="placeholder" />
	</div>
</template>

<script>
import './fields.css';

export default {
	name: 'TextField',
	props: {
		title: String,
		value: [ String, Object ],
		textarea: Boolean,
		placeholder: String
	}
};
</script>

<style scoped>
</style>
