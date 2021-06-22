<template>
	<div style="display: flex">
		<tooltip text="Disable respec confirmation">
			<Toggle :value="confirmRespec" @change="setConfirmRespec" />
		</tooltip>
		<button @click="respec" :class="{ feature: true, respec: true, can: unlocked, locked: !unlocked }"
			style="margin-right: 18px" :style="style">
			<component :is="respecButtonDisplay" />
		</button>
		<Modal :show="confirming" @close="cancel">
			<div slot="header">
				<h2>Confirm Respec</h2>
			</div>
			<slot name="respec-warning" slot="body">
				<div>Are you sure you want to respec? This will force you to do a {{ name }} respec as well!</div>
			</slot>
			<div slot="footer">
				<div class="modal-footer">
					<div class="modal-flex-grow"></div>
					<button class="button modal-button danger" @click="cancel">
						Yes!
					</button>
					<button class="button modal-button" @click="cancel">
						Cancel
					</button>
				</div>
			</div>
		</Modal>
	</div>
</template>

<script>
import { layers } from '../../store/layers';
import { player } from '../../store/proxies';
import { coerceComponent } from '../../util/vue';

export default {
	name: 'respec-button',
	inject: [ 'tab' ],
	data() {
		return {
			confirming: false
		};
	},
	props: {
		layer: String,
		confirmRespec: Boolean,
		display: [ String, Object ]
	},
	computed: {
		style() {
			return [
				layers[this.layer || this.tab.layer].componentStyles?.['respec-button']
			];
		},
		unlocked() {
			return player[this.layer || this.tab.layer].unlocked;
		},
		respecButtonDisplay() {
			if (this.display) {
				return coerceComponent(this.display);
			}
			return coerceComponent("Respec");
		},
		name() {
			return layers[this.layer || this.tab.layer].name || this.layer || this.tab.layer;
		}
	},
	methods: {
		setConfirmRespec(value) {
			this.$emit("set-confirm-respec", value);
		},
		respec() {
			if (this.confirmRespec) {
				this.confirming = true;
			} else {
				this.$emit("respec");
			}
		},
		confirm() {
			this.$emit("respec");
			this.confirming = false;
		},
		cancel() {
			this.confirming = false;
		}
	}
};
</script>

<style scoped>
.respec {
    height: 40px;
    width: 80px;
    background: var(--points);
    border: 2px solid rgba(0, 0, 0, 0.125);
}

.modal-footer {
	display: flex;
}

.modal-flex-grow {
	flex-grow: 1;
}

.modal-button {
	margin-left: 10px;
}
</style>
