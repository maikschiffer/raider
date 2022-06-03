<template>
  <v-navigation-drawer
    v-model="drawerVal"
    class="overflow-hidden"
    right
    width="500"
    temporary
    app>
    <v-layout
      class="fill-height"
      column>
      <v-toolbar
        color="transparent"
        flat
        dense>
        <v-toolbar-title class="mx-auto">
          Settings
        </v-toolbar-title>

        <v-btn
          icon
          @click="closeDrawer">
          <v-icon>
            $vuetify.icons.clear
          </v-icon>
        </v-btn>

        <template #extension>
          <v-tabs
            v-model="activeTab"
            grow>
            <v-tabs-slider color="primary" />

            <v-tab
              v-for="category in tabCategories"
              :key="category">
              {{ category }}
            </v-tab>
          </v-tabs>
        </template>
      </v-toolbar>

      <div
        v-show="activeTab === 0"
        class="overflow-auto">
        <v-subheader>
          Save Folder
        </v-subheader>

        <v-layout justify-center>
          <v-flex sm9>
            <v-text-field
              v-model="saveFolder"
              readonly
              solo
              hide-details />
          </v-flex>
          <v-flex sm2>
            <v-btn
              :disabled="isDownloading || folderSelectionDialogOpen"
              block
              color="primary"
              class="full-height ma-0"
              @click="changeSaveFolder">
              Change
            </v-btn>
          </v-flex>
        </v-layout>

        <v-subheader class="mt-3">
          Download Timeout (Seconds)
        </v-subheader>

        <v-layout justify-center>
          <v-flex sm11>
            <v-form ref="timeoutInput">
              <v-text-field
                v-model="timeout"
                :disabled="isDownloading"
                class="ma-0"
                solo
                hint="Perfect"
                persistent-hint
                :rules="[rules.required, rules.validTimeout]"
                type="number" />
            </v-form>
          </v-flex>
        </v-layout>

        <v-subheader>
          Mass Update Max Posts
        </v-subheader>

        <v-layout justify-center>
          <v-flex sm11>
            <v-form ref="maxPostsInput">
              <v-text-field
                v-model="maxPosts"
                :disabled="isDownloading"
                class="ma-0"
                solo
                hint="Perfect"
                persistent-hint
                :rules="[rules.required, rules.validMaxPosts]"
                type="number" />
            </v-form>
          </v-flex>
        </v-layout>

        <v-subheader>
          Mass Update Sleep Timer (Seconds)
        </v-subheader>

        <v-layout justify-center>
          <v-flex sm11>
            <v-form ref="sleepTimerInput">
              <v-text-field
                v-model="sleepTimer"
                :disabled="isDownloading"
                class="ma-0"
                solo
                hint="Perfect"
                persistent-hint
                :rules="[rules.required, rules.validSleepTimer]"
                type="number" />
            </v-form>
          </v-flex>
        </v-layout>

        <v-subheader>
          Filename Format
        </v-subheader>

        <v-layout justify-center>
          <v-flex sm11>
            <v-select
              v-model="filenameFormat"
              :disabled="isDownloading"
              solo
              :items="filenameFormats"
              :hint="`Result: ${filenameHints[filenameFormat]}`"
              persistent-hint />
          </v-flex>
        </v-layout>

        <v-subheader>
          Auto Update Interval
        </v-subheader>

        <v-layout justify-center>
          <v-flex sm11>
            <v-select
              v-model="updateInterval"
              :disabled="isDownloading"
              solo
              :items="updateInervalOptions" />
          </v-flex>
        </v-layout>

        <v-subheader class="subtitle-2">
          User Agent
          <v-btn
            small
            dark
            class="ml-2"
            color="primary"
            @click="getUseragent">
            Get Useragent
          </v-btn>
          <v-btn
            small
            class="ml-0"
            color="warning"
            :disabled="isDownloading"
            @click="restartApp">
            Apply
          </v-btn>
        </v-subheader>

        <v-layout justify-center>
          <v-flex sm11>
            <v-form>
              <v-text-field
                v-model="userAgent"
                clearable
                :disabled="isDownloading"
                class="ma-0"
                solo
                :rules="[rules.required]" />
            </v-form>
          </v-flex>
        </v-layout>

        <v-subheader>
          Account Click Action
        </v-subheader>

        <v-layout justify-center>
          <v-flex sm11>
            <v-btn-toggle
              v-model="openFolderAccountClick"
              class="full-width mb-2"
              mandatory>
              <v-btn
                :ripple="false"
                depressed
                active-class="is-active"
                :value="true"
                :color="openFolderAccountClick ? 'primary' : 'white'"
                :disabled="isDownloading">
                User Folder
              </v-btn>
              <v-btn
                :ripple="false"
                depressed
                active-class="is-active"
                :value="false"
                :color="openFolderAccountClick ? 'white' : 'primary'"
                :disabled="isDownloading">
                Profile Page
              </v-btn>
            </v-btn-toggle>
          </v-flex>
        </v-layout>

        <v-subheader>
          Accounts
        </v-subheader>

        <v-layout
          justify-center
          column>
          <div v-show="sessions.length <= 0">
            <v-img
              class="mx-auto mb-2"
              :src="require('@/assets/sad.svg')"
              width="80" />
            <p class="mb-1 text-xs-center">
              No accounts found
            </p>
          </div>

          <div v-if="sessions.length > 0">
            <v-list
              id="accounts-section"
              class="py-0">
              <div class="overflow-auto">
                <v-list-tile
                  v-for="user in sessions"
                  :key="user.id"
                  avatar>
                  <v-list-tile-avatar>
                    <img :src="user.avatar">
                  </v-list-tile-avatar>

                  <v-list-tile-title class="body-2">
                    {{ user.name }}
                  </v-list-tile-title>

                  <v-list-tile-action>
                    <v-icon
                      :disabled="isDownloading"
                      color="grey"
                      @click="deleteAccount(user)">
                      $vuetify.icons.clear
                    </v-icon>
                  </v-list-tile-action>
                </v-list-tile>
              </div>
            </v-list>
          </div>
        </v-layout>

        <v-layout justify-center>
          <v-btn
            :disabled="isDownloading || childWindow != null"
            flat
            color="primary"
            class="text-none"
            @click="addNewAccount">
            Add New Account
          </v-btn>
        </v-layout>
      </div>

      <div
        v-show="activeTab === 1"
        class="overflow-auto">
        <v-subheader>
          System Tray Icon
        </v-subheader>

        <v-layout justify-center>
          <v-flex sm11>
            <v-btn-toggle
              v-model="enableTrayIcon"
              class="full-width mb-2"
              mandatory>
              <v-btn
                :ripple="false"
                depressed
                active-class="is-active"
                :value="true"
                :color="enableTrayIcon ? 'primary' : 'white'">
                Enabled
              </v-btn>
              <v-btn
                :ripple="false"
                depressed
                active-class="is-active"
                :value="false"
                :color="enableTrayIcon ? 'white' : 'primary'">
                Disabled
              </v-btn>
            </v-btn-toggle>
          </v-flex>
        </v-layout>

        <v-subheader>
          Launch Raider on Startup
        </v-subheader>

        <v-layout justify-center>
          <v-flex sm11>
            <v-btn-toggle
              v-model="autoStart"
              class="full-width mb-2"
              mandatory>
              <v-btn
                :ripple="false"
                depressed
                active-class="is-active"
                :value="true"
                :color="autoStart ? 'primary' : 'white'"
                :disabled="!enableTrayIcon">
                Enabled
              </v-btn>
              <v-btn
                :ripple="false"
                depressed
                active-class="is-active"
                :value="false"
                :color="autoStart ? 'white' : 'primary'"
                :disabled="!enableTrayIcon">
                Disabled
              </v-btn>
            </v-btn-toggle>
          </v-flex>
        </v-layout>

        <v-subheader>
          Close to Tray
        </v-subheader>

        <v-layout justify-center>
          <v-flex sm11>
            <v-btn-toggle
              v-model="closeTray"
              class="full-width mb-2"
              mandatory>
              <v-btn
                :ripple="false"
                depressed
                active-class="is-active"
                :value="true"
                :color="closeTray ? 'primary' : 'white'"
                :disabled="!enableTrayIcon">
                Enabled
              </v-btn>
              <v-btn
                :ripple="false"
                depressed
                active-class="is-active"
                :value="false"
                :color="closeTray ? 'white' : 'primary'"
                :disabled="!enableTrayIcon">
                Disabled
              </v-btn>
            </v-btn-toggle>
          </v-flex>
        </v-layout>
      </div>
    </v-layout>
  </v-navigation-drawer>
