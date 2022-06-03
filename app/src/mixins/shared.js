const { shell } = require('electron').remote

export const openMainSite = {
  methods: {
    openMainSite () {
      shell.openExternal('https://www.getraider.com')
    }
  }
}

export const addLogEntry = {
  methods: {
    addLogEntry (text) {
      this.$store.commit('updateLog', text)
    }
  }
}
