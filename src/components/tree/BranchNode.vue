<template>
    <div class="branch"></div>
</template>

<script lang="ts">
import { BranchOptions } from "@/typings/branches";
import { ComponentPublicInstance, defineComponent, PropType } from "vue";

// Annoying work-around for injected functions not appearing on `this`
// Also requires those annoying 3 lines in any function that uses this
type BranchInjectedComponent<T extends ComponentPublicInstance> = {
    registerNode?: (id: string, component: ComponentPublicInstance) => void;
    unregisterNode?: (id: string) => void;
    registerBranch?: (start: string, options: string | BranchOptions) => void;
    unregisterBranch?: (start: string, options: string | BranchOptions) => void;
} & T;

export default defineComponent({
    name: "branch-node",
    props: {
        featureType: {
            type: String,
            required: true
        },
        id: {
            type: [Number, String],
            required: true
        },
        branches: Array as PropType<Array<string | BranchOptions>>
    },
    inject: ["registerNode", "unregisterNode", "registerBranch", "unregisterBranch"],
    mounted() {
        const id = `${this.featureType}@${this.id}`;
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const _this = this;
        const injectedThis = this as BranchInjectedComponent<typeof _this>;
        if (injectedThis.registerNode) {
            injectedThis.registerNode(id, this);
        }
        if (injectedThis.registerBranch) {
            this.branches
                ?.map(this.handleBranch)
                .forEach(branch => injectedThis.registerBranch!(id, branch));
        }
    },
    beforeUnmount() {
        const id = `${this.featureType}@${this.id}`;
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const _this = this;
        const injectedThis = this as BranchInjectedComponent<typeof _this>;
        if (injectedThis.unregisterNode) {
            injectedThis.unregisterNode(id);
        }
        if (injectedThis.unregisterBranch) {
            this.branches
                ?.map(this.handleBranch)
                .forEach(branch => injectedThis.unregisterBranch!(id, branch));
        }
    },
    watch: {
        featureType(newValue, oldValue) {
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const _this = this;
            const injectedThis = this as BranchInjectedComponent<typeof _this>;
            if (injectedThis.registerNode && injectedThis.unregisterNode) {
                injectedThis.unregisterNode(`${oldValue}@${this.id}`);
                injectedThis.registerNode(`${newValue}@${this.id}`, this);
            }
        },
        id(newValue, oldValue) {
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const _this = this;
            const injectedThis = this as BranchInjectedComponent<typeof _this>;
            if (injectedThis.registerNode && injectedThis.unregisterNode) {
                injectedThis.unregisterNode(`${this.featureType}@${oldValue}`);
                injectedThis.registerNode(`${this.featureType}@${newValue}`, this);
            }
        },
        branches(newValue, oldValue) {
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const _this = this;
            const injectedThis = this as BranchInjectedComponent<typeof _this>;
            if (injectedThis.registerBranch && injectedThis.unregisterBranch) {
                const id = `${this.featureType}@${this.id}`;
                oldValue
                    ?.map(this.handleBranch)
                    .forEach((branch: string | BranchOptions) =>
                        injectedThis.unregisterBranch!(id, branch)
                    );
                newValue
                    ?.map(this.handleBranch)
                    .forEach((branch: string | BranchOptions) =>
                        injectedThis.registerBranch!(id, branch)
                    );
            }
        }
    },
    methods: {
        handleBranch(branch: string | BranchOptions) {
            if (typeof branch === "string") {
                return branch.includes("@") ? branch : `${this.featureType}@${branch}`;
            }
            if (!branch.target?.includes("@")) {
                return {
                    ...branch,
                    target: `${branch.featureType || this.featureType}@${branch.target}`
                };
            }
            return branch;
        }
    }
});
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
