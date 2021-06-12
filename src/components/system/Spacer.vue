<template>
     <div :style="{ width: spacingWidth, height: spacingHeight }"></div>
</template>

<script>
export default {
     name: 'spacer',
     props: {
          width: String,
          height: String
     },
     computed: {
          spacingWidth() {
               return this.width || '8px';
          },
          spacingHeight() {
               return this.height || '17px';
          }
     }
};
</script>
