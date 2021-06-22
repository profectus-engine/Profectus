<template>
	<div class="field">
		<span class="field-title" v-if="title">{{ title }}</span>
		<v-select :options="options" :value="value" @input="setSelected" />
	</div>
</template>

<script>
import vSelect from 'vue-select';
import 'vue-select/dist/vue-select.css';

export default {
	name: 'Select',
	props: {
		title: String,
		options: Array, // https://vue-select.org/guide/options.html#options-prop
		value: [ String, Object ],
		default: [ String, Object ]
	},
	components: {
		vSelect
	},
	methods: {
		setSelected(option) {
			const value = option?.value || this.default;
			this.$emit('change', value);
		}
	}
};
</script>

<style>
.v-select {
    width: 50%;
}

.v-select .vs__dropdown-toggle {
	border-color: rgba(var(--color), .26);
    margin: -1px 0;
}

.v-select .vs__selected {
	color: var(--color);
}

.v-select .vs__clear,
.v-select .vs__open-indicator {
    fill: var(--color);
    opacity: .5;
}

.v-select .vs__dropdown-menu {
    background: var(--background);
    border-color: rgba(var(--color), .26);
}

.v-select .vs__dropdown-option {
	color: var(--color);
}

.v-select .vs__open-indicator {
	cursor: pointer;
}
</style>
