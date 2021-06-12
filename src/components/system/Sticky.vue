<template>
	<div class="sticky" :style="{ top }" ref="sticky" data-v-sticky>
		<slot />
	</div>
</template>

<script>
export default {
	name: 'sticky',
	data() {
		return {
			top: 0,
			observer: null
		};
	},
	mounted() {
		this.$nextTick(() => {
			if (this.$refs.sticky == undefined) {
				this.$nextTick(this.mounted);
			} else {
				this.updateTop();
				this.observer = new ResizeObserver(this.updateTop);
				this.observer.observe(this.$refs.sticky.parentElement);
			}
		});
	},
	methods: {
		updateTop() {
			let el = this.$refs.sticky;
			if (el == undefined) {
				return;
			}

			let top = 0;
			while (el.previousSibling) {
				if (el.previousSibling.dataset && 'vSticky' in el.previousSibling.dataset) {
					top += el.previousSibling.offsetHeight;
				}
				el = el.previousSibling;
			}
			this.top = top + "px";
		}
	}
};
</script>

<style scoped>
.sticky {
	position: sticky;
	background: var(--background);
	margin-left: -7px;
	margin-right: -7px;
	padding-left: 7px;
	padding-right: 7px;
	z-index: 3;
}

.modal-body .sticky {
	margin-left: 0;
	margin-right: 0;
	padding-left: 0;
	padding-right: 0;
}
</style>