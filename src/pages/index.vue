<script setup lang="ts">
import { useCounterStore } from '@/store'

const countStore = useCounterStore()
</script>

<template>
  <div>
    {{ countStore.count }}
  </div>
</template>

<style scoped></style>