</template>

<script>
import axios from 'axios'
import compareVersions from 'compare-versions'

import { rules } from '@/mixins/rules'
import { openMainSite } from '@/mixins/shared'

const { app, dialog, BrowserWindow, shell, session } = require('electron').remote

export default {
  name: 'SettingsDrawer',
  mixins: [rules, openMainSite],
  props: {
    drawer: {
      type: Boolean,
      required: true
    },
    updateAvailable: {
      type: Boolean,
      required: true
    },
    isDownloading: {
      type: Boolean,
      required: true
    }
  },
  data: () => ({
    activeTab: 0,
    tabCategories: ['general', 'system'],
    folderSelectionDialogOpen: false,
    filenameFormats: [
      {
        text: 'Unix & ID',
        value: 0,
        example: '1567266047.224446266046251152'
      },
      {
        text: 'Date & ID',
        value: 1,
        example: '2019-08-31.224446266046251152'
      },
      {
        text: 'Date, Time & ID',
        value: 2,
        example: '2019-08-31-18h40m.224446266046251152'
      }
    ],
    updateInervalOptions: [
      {
        text: 'Never',
        value: 0
      },
      {
        text: '30 Minutes',
        value: 1800000
      },
      {
        text: '1 hour',
        value: 3600000
      },
      {
        text: '2 hours',
        value: 7200000
      },
      {
        text: '3 hours',
        value: 10800000
      },
      {
        text: '6 hours',
        value: 21600000
      },
      {
        text: '12 hours',
        value: 43200000
      },
      {
        text: '24 hours',
        value: 86400000
      }
    ],
    childWindow: null
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
    saveFolder: {
      get () {
        return this.$store.getters.saveFolder
      },
      set (value) {
        this.$store.commit('updateSaveFolder', value)
      }
    },
    userAgent: {
      get () {
        return this.$store.getters.userAgent
      },
      set (value) {
        this.$store.commit('updateUserAgent', value)
      }
    },
    timeout: {
      get () {
        return this.$store.getters.timeout
      },
      set (value) {
        this.$store.commit('updateTimeout', value)
      }
    },
    maxPosts: {
      get () {
        return this.$store.getters.maxPosts
      },
      set (value) {
        this.$store.commit('updateMaxPosts', value)
      }
    },
    sleepTimer: {
      get () {
        return this.$store.getters.sleepTimer
      },
      set (value) {
        this.$store.commit('updateSleepTimer', value)
      }
    },
    filenameFormat: {
      get () {
        return this.$store.getters.filenameFormat
      },
      set (value) {
        this.$store.commit('updateFilenameFormat', value)
      }
    },
    filenameHints () {
      return this.filenameFormats.map(format => format.example)
    },
    openFolderAccountClick: {
      get () {
        return this.$store.getters.openAccountFolder
      },
      set (value) {
        this.$store.commit('updateOpenAccountFolder', value)
      }
    },
    sessions () {
      return this.$store.getters.sessions
    },
    enableTrayIcon: {
      get () {
        return this.$store.getters.enableTrayIcon
      },
      set (value) {
        this.$store.commit('updateEnableTrayIcon', value)
      }
    },
    autoStart: {
      get () {
        return this.$store.getters.autoStart
      },
      set (value) {
        this.$store.commit('updateAutoStart', value)
      }
    },
    closeTray: {
      get () {
        return this.$store.getters.closeTray
      },
      set (value) {
        this.$store.commit('updateCloseTray', value)
      }
    },
    updateInterval: {
      get () {
        return this.$store.getters.updateInterval
      },
      set (value) {
        this.$store.commit('updateUpdateInterval', value)
      }
    }
  },
  mounted () {
    this.checkUpdates()
    this.$refs.timeoutInput.validate()
    this.$refs.maxPostsInput.validate()
  },
  methods: {
    restartApp () {
      app.relaunch()
      app.exit()
    },
    closeDrawer () {
      this.$emit('update:drawer', false)
    },
    changeSaveFolder () {
      this.folderSelectionDialogOpen = true

      dialog.showOpenDialog({
        properties: ['openDirectory']
      })
        .then(result => {
          this.folderSelectionDialogOpen = false

          if (result.cancelled || result.filePaths.length === 0) {
            return
          }

          this.saveFolder = result.filePaths[0]
        })
    },
    checkUpdates (silent = true) {
      const randomQuery = Math.floor(Math.random() * 1000000) + 9999999

      const url = `https://www.getraider.com/version.txt?${randomQuery}`

      axios.get(url, { timeout: 5000 })
        .then(response => {
          const currentVersion = app.getVersion()
          const serverVersion = response.data

          if (compareVersions.compare(currentVersion, serverVersion, '<')) {
            this.$emit('update:updateAvailable', true)

            this.$swal.fire({
              titleText: 'Update Available',
              text: 'There is a new version available.',
              icon: 'info',
              confirmButtonText: 'Get Update'
            })
              .then(result => {
                if (result.value) {
                  this.openMainSite()
                }
              })
          } else {
            this.$emit('update:updateAvailable', false)

            if (silent) {
              return
            }

            this.$swal.fire('Raider is up to date', 'You have the latest version installed.', 'info')
          }
        })
        .catch(err => {
          if (silent) {
            return
          }

          this.$store.commit('updateLog', err)
          this.$swal.fire('Error', 'We couldn\'t contact the update server', 'error')
        })
    },
    addNewAccount () {
      if (this.childWindow != null) {
        return
      }

      this.$swal.fire({
        titleText: 'Info',
        text: 'Close the popup window once you are logged in.',
        icon: 'info',
        timer: 5000
      })

      session.defaultSession.clearStorageData()
      session.defaultSession.flushStorageData()

      this.childWindow = new BrowserWindow({
        autoHideMenuBar: true
      })

      this.childWindow.loadURL('https://www.instagram.com/accounts/login/')
        .catch(e => {
          this.$swal.fire('Error', e.code, 'error')
          this.childWindow.close()
        })

      this.childWindow.on('close', e => {
        if (this.childWindow == null || this.childWindow.isDestroyed()) {
          return
        }

        this.childWindow.webContents.executeJavaScript('new Promise((resolve, reject) => { resolve(window._sharedData) }).then(res => res)', true)
          .then((result) => {
            const viewer = result.config.viewer || null

            if (viewer == null) {
              return this.$swal.fire('Login Failed', 'User account not detected. Kindly try again.', 'error')
            }

            const viewerID = viewer.id
            const viewerName = viewer.username
            const viewerProfilePic = viewer.profile_pic_url

            if (this.sessions.find(ses => ses.id === viewerID)) {
              return this.$swal.fire('Error', `${viewerName} already exists`, 'error')
            }

            session.defaultSession.cookies.get({})
              .then((cookies) => {
                this.$store.commit('addSession', {
                  id: viewerID,
                  name: viewerName,
                  avatar: viewerProfilePic,
                  cookies
                })
              }).catch(() => {
                this.$swal.fire('Error', 'Unable to fetch cookies', 'error')
              })
          })
          .catch(() => {
            this.$swal.fire('Error', 'Unable to fetch account details. Please try again.', 'error')
          })
      })

      this.childWindow.on('closed', () => {
        this.childWindow = null
      })
    },
    deleteAccount (user) {
      this.$swal.fire({
        title: `Delete ${user.name}`,
        text: 'Are you sure you want to delete this account?',
        icon: 'warning',
        allowEnterKey: false,
        showCancelButton: true,
        confirmButtonText: 'Yes',
        confirmButtonColor: '#FF5252',
        cancelButtonColor: '#1976D2'
      }).then((result) => {
        if (result.value) {
          this.$store.commit('deleteSession', user.id)
        }
      })
    },
    getUseragent () {
      shell.openExternal('https://www.getraider.com/user-agent')
    }
  }
}
</script>

<style lang="scss" scoped>
#accounts-section {
  min-height: 60px;
  max-height: 120px;

  > div {
    max-height: 120px;
  }
}
</style>
