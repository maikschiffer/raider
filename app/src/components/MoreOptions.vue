<template>
  <div>
    <v-layout
      justify-center
      row>
      <v-flex
        mb-3
        sm7
        md5
        lg4>
        <v-text-field
          v-model="maxPosts"
          label="Max Posts"
          hint="Default - ALL"
          persistent-hint
          clearable
          prepend-inner-icon="$vuetify.icons.image"
          type="number" />
      </v-flex>
    </v-layout>

    <v-layout justify-center>
      <v-btn
        round
        color="primary"
        @click="closeSection">
        Close
      </v-btn>
    </v-layout>
  </div>
</template>

<script>
export default {
  name: 'MoreOptions',
  props: {
    max: {
      type: null,
      required: true
    },
    toggle: {
      type: Boolean,
      required: true
    }
  },
  computed: {
    maxPosts: {
      get () {
        return this.max
      },
      set (value) {
        this.$emit('update:max', value)
      }
    }
  },
  methods: {
    closeSection () {
      this.$emit('update:toggle', false)
    }
  }
}
</script>
