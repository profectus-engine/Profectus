<template>
	<line :stroke="stroke" :stroke-width="strokeWidth" v-bind="typeof options === 'string' ? [] : options"
		:x1="startPosition.x" :y1="startPosition.y" :x2="endPosition.x" :y2="endPosition.y" />
</template>

<script>
export default {
	name: 'branch-line',
	props: {
		options: [ String, Object ],
		startNode: Object,
		endNode: Object
	},
	computed: {
		stroke() {
			if (typeof this.options === 'string' || !('stroke' in this.options)) {
				return 'white';
			}
			return this.options.stroke;
		},
		strokeWidth() {
			if (typeof this.options === 'string' || !('stroke-width' in this.options)) {
				return '15px';
			}
			return this.options['stroke-width'];
		},
		startPosition() {
			const position = { x: this.startNode.x || 0, y: this.startNode.y || 0 };
			if (typeof this.options !== 'string' && 'startOffset' in this.options) {
				position.x += this.options.startOffset.x || 0;
				position.y += this.options.startOffset.y || 0;
			}
			return position;
		},
		endPosition() {
			const position = { x: this.endNode.x || 0, y: this.endNode.y || 0 };
			if (typeof this.options !== 'string' && 'endOffset' in this.options) {
				position.x += this.options.endOffset.x || 0;
				position.y += this.options.endOffset.y || 0;
			}
			return position;
		}
	}
};
</script>

<style scoped>
</style>
