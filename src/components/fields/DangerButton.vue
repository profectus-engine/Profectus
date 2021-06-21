<template>
	<span class="container">
		<span v-if="confirming">Are you sure?</span>
		<button @click.stop="click" class="button danger" :disabled="disabled">
			<span v-if="confirming">Yes</span>
			<slot v-else />
		</button>
		<button v-if="confirming" class="button" @click.stop="cancel">No</button>
	</span>
</template>

<script>
export default {
	name: 'danger-button',
	data() {
		return {
			confirming: false
		}
	},
	props: {
		disabled: Boolean
	},
	watch: {
		confirming(newValue) {
			this.$emit('confirmingChanged', newValue);
		}
	},
	methods: {
		click() {
			if (this.confirming) {
				this.$emit('click');
			}
			this.confirming = !this.confirming;
		},
		cancel() {
			this.confirming = false;
		}
	}
};
</script>

<style scoped>
.container {
	display: flex;
    align-items: center;
}

.container > * {
	margin: 0 4px;
}

.danger {
	border: solid 2px var(--danger);
	padding-right: 0;
}

.danger::after {
	content:  "!";
	color: white;
	background: var(--danger);
	padding: 2px;
	margin-left: 6px;
	height: 100%;
}
</style>
