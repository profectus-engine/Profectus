<template>
    <div class="notif">!</div>
</template>

<script setup lang="ts"></script>

<style scoped>
.notif {
    position: absolute;
    top: 0;
    left: 5px;
    z-index: 10;
    pointer-events: none;
    user-select: none;
    color: var(--accent3);
    font-size: x-large;
    animation: 1s linear infinite bounce;
    border-radius: var(--border-radius);
    background: var(--locked);
}

@keyframes bounce {
    0% {
        animation-timing-function: cubic-bezier(0.1361, 0.2514, 0.2175, 0.8786);
        transform: translate(0, 0px) scaleY(1);
    }
    37% {
        animation-timing-function: cubic-bezier(0.7674, 0.1844, 0.8382, 0.7157);
        transform: translate(0, -20px) scaleY(1);
    }
    72% {
        animation-timing-function: cubic-bezier(0.1118, 0.2149, 0.2172, 0.941);
        transform: translate(0, 0px) scaleY(1);
    }
    87% {
        animation-timing-function: cubic-bezier(0.7494, 0.2259, 0.8209, 0.6963);
        transform: translate(0, 10px) scaleY(0.602);
    }
    100% {
        transform: translate(0, 0px) scaleY(1);
    }
}
</style>
