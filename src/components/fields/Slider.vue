<template>
	<div class="field">
		<span class="field-title" v-if="title">{{ title }}</span>
		<tooltip :display="`${value}`" :class="{ fullWidth: !title }">
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
	},
	emits: [ 'change' ]
};
</script>

<style scoped>
.fullWidth {
	width: 100%;
}
</style>
