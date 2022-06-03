<template>
  <v-navigation-drawer
    v-model="drawerVal"
    class="overflow-hidden"
    :width="$vuetify.breakpoint.smAndDown ? 500 : 800"
    temporary
    app>
    <v-layout
      id="main-div"
      class="fill-height"
      column>
      <v-toolbar
        color="transparent"
        flat
        dense>
        <v-toolbar-title class="mx-auto">
          Accounts
        </v-toolbar-title>
        <v-btn
          icon
          @click="closeDrawer">
          <v-icon>
            $vuetify.icons.clear
          </v-icon>
        </v-btn>
      </v-toolbar>

      <v-layout
        justify-center
        shrink
        my-3>
        <v-flex sm10>
          <v-btn-toggle
            v-model="sortValue"
            class="full-width"
            mandatory>
            <v-btn
              v-for="(toggle, index) in sortOptions"
              :key="index"
              :ripple="false"
              active-class="is-active"
              depressed
              :color="sortValue === toggle.value ? 'primary' : 'white'"
              :value="toggle.value">
              {{ toggle.name }}
            </v-btn>
          </v-btn-toggle>
        </v-flex>
      </v-layout>

      <v-layout
        v-if="!accountsEmpty"
        justify-center
        shrink
        mb-3>
        <v-flex sm8>
          <v-text-field
            v-model="searchTerm"
            clearable
            prepend-inner-icon="$vuetify.icons.search"
            placeholder="Search"
            hide-details />
        </v-flex>
      </v-layout>

      <v-layout
        v-if="accountsEmpty"
        mt-5
        shrink
        justify-center
        column>
        <v-img
          class="mx-auto mb-2"
          :src="require('@/assets/sad.svg')"
          width="80" />
        <span class="text-xs-center">No Accounts</span>
      </v-layout>

      <div class="overflow-auto">
        <v-list
          class="pa-0"
          three-line>
          <v-layout
            row
            wrap>
            <v-flex
              v-for="user in sortedAccounts"
              v-show="searchMatch(user)"
              :key="user.userid"
              sm6
              md4>
              <v-list-tile
                v-longclick="enterEditMode"
                avatar
                @click="openProfile(user)">
                <v-list-tile-action v-show="editMode">
                  <v-btn
                    :disabled="isDownloading"
                    icon
                    class="mr-2"
                    @click.stop="toggleActiveState(user)">
                    <v-icon :color="isDisabled(user) ? 'red' : 'green'">
                      {{ isDisabled(user) ? '$vuetify.icons.accountOff' : '$vuetify.icons.account' }}
                    </v-icon>
                  </v-btn>
                </v-list-tile-action>

                <v-list-tile-content>
                  <v-list-tile-title :class="{'disabled-acc': user.disabled}">
                    {{ user.name }}
                  </v-list-tile-title>
                  <v-list-tile-sub-title
                    class="text--primary text-truncate d-block"
                    :class="{'disabled-acc': user.disabled}">
                    {{ user.username }}
                  </v-list-tile-sub-title>
                  <v-list-tile-sub-title class="warning--text">
                    {{ relativeTime(user.updated || null) }}
                  </v-list-tile-sub-title>
                </v-list-tile-content>

                <v-list-tile-action v-show="!editMode">
                  <v-btn
                    :disabled="isDownloading"
                    icon
                    @click.stop="selectUser(user.username)">
                    <v-icon color="grey">
                      $vuetify.icons.download
                    </v-icon>
                  </v-btn>
                </v-list-tile-action>

                <v-list-tile-action v-show="editMode">
                  <v-btn
                    :disabled="isDownloading"
                    small
                    icon
                    class="mx-2"
                    @click.stop="editAccount(user)">
                    <v-icon color="grey">
                      $vuetify.icons.edit
                    </v-icon>
                  </v-btn>
                </v-list-tile-action>

                <v-list-tile-action v-show="editMode">
                  <v-btn
                    :disabled="isDownloading"
                    small
                    icon
                    @click.stop="deleteAccount(user)">
                    <v-icon color="error lighten-1">
                      $vuetify.icons.bin
                    </v-icon>
                  </v-btn>
                </v-list-tile-action>
              </v-list-tile>
            </v-flex>
          </v-layout>
        </v-list>
      </div>

      <v-btn
        v-if="editMode"
        class="bottom-btn ma-0"
        absolute
        block
        depressed
        color="error"
        @click="exitEditMode">
        Exit Edit Mode
      </v-btn>

      <v-btn
        v-if="!accountsEmpty && !editMode"
        :disabled="isDownloading"
        class="bottom-btn ma-0"
        absolute
        block
        depressed
        color="primary"
        @click="updateAllAccouts(savedAccounts)">
        Update All
      </v-btn>
    </v-layout>
  </v-navigation-drawer>
</template>

