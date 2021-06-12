<template>
     <div class="table">
          <div class="col">
               <slot />
          </div>
     </div>
</template>

<script>
import '../features/table.css';

export default {
     name: 'column'
};
</script>
