<template>
  <v-app>
    <home />
  </v-app>
</template>

<script>
import Home from '@/views/Home'

export default {
  name: 'App',
  components: {
    Home
  }
}
</script>

<style lang="scss">
@import "./assets/fonts/roboto.css";

::-webkit-scrollbar {
  height: 12px;
  width: 12px;
  overflow: visible;
}

::-webkit-scrollbar-track {
  display: none;
}

::-webkit-scrollbar-thumb {
  background-clip: padding-box;
  border: solid transparent;
  border-width: 4px;
  border-radius: 50px;

  &:hover {
    border-width: 2px;
  }
}

::-webkit-scrollbar-thumb {
  background-color: #b6b6b6;
}

*,
*::before,
*::after {
  font-family: "Roboto", sans-serif;
  user-select: none;
}

html {
  overflow-y: auto !important;
}

.theme--light {
  &.application {
    background: white;
  }

  &.v-btn-toggle .v-btn {
    opacity: 1;
  }
}

.full-height {
  height: 100%;
}

.full-width {
  width: 100%;
}

.v-btn-toggle .v-btn {
  display: flex;
  flex-grow: 1;

  &.is-active {
    color: white;
  }

  &:hover::before {
    background-color: inherit;
  }
}

.v-subheader {
  height: 40px;
}

.v-btn .v-btn--block {
  border-radius: 0px;
}

.v-list__tile__action {
  min-width: unset;
}

input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.overflow-auto {
  overflow: auto;
}

.disabled-acc {
  text-decoration: line-through;
  opacity: 0.5;
}

.swal2-popup {
  padding: 1em;
}

.swal2-actions:not(.swal2-loading) > button {
  min-width: 100px;
}

.swal2-styled {
  padding: 0.625em 1em;
}

.swal2-icon {
  margin: 1em auto;
}
</style>
