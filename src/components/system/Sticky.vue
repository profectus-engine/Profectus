<template>
    <div class="sticky" :style="{ top }" ref="sticky" data-v-sticky>
        <slot />
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
    name: "sticky",
    data() {
        return {
            top: "0",
            observer: null
        } as {
            top: string;
            observer: ResizeObserver | null;
        };
    },
    mounted() {
        this.setup();
    },
    methods: {
        setup() {
            this.$nextTick(() => {
                if (this.$refs.sticky == undefined) {
                    this.$nextTick(this.setup);
                } else {
                    this.updateTop();
                    this.observer = new ResizeObserver(this.updateTop);
                    this.observer.observe((this.$refs.sticky as HTMLElement).parentElement!);
                }
            });
        },
        updateTop() {
            let el = this.$refs.sticky as HTMLElement;
            if (el == undefined) {
                return;
            }

            let top = 0;
            while (el.previousSibling) {
                const sibling = el.previousSibling as HTMLElement;
                if (sibling.dataset && "vSticky" in sibling.dataset) {
                    top += sibling.offsetHeight;
                }
                el = sibling;
            }
            this.top = top + "px";
        }
    }
});
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
