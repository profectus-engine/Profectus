<template>
     <div class="vr" :style="{ height }"></div>
</template>

<script>
export default {
     name: 'vr',
     props: {
          height: String
     }
};
</script>

<style scoped>
.vr {
     width: 4px;
     background: var(--separator);
     height: 100%;
     margin: 0 7px;
}
</style>
