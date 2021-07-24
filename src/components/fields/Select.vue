<template>
	<div class="field">
		<span class="field-title" v-if="title">{{ title }}</span>
		<vue-select :options="options" :model-value="value" @update:modelValue="setSelected" label-by="label" :value-by="getValue" :placeholder="placeholder" :close-on-select="closeOnSelect" />
	</div>
</template>

<script>
export default {
	name: 'Select',
	props: {
		title: String,
		options: Array, // https://vue-select.org/guide/options.html#options-prop
		value: [ String, Object ],
		default: [ String, Object ],
		placeholder: String,
		closeOnSelect: Boolean
	},
	emits: [ 'change' ],
	methods: {
		setSelected(value) {
			value = value || this.default;
			this.$emit('change', value);
		},
		getValue(item) {
			return item?.value;
		}
	}
};
</script>

<style>
.vue-select {
    width: 50%;
}

.field-buttons .vue-select {
	width: unset;
}

.vue-select,
.vue-dropdown {
	border-color: rgba(var(--color), .26);
}

.vue-dropdown {
	background: var(--secondary-background);
}

.vue-dropdown-item {
	color: var(--color);
}

.vue-dropdown-item.highlighted {
	background-color: var(--background-tooltip);
}

.vue-dropdown-item.selected,
.vue-dropdown-item.highlighted.selected {
	background-color: var(--bought);
}
</style>
