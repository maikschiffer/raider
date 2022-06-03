<template>
  <v-dialog v-model="dialogValue">
    <div id="debug-parent">
      <code id="debug-log">{{ log }}</code>
      <v-btn
        id="clear-btn"
        small
        round
        class="text-none"
        color="error"
        flat
        @click="clearLog">
        Clear
      </v-btn>
    </div>
  </v-dialog>
</template>

<script>
export default {
  name: 'DebugDialog',
  props: {
    dialog: {
      type: Boolean,
      required: true
    }
  },
  computed: {
    dialogValue: {
      get () {
        return this.dialog
      },
      set (value) {
        this.$emit('update:dialog', value)
      }
    },
    log () {
      return this.$store.getters.log.join('\n')
    }
  },
  methods: {
    clearLog () {
      this.$store.commit('clearLog')
    }
  }
}
</script>

<style lang="scss" scoped>
#debug-parent {
  position: relative;
  min-height: 200px;
  max-height: 200px;
  height: 100%;
  width: 100%;
  background-color: #303030;

  #debug-log {
    font-size: 13px;
    height: 100%;
    width: 100%;
    padding: 5px 10px;
    box-shadow: none;
    background-color: inherit;
  }

  #clear-btn {
    position: absolute;
    top: 0;
    right: 0;
    opacity: 0;

    &:hover {
      opacity: 0.5;
    }
  }
}
</style>
