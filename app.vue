<template>
  <v-app :theme="theme">
    <VitePwaManifest />
    <NuxtPage />
  </v-app>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useTheme } from '~/composables/useTheme';

const { theme, initTheme } = useTheme();

onMounted(() => {
  initTheme();
});
</script>