<script>
import timeAgo from 's-ago'
import sortOn from 'sort-on'
import fs from 'fs-extra'
import path from 'path'
import throttle from 'lodash.throttle'

import { addLogEntry } from '@/mixins/shared'

const { ipcRenderer } = require('electron')
const { shell } = require('electron').remote

export default {
  name: 'AccountsDrawer',
  mixins: [addLogEntry],
  props: {
    drawer: {
      type: Boolean,
      required: true
    },
    input: {
      type: null,
      required: true
    },
    isDownloading: {
      type: Boolean,
      required: true
    },
    updateAll: {
      type: Function,
      required: true
    }
  },
  data: () => ({
    intervalID: null,
    timeoutID: null,
    lastUserEventTime: 0,
    searchTerm: '',
    savedAccounts: [],
    sortValue: null,
    sortOptions: [
      { name: 'Name', value: 'name' },
      { name: 'Newest', value: '-updated' },
      { name: 'Oldest', value: 'updated' }
    ],
    editMode: false
  }),
  computed: {
    drawerVal: {
      get () {
        return this.drawer
      },
      set (value) {
        this.$emit('update:drawer', value)
      }
    },
    saveFolder () {
      return this.$store.getters.saveFolder
    },
    accountsFile () {
      return this.$store.getters.accountsFile
    },
    openAccountFolder () {
      return this.$store.getters.openAccountFolder
    },
    accountsEmpty () {
      return this.savedAccounts.length <= 0
    },
    sortedAccounts () {
      return sortOn(this.savedAccounts, this.sortValue)
    },
    updateInterval () {
      return this.$store.getters.updateInterval
    }
  },
  watch: {
    drawerVal () {
      if (this.drawerVal) {
        this.parseAccountsFile()
        this.exitEditMode()
      }
    },
    updateInterval () {
      this.setAutoUpdate()
    }
  },
  created () {
    ipcRenderer.on('update-accounts', () => {
      this.parseAndUpdateAccounts()
    })

    document.addEventListener('mousemove', this.updateIdleState)
    document.addEventListener('touchstart', this.updateIdleState)
    document.addEventListener('keydown', this.updateIdleState)
  },
  mounted () {
    this.setAutoUpdate()
  },
  beforeDestroy () {
    document.removeEventListener('mousemove', this.updateIdleState)
    document.removeEventListener('touchstart', this.updateIdleState)
    document.removeEventListener('keydown', this.updateIdleState)
  },
  methods: {
    searchMatch (user) {
      const searchTerm = this.searchTerm ? this.searchTerm.toLowerCase().trim() : null

      return (searchTerm === '' || searchTerm == null || user.name.toLowerCase().includes(searchTerm) || user.username.toLowerCase().includes(searchTerm))
    },
    parseAccountsFile () {
      this.savedAccounts = fs.readJsonSync(this.accountsFile, { throws: false }) || []
    },
    closeDrawer () {
      this.$emit('update:drawer', false)
    },
    relativeTime (time) {
      return time ? timeAgo(new Date(time)) : 'Never'
    },
    selectUser (username) {
      this.$emit('update:input', username)
      this.closeDrawer()
    },
    isDisabled (user) {
      return user.disabled || false
    },
    updateIdleState: throttle(function () {
      this.lastUserEventTime = Date.now()
    }, 2500),
    setAutoUpdate () {
      this.clearIntervalID()
      this.clearTimeoutID()

      if (this.updateInterval === 0) {
        return
      }

      this.intervalID = setInterval(this.autoUpdateAccounts, 900000)
    },
    clearIntervalID () {
      if (this.intervalID == null) {
        return
      }

      clearInterval(this.intervalID)
      this.intervalID = null
    },
    clearTimeoutID () {
      if (this.timeoutID == null) {
        return
      }

      clearInterval(this.timeoutID)
      this.timeoutID = null
    },
    autoUpdateAccounts () {
      if (this.isDownloading) {
        return
      }

      if (Date.now() - this.lastUserEventTime <= 20000) {
        this.clearTimeoutID()

        this.addLogEntry('Auto Update Deferred')

        this.timeoutID = setTimeout(this.autoUpdateAccounts, 60000)

        return
      }

      this.clearTimeoutID()

      this.parseAccountsFile()

      const curTime = Date.now()

      const accs = this.savedAccounts.filter(acc => acc.updated == null || (curTime - acc.updated) >= this.updateInterval)

      this.updateAllAccouts(accs)
    },
    parseAndUpdateAccounts () {
      this.parseAccountsFile()
      this.updateAllAccouts(this.savedAccounts)
    },
    updateAllAccouts (accList) {
      const accs = accList.sort((a, b) => a.updated - b.updated).filter(acc => acc.disabled == null || acc.disabled === false)

      this.updateAll(accs)
    },
    enterEditMode () {
      this.editMode = true
    },
    exitEditMode () {
      this.editMode = false
    },
    toggleActiveState (user) {
      const activeUser = this.savedAccounts.find(acc => acc.userid === user.userid)
      const activeUserIndex = this.savedAccounts.findIndex(acc => acc.userid === user.userid)

      const userDisabled = this.isDisabled(user)

      this.$swal.fire({
        titleText: userDisabled ? `Enable ${user.name}` : `Disable ${user.name}`,
        text: `Are you sure you want to ${userDisabled ? 're-enable' : 'disable'} this account?`,
        icon: userDisabled ? 'info' : 'error',
        allowEnterKey: false,
        showCancelButton: true,
        confirmButtonText: 'Yes',
        confirmButtonColor: userDisabled ? '#1976D2' : '#FF5252',
        cancelButtonColor: '#1976D2'
      })
        .then(result => {
          if (result.dismiss) {
            return
          }

          activeUser.disabled = !userDisabled

          this.$set(this.savedAccounts, activeUserIndex, activeUser)

          this.updateAccountsFile()
        })
    },
    editAccount (user) {
      const activeUser = this.savedAccounts.find(acc => acc.userid === user.userid)

      const swalMixin = this.$swal.mixin({
        input: 'text',
        inputAttributes: {
          autocapitalize: 'off'
        },
        showLoaderOnConfirm: true,
        showCancelButton: true
      })

      swalMixin.fire({
        title: 'Change Username',
        text: 'Enter username below.',
        inputValue: activeUser.username,
        confirmButtonText: 'Next',
        preConfirm: (username) => {
          if (activeUser.username === username) {
            return
          }

          const isDuplicate = this.savedAccounts.some(acc => acc.username === username)

          if (isDuplicate) {
            return this.$swal.showValidationMessage(`${username} already exists.`)
          }

          const userIndex = this.savedAccounts.findIndex(acc => acc.userid === user.userid)

          this.savedAccounts[userIndex].username = username
          this.savedAccounts[userIndex].pendingRefresh = true

          this.updateAccountsFile()
        }
      }).then((result) => {
        if (result.dismiss) {
          return
        }

        swalMixin.fire({
          title: 'Change Folder Name',
          text: 'Enter save folder name below.',
          inputValue: activeUser.name,
          preConfirm: (name) => {
            if (activeUser.name === name) {
              return
            }

            return fs.rename(path.join(this.saveFolder, activeUser.name), path.join(this.saveFolder, name))
              .then(() => {
                const userIndex = this.savedAccounts.findIndex(acc => acc.userid === user.userid)

                this.savedAccounts[userIndex].name = name

                this.updateAccountsFile()
              })
              .catch(err => {
                this.$store.commit('updateLog', err)
                this.$swal.showValidationMessage(err.code === 'EBUSY' ? 'Unable to rename folder. The folder or a file in it is open in another program.' : 'Unable to rename folder.')
              })
          }
        }).then((result) => {
          if (result.dismiss) {
            return
          }

          this.$swal.fire('All done!', '', 'success')
        })
      })
    },
    deleteAccount (user) {
      this.$swal.fire({
        titleText: `Delete ${user.name}`,
        text: 'Are you sure you want to delete this account?',
        icon: 'error',
        input: 'checkbox',
        inputPlaceholder: 'Permanently delete folder',
        allowEnterKey: false,
        showCancelButton: true,
        confirmButtonText: 'Yes',
        confirmButtonColor: '#FF5252',
        cancelButtonColor: '#1976D2',
        showLoaderOnConfirm: true,
        preConfirm: (value) => {
          if (value === 0) {
            return value
          }

          return fs.remove(path.join(this.saveFolder, user.name))
            .catch((err) => {
              this.$store.commit('updateLog', err)
              this.$swal.showValidationMessage(err.code === 'EBUSY' ? 'Unable to delete folder. The folder or a file in it is open in another program.' : 'Unable to delete folder.')
            })
        }
      })
        .then(result => {
          if (result.dismiss) {
            return
          }

          const activeUser = this.savedAccounts.findIndex(acc => acc.userid === user.userid)
          this.savedAccounts.splice(activeUser, 1)

          this.updateAccountsFile()
        })
    },
    updateAccountsFile () {
      fs.writeFileSync(this.accountsFile, JSON.stringify(this.savedAccounts))
    },
    openProfile (user) {
      if (this.editMode) {
        return
      }

      if (this.openAccountFolder) {
        const userFolder = path.resolve(this.saveFolder, user.name)

        fs.existsSync(userFolder) ? shell.openItem(userFolder) : this.$swal.fire('Not Found', `${userFolder} does not exist.`, 'error')
      } else {
        shell.openExternal(`https://www.instagram.com/${user.username}/`)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
#main-div {
  padding-bottom: 36px;
}

.bottom-btn {
  bottom: 0;
}
</style>
