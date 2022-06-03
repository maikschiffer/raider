<template>
  <v-layout
    shrink
    row
    wrap
    justify-center>
    <v-flex
      sm9
      md6
      lg5>
      <v-btn-toggle
        v-model="selectedTypes"
        class="mediatype-toggle full-width"
        multiple
        mandatory>
        <v-btn
          :ripple="false"
          depressed
          active-class="is-active"
          :color="getBtnColor('images')"
          value="images"
          :disabled="disabled">
          Images
        </v-btn>
        <v-btn
          :ripple="false"
          depressed
          active-class="is-active"
          :color="getBtnColor('videos')"
          value="videos"
          :disabled="disabled">
          Videos
        </v-btn>
        <v-btn
          :ripple="false"
          depressed
          active-class="is-active"
          :color="getBtnColor('stories')"
          value="stories"
          :disabled="disabled || sessions.length <= 0">
          Stories
        </v-btn>
        <v-btn
          :ripple="false"
          depressed
          active-class="is-active"
          :color="getBtnColor('highlights')"
          value="highlights"
          :disabled="disabled || sessions.length <= 0">
          Highlights
        </v-btn>
      </v-btn-toggle>
    </v-flex>
  </v-layout>
</template>

<script>
export default {
  name: 'MediaTypeToggles',
  props: {
    disabled: {
      type: Boolean,
      required: true
    }
  },
  computed: {
    selectedTypes: {
      get () {
        return this.$store.getters.mediaTypes
      },
      set (types) {
        this.$store.commit('updateMediaTypes', types)
      }
    },
    sessions () {
      return this.$store.getters.sessions
    }
  },
  methods: {
    getBtnColor (value) {
      return this.selectedTypes.includes(value) ? 'primary' : 'white'
    }
  }
}
</script>

<style lang="scss" scoped>
.v-btn-toggle button {
  width: calc(100% / 4);
}
</style>
