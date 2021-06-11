<template>
  <v-progress-linear v-if="state === STATES.LOADING" :indeterminate="true" />
  <v-btn v-else-if="state === STATES.INIT" text small @click="checkUpdates">
    <span class="mr-2">Check for updates</span>
    <v-icon>mdi-open-in-new</v-icon>
  </v-btn>
  <div v-else>{{ state }}</div>
</template>

<script lang="ts">
import { VForm } from "@/types/vuetify";
import { required, positive } from "@/ui/components/shared/formValidations";
import store from "@/ui/store";
import { defineComponent, ref, computed } from "@vue/composition-api";
import { GlobalConfig } from "@/ui/store/modules/config";
import { checkForUpdate, downloadUpdate, quitAndInstall } from "@/updater";

enum STATES {
  INIT,
  LOADING,
  ERROR,
  NEW_VERSION_AVAIL,
  NO_NEW_VERSION,
  READY_TO_INSTALL,
}

export default defineComponent({
  setup() {
    const state = ref(STATES.INIT);

    const checkUpdates = async () => {
      state.value = STATES.LOADING;
      checkForUpdate()
        .then((isUpdate) => {
          state.value = isUpdate
            ? STATES.NEW_VERSION_AVAIL
            : STATES.NO_NEW_VERSION;
        })
        .catch(() => (state.value = STATES.ERROR));
    };
    const downloadNewVersion = async () => {
      state.value = STATES.LOADING;
      downloadUpdate()
        .then(() => (state.value = STATES.READY_TO_INSTALL))
        .catch(() => (state.value = STATES.ERROR));
    };

    return { STATES, state, checkUpdates, downloadNewVersion, quitAndInstall };
  },
});
</script>

<style scoped>
</style>
