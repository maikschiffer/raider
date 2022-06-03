<template>
  <v-toolbar
    dense
    flat
    color="transparent">
    <v-btn
      absolute
      left
      icon
      class="toolbar-btn"
      @click="openAccountsDrawer">
      <v-icon>
        $vuetify.icons.account
      </v-icon>
    </v-btn>

    <v-toolbar-title class="mx-auto">
      Home
    </v-toolbar-title>

    <v-btn
      absolute
      top
      right
      icon
      class="toolbar-btn"
      @click="openSettingsDrawer">
      <v-icon>
        $vuetify.icons.settings
      </v-icon>
    </v-btn>
  </v-toolbar>
</template>

<script>
const fs = require('fs-extra')

export default {
  name: 'Toolbar',
  props: {
    accDrawer: {
      type: Boolean,
      required: true
    },
    settingsDrawer: {
      type: Boolean,
      required: true
    }
  },
  computed: {
    saveFolder () {
      return this.$store.getters.saveFolder
    },
    accountsFile () {
      return this.$store.getters.accountsFile
    }
  },
  methods: {
    openAccountsDrawer () {
      if (fs.existsSync(this.accountsFile)) {
        return this.$emit('update:accDrawer', !this.accDrawer)
      }

      if (!fs.existsSync(this.saveFolder)) {
        return this.$swal.fire('Error', 'Save folder not found.', 'error')
      }

      this.$swal.fire({
        titleText: 'Accounts File Missing',
        text: 'Would you like to create a new one?',
        icon: 'error',
        showCancelButton: true,
        allowEnterKey: false,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No'
      }).then((result) => {
        if (result.value) {
          this.$store.dispatch('createAccountsFile')
          this.openAccountsDrawer()
        }
      })
    },
    openSettingsDrawer () {
      this.$emit('update:settingsDrawer', !this.settingsDrawer)
    }
  }
}
</script>

<style lang="scss" scoped>
.toolbar-btn {
  top: 0;
}
</style>
