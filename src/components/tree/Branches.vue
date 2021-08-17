<template>
    <slot />
    <div ref="resizeListener" class="resize-listener" />
    <svg v-bind="$attrs">
        <branch-line
            v-for="(branch, index) in branches"
            :key="index"
            :startNode="nodes[branch.start]"
            :endNode="nodes[branch.end]"
            :options="branch.options"
        />
    </svg>
</template>

<script lang="ts">
import { BranchLink, BranchNode, BranchOptions } from "@/typings/branches";
import { ComponentPublicInstance, defineComponent } from "vue";

const observerOptions = {
    attributes: true,
    childList: true,
    subtree: true
};

export default defineComponent({
    name: "branches",
    data() {
        return {
            observer: new MutationObserver(this.updateNodes as (...args: unknown[]) => void),
            resizeObserver: new ResizeObserver(this.updateNodes as (...args: unknown[]) => void),
            nodes: {},
            links: []
        } as {
            observer: MutationObserver;
            resizeObserver: ResizeObserver;
            nodes: Record<string, BranchNode>;
            links: Array<BranchLink>;
        };
    },
    mounted() {
        // ResizeListener exists because ResizeObserver's don't work when told to observe an SVG element
        this.resizeObserver.observe(this.$refs.resizeListener as HTMLElement);
        this.updateNodes();
    },
    provide() {
        return {
            registerNode: this.registerNode,
            unregisterNode: this.unregisterNode,
            registerBranch: this.registerBranch,
            unregisterBranch: this.unregisterBranch
        };
    },
    computed: {
        branches(): Array<BranchLink> {
            return this.links.filter(
                link =>
                    link.start in this.nodes &&
                    link.end in this.nodes &&
                    this.nodes[link.start].x != undefined &&
                    this.nodes[link.start].y != undefined &&
                    this.nodes[link.end].x != undefined &&
                    this.nodes[link.end].y != undefined
            );
        }
    },
    methods: {
        updateNodes() {
            if (this.$refs.resizeListener != undefined) {
                const containerRect = (this.$refs
                    .resizeListener as HTMLElement).getBoundingClientRect();
                Object.keys(this.nodes).forEach(id => this.updateNode(id, containerRect));
            }
        },
        updateNode(id: string, containerRect: DOMRect) {
            const linkStartRect = this.nodes[id].element.getBoundingClientRect();
            this.nodes[id].x = linkStartRect.x + linkStartRect.width / 2 - containerRect.x;
            this.nodes[id].y = linkStartRect.y + linkStartRect.height / 2 - containerRect.y;
        },
        registerNode(id: string, component: ComponentPublicInstance) {
            const element = component.$el.parentElement;
            this.nodes[id] = { component, element };
            this.observer.observe(element, observerOptions);
            this.$nextTick(() => {
                if (this.$refs.resizeListener != undefined) {
                    this.updateNode(
                        id,
                        (this.$refs.resizeListener as HTMLElement).getBoundingClientRect()
                    );
                }
            });
        },
        unregisterNode(id: string) {
            delete this.nodes[id];
        },
        registerBranch(start: string, options: string | BranchOptions) {
            const end = typeof options === "string" ? options : options.target;
            this.links.push({ start, end: end!, options });
        },
        unregisterBranch(start: string, options: string | BranchOptions) {
            const index = this.links.findIndex(l => l.start === start && l.options === options);
            this.links.splice(index, 1);
        }
    }
});
</script>

<style scoped>
svg,
.resize-listener {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -10;
    pointer-events: none;
}
</style>
