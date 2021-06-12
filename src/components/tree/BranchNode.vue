<template>
	<div class="branch"></div>
</template>

<script>
export default {
	name: 'branch-node',
	props: {
		featureType: String,
		id: [ Number, String ],
		branches: Array
	},
	inject: [ 'registerNode', 'unregisterNode', 'registerBranch', 'unregisterBranch' ],
	mounted() {
		const id = `${this.featureType}@${this.id}`;
		if (this.registerNode) {
			this.registerNode(id, this);
		}
		if (this.registerBranch) {
			this.branches?.map(this.handleBranch).forEach(branch => this.registerBranch(id, branch));
		}
	},
	beforeDestroy() {
		const id = `${this.featureType}@${this.id}`;
		if (this.unregisterNode) {
			this.unregisterNode(id);
		}
		if (this.unregisterBranch) {
			this.branches?.map(this.handleBranch).forEach(branch => this.unregisterBranch(id, branch));
		}
	},
	watch: {
		featureType(newValue, oldValue) {
			if (this.registerNode && this.unregisterNode) {
				this.unregisterNode(`${oldValue}@${this.id}`);
				this.registerNode(`${newValue}@${this.id}`, this);
			}
		},
		id(newValue, oldValue) {
			if (this.registerNode && this.unregisterNode) {
				this.unregisterNode(`${this.featureType}@${oldValue}`);
				this.registerNode(`${this.featureType}@${newValue}`, this);
			}
		},
		branches(newValue, oldValue) {
			if (this.registerBranch && this.unregisterBranch) {
				const id = `${this.featureType}@${this.id}`;
				oldValue?.map(this.handleBranch).forEach(branch => this.unregisterBranch(id, branch));
				newValue?.map(this.handleBranch).forEach(branch => this.registerBranch(id, branch));
			}
		}
	},
	methods: {
		handleBranch(branch) {
			if (typeof branch === 'string') {
				return branch.includes('@') ? branch : `${this.featureType}@${branch}`;
			}
			if (!branch.target.includes('@')) {
				return { ...branch, target: `${branch.featureType || this.featureType}@${branch.target}` };
			}
			return branch;
		}
	}
};
</script>

<style scoped>
.branch {
    position: absolute;
    z-index: -10;
    top: 0;
    left: 0;
	width: 100%;
	height: 100%;
	pointer-events: none;
}
</style>
