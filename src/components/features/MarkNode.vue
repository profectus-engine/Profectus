<template>
    <div v-if="mark">
        <div v-if="mark === true" class="mark star"></div>
        <img v-else class="mark" :src="mark" />
    </div>
</template>

<script setup lang="ts">
defineProps<{ mark?: boolean | string }>();
</script>

<style scoped>
.mark {
    position: absolute;
    left: -25px;
    top: -10px;
    width: 30px;
    height: 30px;
    z-index: 1;
    pointer-events: none;
    margin-left: 0.9em;
    margin-right: 0.9em;
    margin-bottom: 1.2em;
    border-right: 0.3em solid transparent;
    border-bottom: 0.7em solid transparent;
    border-left: 0.3em solid transparent;
    font-size: 10px;
}

.star {
    left: -10px;
    width: 0;
    height: 0;
    margin-left: 0.9em;
    margin-right: 0.9em;
    margin-bottom: 1.2em;
    border-right: 0.3em solid transparent;
    border-bottom: 0.7em solid #ffcc00;
    border-left: 0.3em solid transparent;
    font-size: 10px;
    pointer-events: none;
}

.star::before,
.star::after {
    content: "";
    width: 0;
    height: 0;
    position: absolute;
    top: 0.6em;
    left: -1em;
    border-right: 1em solid transparent;
    border-bottom: 0.7em solid #ffcc00;
    border-left: 1em solid transparent;
    transform: rotate(-35deg);
}

.star::after {
    transform: rotate(35deg);
}
</style>
