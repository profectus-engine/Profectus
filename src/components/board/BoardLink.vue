<template>
    <line
        v-bind="link"
        class="link"
        :class="{ pulsing: link.pulsing }"
        :x1="startPosition.x"
        :y1="startPosition.y"
        :x2="endPosition.x"
        :y2="endPosition.y"
    />
</template>

<script lang="ts">
import { Position } from "@/typings/branches";
import { BoardNodeLink } from "@/typings/features/board";
import { defineComponent, PropType } from "vue";

export default defineComponent({
    name: "BoardLink",
    props: {
        link: {
            type: Object as PropType<BoardNodeLink>,
            required: true
        }
    },
    computed: {
        startPosition(): Position {
            return this.link.from.position;
        },
        endPosition(): Position {
            return this.link.to.position;
        }
    }
});
</script>

<style scoped>
.link.pulsing {
    animation: pulsing 2s ease-in infinite;
}

@keyframes pulsing {
    0% {
        opacity: 0.25;
    }

    50% {
        opacity: 1;
    }

    100% {
        opacity: 0.25;
    }
}
</style>
