<template>
	<tooltip :display="tooltip" :force="forceTooltip" :class="{
			ghost: layer.layerShown === 'ghost',
			treeNode: true,
			[id]: true,
			hidden: !layer.layerShown,
			locked: !unlocked,
			notify: layer.notify && unlocked,
			resetNotify: layer.resetNotify,
			can: unlocked,
			small
		}">
		<LayerProvider :index="tab.index" :layer="id">
			<button v-if="layer.shown" @click="clickTab" :style="style" :disabled="!unlocked">
				<component :is="display" />
				<branch-node :branches="layer.branches" :id="id" featureType="tree-node" />
			</button>
			<mark-node :mark="layer.mark" />
		</LayerProvider>
	</tooltip>
</template>

<script>
import { layers } from '../../store/layers';
import { player } from '../../store/proxies';
import { coerceComponent } from '../../util/vue';
import { formatWhole } from '../../util/bignum';

export default {
	name: 'tree-node',
	props: {
		id: [ String, Number ],
		small: Boolean,
		append: Boolean
	},
	inject: [ 'tab' ],
	computed: {
		layer() {
			return layers[this.id];
		},
		unlocked() {
			if (this.layer.canClick != undefined) {
				return this.layer.canClick;
			}
			return this.layer.unlocked;
		},
		style() {
			return [
				this.unlocked ? { backgroundColor: this.layer.color } : null,
				this.layer.notify && this.unlocked ?
					{ boxShadow: `-4px -4px 4px rgba(0, 0, 0, 0.25) inset, 0 0 20px ${this.layer.trueGlowColor}` } : null,
				this.layer.nodeStyle
			];
		},
		display() {
			if (this.layer.display != undefined) {
				return coerceComponent(this.layer.display);
			} else if (this.layer.image != undefined) {
				return coerceComponent(`<img src=${this.layer.image}/>`);
			} else {
				return coerceComponent(this.layer.symbol);
			}
		},
		forceTooltip() {
			return player[this.id].forceTooltip;
		},
		tooltip() {
			if (this.layer.canClick != undefined) {
				if (this.layer.canClick) {
					return this.layer.tooltip || 'I am a button!';
				} else {
					return this.layer.tooltipLocked || this.layer.tooltip || 'I am a button!';
				}
			}
			if (this.layer.unlocked) {
				return this.layer.tooltip || `${formatWhole(player[this.id].points)} ${this.layer.resource}`;
			} else {
				return this.layer.tooltipLocked ||
					`Reach ${formatWhole(this.layer.requires)} ${this.layer.baseResource} to unlock (You have ${formatWhole(this.layer.baseAmount)} ${this.layer.baseResource})`;
			}
		},
		components() {
			return Object.keys(layers).reduce((acc, curr) => {
				acc[curr] = layers[curr].component || false;
				return acc;
			}, {});
		}
	},
	methods: {
		clickTab(e) {
			if (e.shiftKey) {
				player[this.id].forceTooltip = !player[this.id].forceTooltip;
			} else if (this.layer.onClick != undefined) {
				this.layer.onClick();
			} else if (this.layer.modal) {
				this.$emit('show-modal', this.id);
			} else if (this.append) {
				if (player.tabs.includes(this.id)) {
					const index = player.tabs.lastIndexOf(this.id);
					player.tabs = [...player.tabs.slice(0, index), ...player.tabs.slice(index + 1)];
				} else {
					player.tabs = [...player.tabs, this.id];
				}
			} else {
				player.tabs = [...player.tabs.slice(0, this.tab.index + 1), this.id];
			}
		}
	}
};
</script>

<style scoped>
.treeNode {
    height: 100px;
    width: 100px;
    border-radius: 50%;
    padding: 0;
    margin: 0 10px 0 10px;
}

.treeNode button {
	width: 100%;
	height: 100%;
    border: 2px solid rgba(0, 0, 0, 0.125);
    border-radius: inherit;
    font-size: 40px;
    color: rgba(0, 0, 0, 0.5);
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.25);
    box-shadow: -4px -4px 4px rgba(0, 0, 0, 0.25) inset, 0px 0px 20px var(--background);
}

.treeNode.small {
    height: 60px;
    width: 60px;
}

.treeNode.small button {
    font-size: 30px;
}

.ghost {
	visibility: hidden;
	pointer-events: none;
}
</style>
