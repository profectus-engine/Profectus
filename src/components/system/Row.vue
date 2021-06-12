<template>
     <div class="table">
          <div class="row">
               <slot />
          </div>
     </div>
</template>

<script>
import '../features/table.css';

export default {
     name: 'row'
};
</script>
