<template>
  <div>
    <toolbar
      :acc-drawer.sync="accDrawer"
      :settings-drawer.sync="settingsDrawer" />

    <accounts-drawer
      :drawer.sync="accDrawer"
      :input.sync="inputValue"
      :is-downloading="isDownloading"
      :update-all="updateAll" />

    <settings-drawer
      :drawer.sync="settingsDrawer"
      :update-available.sync="updateAvailable"
      :is-downloading="isDownloading" />

    <v-layout
      pt-3
      fill-height
      column>
      <!-- Input Field -->
      <v-form
        ref="form"
        @submit.prevent="startDownload">
        <v-layout
          wrap
          justify-center>
          <v-flex
            sm10
            md7
            lg6>
            <v-text-field
              v-model.trim="inputValue"
              :loading="isDownloading"
              :readonly="isDownloading"
              :clearable="!isDownloading"
              solo
              :rules="[rules.required, rules.validUsername]"
              placeholder="Enter username" />
          </v-flex>
        </v-layout>
      </v-form>

      <!-- Media type toggles -->
      <media-type-toggles :disabled="isDownloading" />

      <!-- More Options Icon -->
      <v-layout
        shrink
        justify-center
        align-center
        pt-3
        column>
        <v-flex>
          <v-badge
            v-model="filtersActive"
            class="filter-badge"
            color="error"
            right
            @click.native="resetFilters">
            <template #badge>
              <span>x</span>
            </template>
            <span
              class="secondary--text body-2"
              :class="{ 'error--text' : filtersActive, 'text--lighten-4': !filtersActive }">
              {{ filtersActive ? 'Active' : 'More' }}
            </span>
          </v-badge>
        </v-flex>
        <v-flex>
          <v-icon
            id="more-btn"
            :disabled="isDownloading"
            class="px-5 py-2"
            :class="{ 'closed': !showMoreOptions }"
            @click.native="toggleMoreOptions">
            {{ showMoreOptions ? '$vuetify.icons.up' : '$vuetify.icons.dropdown' }}
          </v-icon>
        </v-flex>
      </v-layout>

      <!-- More Options Section -->
      <more-options
        v-show="showMoreOptions"
        :max.sync="maxPosts"
        :toggle.sync="showMoreOptions" />

      <!-- Start Button -->
      <v-layout
        v-show="!showMoreOptions && !isDownloading"
        shrink
        mt-4
        justify-center
        align-center>
        <v-btn
          id="start-btn"
          color="primary"
          large
          @click="startDownload">
          Start
        </v-btn>
      </v-layout>

      <!-- Download UI -->
      <div v-if="isDownloading">
        <v-layout
          class="text-xs-center"
          mt-4
          mb-3
          justify-center
          align-center>
          <v-flex
            sm3
            md2>
            <div class="title mb-2">
              Total
            </div>
            <div class="headline warning--text">
              {{ massDownload ? savedAccounts.length : pendingDownloads.length }}
            </div>
          </v-flex>

          <v-flex
            sm2
            md2>
            <v-progress-circular
              :rotate="-90"
              :width="10"
              :size="110"
              color="primary"
              :value="massDownload ? massDownloadProgress : downloadProgress">
              <span class="title font-weight-regular">
                {{ massDownload ? currentAccountIndex : currentDownloadIndex }}
              </span>
            </v-progress-circular>
          </v-flex>

          <v-flex
            sm3
            md2>
            <div class="title mb-2">
              Failed
            </div>
            <div class="headline error--text">
              {{ massDownload ? failedAccounts : failedDownloads }}
            </div>
          </v-flex>
        </v-layout>

        <v-layout
          justify-center>
          <v-btn
            round
            flat
            color="error"
            @click="massDownload ? cancelMassDownload() : cancelDownload()">
            {{ massDownload ? 'Cancel Update' : 'Cancel' }}
          </v-btn>
        </v-layout>
      </div>

      <!-- Download Summary -->
      <v-layout
        v-show="showDownloadSummary"
        mt-5
        shrink
        align-center
        column>
        <div class="mb-2 subheading font-weight-medium">
          Download Summary
        </div>
        <div class="warning--text subheading">
          Total {{ massDownloadCompleted ? savedAccounts.length : pendingDownloads.length }}
        </div>
        <div class="error--text subheading">
          Failed {{ massDownloadCompleted ? failedAccounts : failedDownloads }}
        </div>
        <v-btn
          flat
          round
          color="primary"
          class="text-none"
          @click="hideDownloadSummary">
          Close Summary
        </v-btn>
      </v-layout>

      <!-- Info Section -->
      <v-layout
        v-show="!showDownloadSummary"
        id="info-section"
        class="full-width"
        column
        align-center>
        <div
          v-if="updateAvailable"
          class="body-2">
          There is a new version available
        </div>
        <div
          v-else-if="totalDownloads > 5"
          class="body-2">
          You have downloaded <span class="accent--text">{{ totalDownloads.toLocaleString() }}</span> files using Raider
        </div>
        <v-btn
          v-if="updateAvailable"
          dark
          color="success"
          @click="openMainSite">
          Get Update
        </v-btn>
        <v-btn
          v-else
          dark
          color="accent"
          @click="openPatreon">
          Donate Today
        </v-btn>
      </v-layout>

      <v-icon
        id="bug-icon"
        color="error"
        @click.native="toggleDebugDialog">
        $vuetify.icons.bug
      </v-icon>
    </v-layout>

    <debug-dialog :dialog.sync="debugDialog" />
  </div>
</template>

<script>
import fs from 'fs-extra'
import path from 'path'
import axios from 'axios'
import logger from 'electron-log'
import axiosRetry from 'axios-retry'

import { rules } from '@/mixins/rules'
import { openMainSite, addLogEntry } from '@/mixins/shared'

import Toolbar from '@/components/Toolbar'
import AccountsDrawer from '@/components/AccountsDrawer'
import SettingsDrawer from '@/components/SettingsDrawer'

import DebugDialog from '@/components/DebugDialog'
import MediaTypeToggles from '@/components/MediaTypeToggles'
import MoreOptions from '@/components/MoreOptions'

axiosRetry(axios, { retryDelay: axiosRetry.exponentialDelay })

const { ipcRenderer } = require('electron')
const { session, shell } = require('electron').remote

// Query hashes
const profileHash = '69cba40317214236af40e7efa697781d'
const storiesHash = '303a4ae99711322310f25250d988f3b7'
const highlightsIdsHash = 'd4d88dc1500312af6f937f7b804c68c3'
const highlightsHash = '303a4ae99711322310f25250d988f3b7'

export default {
  name: 'Home',
  components: {
    Toolbar,
    AccountsDrawer,
    SettingsDrawer,
    DebugDialog,
    MediaTypeToggles,
    MoreOptions
  },
  mixins: [rules, openMainSite, addLogEntry],
  data: () => ({
    accDrawer: false,
    settingsDrawer: false,

    updateAvailable: false,

    debugDialog: false,

    inputValue: '',

    showMoreOptions: false,
    maxPosts: 0,

    downloadStarted: false,
    downloadCompleted: false,

    requestedUser: null,
    triedSessions: [],
    csrfToken: 'NGIgrbxpRQOzEQw6Ef6LIkyCYTdImmvC',

    highlightsIds: [],

    userSaveFolder: null,
    totalPosts: 0,
    downloadedIds: [],

    currentDownloadIndex: 0,
    pendingDownloads: [],
    failedDownloads: 0,

    savedAccounts: [],
    currentAccountIndex: 0,
    failedAccounts: 0,
    massUpdateTimeoutId: null,
    massDownload: false,
    massDownloadCompleted: false
  }),
  computed: {
    filtersActive () {
      return this.maxPosts !== 0 && this.maxPosts != null
    },
    saveFolder () {
      return this.$store.getters.saveFolder
    },
    mediaTypes () {
      return this.$store.getters.mediaTypes
    },
    accountsFile () {
      return this.$store.getters.accountsFile
    },
    userIdsFile () {
      return path.join(this.userSaveFolder, '_ids')
    },
    sessions () {
      return this.$store.getters.sessions
    },
    downloadTimeout () {
      return this.$store.getters.timeout * 1000
    },
    massUpdateMaxPosts () {
      return this.$store.getters.maxPosts
    },
    massUpdateSleepTimer () {
      return this.$store.getters.sleepTimer
    },
    massUpdateLastFetch () {
      return this.$store.getters.massUpdateLastFetch
    },
    filenameFormat () {
      return this.$store.getters.filenameFormat
    },
    totalDownloads () {
      return this.$store.getters.totalDownloads
    },
    isDownloading () {
      return this.downloadStarted && !this.downloadCompleted
    },
    downloadProgress () {
      return Math.round((this.currentDownloadIndex / this.pendingDownloads.length) * 100) || 0
    },
    massDownloadProgress () {
      return Math.round((this.currentAccountIndex / this.savedAccounts.length) * 100) || 0
    },
    showDownloadSummary () {
      return (this.downloadCompleted || this.massDownloadCompleted) && !this.isDownloading
    },
    getImages () {
      return this.mediaTypes.includes('images')
    },
    getVideos () {
      return this.mediaTypes.includes('videos')
    },
    getStories () {
      return this.mediaTypes.includes('stories') && this.sessions.length > 0
    },
    getHighlights () {
      return this.mediaTypes.includes('highlights') && this.sessions.length > 0
    }
  },
  watch: {
    maxPosts () {
      this.maxPosts = Number(this.maxPosts)
    }
  },
  created () {
    logger.catchErrors({
      onError: (error) => {
        if (error != null) {
          this.massDownload ? this.cancelMassDownload() : this.cancelDownload()
        }
      }
    })

    ipcRenderer.on('start-download', (event, args) => {
      this.inputValue = args
    })
  },
  mounted () {
    this.changeSession()
      .catch(() => { })
  },
  methods: {
    toggleMoreOptions () {
      this.showMoreOptions = !this.showMoreOptions
    },
    resetFilters () {
      if (this.isDownloading) {
        return
      }

      this.maxPosts = 0
    },
    startDownload () {
      if (!fs.existsSync(this.saveFolder)) {
        return this.$swal.fire('Error', 'Save folder not found.', 'error')
      }

      if (!this.$refs.form.validate() && !this.massDownload) {
        return
      }

      this.$store.dispatch('createAccountsFile')

      this.resetVariables()

      this.getProfile()
    },
    resetVariables () {
      while (this.triedSessions.length > 1) {
        this.triedSessions.shift()
      }

      while (this.pendingDownloads.length > 0) {
        this.pendingDownloads.pop()
      }

      while (this.highlightsIds.length > 0) {
        this.highlightsIds.pop()
      }

      this.showMoreOptions = false

      this.downloadStarted = true
      this.downloadCompleted = false
      this.massDownloadCompleted = false

      this.failedDownloads = 0
      this.currentDownloadIndex = 0
    },
    getProfile () {
      const url = `https://www.instagram.com/${this.inputValue.trim()}/?__a=1`

      axios.get(url)
        .then((response) => {
          this.requestedUser = Object.keys(response.data).length > 0 ? response.data.graphql.user : null

          if (this.requestedUser == null) {
            this.changeSession()
              .then(() => {
                this.getProfile()
              })
              .catch(error => {
                error.name = ''
                this.massDownload ? this.nextAccount({ error: true }) : this.showErrorDialog(`${this.inputValue.trim()} not found.`, { cancel: true })
              })
          } else {
            this.totalPosts = (this.maxPosts != null && this.maxPosts !== 0) ? this.maxPosts : this.requestedUser.edge_owner_to_timeline_media.count

            const username = this.requestedUser.username
            const isPrivate = this.requestedUser.is_private
            const isBlocked = this.requestedUser.blocked_by_viewer
            const viewerFollower = this.requestedUser.followed_by_viewer

            this.addLogEntry(`${username} found`)

            if (isBlocked) {
              this.addLogEntry(`${username} is blocked by current viewer`)
            }

            if (isPrivate && !viewerFollower) {
              this.changeSession()
                .then(() => {
                  this.getProfile()
                })
                .catch(error => {
                  error.name = ''
                  this.massDownload ? this.nextAccount({ error: true }) : this.showErrorDialog(error, { cancel: true })
                })
            } else {
              this.setupFolder()
            }
          }
        })
        .catch((error) => {
          this.addLogEntry(error)

          try {
            if (error.response.status === 429) {
              return this.handleRateLimit()
            }
          } catch (e) { }

          this.massDownload ? this.nextAccount({ error: true }) : this.showErrorDialog(`${this.inputValue.trim()} not found.`, { cancel: true, footer: error.message })
        })
    },
    changeSession () {
      return new Promise((resolve, reject) => {
        const unusedSession = this.sessions.find(session => !this.triedSessions.includes(session.id))

        if (unusedSession == null) {
          if (this.sessions == null) {
            reject(new Error('Kindly add your Instagram account to download from private accounts.'))
          }

          reject(new Error('Unable to load account. Make sure you are follower and not blocked.'))
        }

        unusedSession.cookies.forEach(cookie => {
          if (cookie.name === 'csrftoken') {
            this.csrfToken = cookie.value
          }

          session.defaultSession.cookies.set({
            url: 'https://www.instagram.com',
            domain: cookie.domain,
            name: cookie.name,
            value: cookie.value,
            secure: cookie.secure,
            path: cookie.path,
            httpOnly: cookie.httpOnly,
            expirationDate: cookie.expirationDate || 0
          }, error => {
            if (error) {
              reject(new Error('There was an error while changing sessions.'))
            }
          })
        })

        this.addLogEntry(`Changed session to ${unusedSession.name}`)
        this.triedSessions.push(unusedSession.id)
        resolve()
      })
    },
    setupFolder () {
      fs.readFile(this.accountsFile, 'utf8')
        .then((data) => {
          if (data != null && data !== '') {
            let parsedData

            try {
              parsedData = JSON.parse(data)
            } catch (error) {
              this.addLogEntry(error)
              return this.massDownload ? this.nextAccount({ error: true }) : this.showErrorDialog('Unable to parse accounts file.', { cancel: true })
            }

            let userIndex = parsedData.findIndex(value => value.userid === this.requestedUser.id)

            if (userIndex < 0) {
              userIndex = parsedData.findIndex(value => value.username === this.requestedUser.username && value.pendingRefresh === true)
            }

            if (userIndex >= 0) {
              parsedData[userIndex].username = this.requestedUser.username

              if (parsedData[userIndex].pendingRefresh) {
                parsedData[userIndex].userid = this.requestedUser.id
                delete parsedData[userIndex].pendingRefresh
              }

              fs.writeFileSync(this.accountsFile, JSON.stringify(parsedData))

              this.userSaveFolder = path.join(this.saveFolder, parsedData[userIndex].name)

              fs.ensureDirSync(this.userSaveFolder)

              const data = fs.existsSync(this.userIdsFile) ? fs.readFileSync(this.userIdsFile, 'utf8') : ''
              this.downloadedIds = data.trim().split(/\r?\n/)

              this.iterateProfile()
            } else {
              this.createUserFolder()
            }
          } else {
            this.createUserFolder()
          }
        })
        .catch((error) => {
          this.addLogEntry(error)
          this.showErrorDialog('Unable to read accounts file.', { cancel: true })
        })
    },
    createUserFolder () {
      this.$swal.fire({
        title: 'Enter save folder name',
        input: 'text',
        inputPlaceholder: this.requestedUser.username,
        inputAttributes: {
          autocapitalize: 'off'
        },
        allowOutsideClick: false,
        showCancelButton: true
      }).then((result) => {
        if (result.dismiss) {
          return this.cancelDownload()
        }

        const enteredFolderName = result.value === '' ? this.requestedUser.username : result.value.trim()
        this.userSaveFolder = path.join(this.saveFolder, enteredFolderName)

        if (fs.existsSync(this.userSaveFolder)) {
          try {
            fs.rmdirSync(this.userSaveFolder)
          } catch (error) {
            this.addLogEntry(error)

            if (error.code === 'ENOTEMPTY') {
              this.$swal.fire({
                titleText: 'Folder Already Exists',
                text: 'A folder with the same name already exists but it is not empty. Do you want to use it?',
                icon: 'error',
                allowOutsideClick: false,
                allowEnterKey: false,
                showCancelButton: true,
                confirmButtonText: 'Yes',
                confirmButtonColor: '#FF5252',
                cancelButtonColor: '#1976D2'
              })
                .then(result => {
                  if (result.dismiss) {
                    return this.cancelDownload()
                  }

                  this.addAccount(enteredFolderName, true)
                })

              return
            } else {
              return this.showErrorDialog('There was an error while creating the folder.', { cancel: true })
            }
          }

          fs.mkdirSync(this.userSaveFolder)

          this.addAccount(enteredFolderName)
        } else {
          fs.mkdir(this.userSaveFolder)
            .then(() => {
              this.addAccount(enteredFolderName)
            })
            .catch((error) => {
              this.addLogEntry(error)

              error.name = ''
              this.showErrorDialog('Unable to create folder.', { cancel: true, footer: error })
            })
        }
      })
    },
    addAccount (folder, restart = false) {
      const newUser = {
        name: folder,
        username: this.requestedUser.username,
        userid: this.requestedUser.id,
        updated: Date.now()
      }

      fs.readFile(this.accountsFile, 'utf8')
        .then((data) => {
          let parsedData

          if (data != null && data !== undefined && data !== '') {
            try {
              parsedData = JSON.parse(data)
            } catch (error) {
              this.addLogEntry(error)
              return this.showErrorDialog('Unable to parse accounts file.', { cancel: true })
            }
          } else {
            parsedData = []
          }

          parsedData.push(newUser)

          fs.writeFile(this.accountsFile, JSON.stringify(parsedData))
            .then(() => {
              restart ? this.setupFolder() : this.iterateProfile()
            })
            .catch((error) => {
              this.addLogEntry(error)
              this.showErrorDialog('Unable to save accounts file.', { catch: true })
            })
        })
        .catch((error) => {
          this.addLogEntry(error)
          this.showErrorDialog('Unable to add account.', { cancel: true })
        })
    },
    iterateProfile (cursor = null) {
      if (!this.downloadStarted) {
        return
      }

      if (!this.getImages && !this.getVideos) {
        return this.iterateStories()
      }

      const queryVariables = JSON.stringify(this.generateQueryVariables(this.requestedUser.id, this.totalPosts, cursor))

      const url = `https://www.instagram.com/graphql/query/?query_hash=${profileHash}&variables=${queryVariables}`

      axios.get(url, {
        timeout: this.downloadTimeout,
        headers: {
          'X-CSRFToken': this.csrfToken
        }
      })
        .then((response) => {
          const timelineMedia = response.data.data.user.edge_owner_to_timeline_media

          const edges = timelineMedia.edges
          const pageInfo = timelineMedia.page_info

          if (edges == null || edges.length <= 0) {
            return this.iterateStories()
          }

          edges.forEach(edge => {
            this.addLink(edge.node)
          })

          if (pageInfo.has_next_page && this.totalPosts !== 0) {
            return this.iterateProfile(pageInfo.end_cursor)
          }

          this.iterateStories()
        })
        .catch((error) => {
          this.addLogEntry(error)

          try {
            if (error.response.status === 429) {
              return this.handleRateLimit()
            }
          } catch (e) { }

          this.massDownload ? this.nextAccount({ error: true }) : this.showErrorDialog('Unable to iterate profile', { cancel: true })
        })
    },
    addLink (edge) {
      const username = this.requestedUser.username
      const userid = this.requestedUser.id
      const mediaType = edge.__typename
      const timestamp = edge.taken_at_timestamp

      if (this.totalPosts > 0) {
        this.totalPosts--
      }

      if (mediaType === 'GraphImage' && this.getImages) {
        this.pendingDownloads.push({
          userid,
          username,
          id: edge.id,
          link: edge.display_resources.reverse()[0].src,
          timestamp,
          isVideo: false
        })
      } else if (mediaType === 'GraphVideo' && this.getVideos) {
        this.pendingDownloads.push({
          userid,
          username,
          id: edge.id,
          link: edge.video_url,
          timestamp,
          isVideo: true
        })
      } else if (mediaType === 'GraphSidecar') {
        edge.edge_sidecar_to_children.edges.forEach(edge => {
          if (edge.node.__typename === 'GraphImage' && this.getImages) {
            this.pendingDownloads.push({
              userid,
              username,
              id: edge.node.id,
              link: edge.node.display_resources.reverse()[0].src,
              timestamp,
              isVideo: false
            })
          } else if (edge.node.__typename === 'GraphVideo' && this.getVideos) {
            this.pendingDownloads.push({
              userid,
              username,
              id: edge.node.id,
              link: edge.node.video_url,
              timestamp,
              isVideo: true
            })
          }
        })
      }
    },
    iterateStories () {
      if (!this.downloadStarted) {
        return
      }

      if (!this.getStories) {
        return this.fetchHighlights()
      }

      const queryVariables = JSON.stringify({
        reel_ids: [this.requestedUser.id],
        tag_names: [],
        location_ids: [],
        highlight_reel_ids: [],
        precomposed_overlay: false,
        show_story_viewer_list: true,
        story_viewer_fetch_count: 100,
        story_viewer_cursor: '',
        stories_video_dash_manifest: false
      })

      const url = `https://www.instagram.com/graphql/query/?query_hash=${storiesHash}&variables=${queryVariables}`

      axios.get(url, {
        timeout: this.downloadTimeout
      })
        .then((response) => {
          let stories = null

          try {
            stories = response.data.data.reels_media[0].items
          } catch (error) {
            this.addLogEntry(error)
            stories = []
          }

          if (stories == null || stories.length <= 0) {
            return this.fetchHighlights()
          }

          const username = this.requestedUser.username
          const userid = this.requestedUser.id

          stories.forEach(story => {
            const id = story.id
            const isVideo = story.is_video
            const timestamp = story.taken_at_timestamp

            if (isVideo) {
              this.pendingDownloads.push({
                userid,
                username,
                id,
                link: story.video_resources.reverse()[0].src,
                timestamp,
                isVideo,
                isStory: true
              })
            } else {
              this.pendingDownloads.push({
                userid,
                username,
                id,
                link: story.display_resources.reverse()[0].src,
                timestamp,
                isVideo,
                isStory: true
              })
            }
          })

          this.fetchHighlights()
        })
        .catch((error) => {
          this.addLogEntry(error)

          try {
            if (error.response.status === 429) {
              return this.handleRateLimit()
            }
          } catch (e) { }

          this.massDownload ? this.nextAccount({ error: true }) : this.showErrorDialog('Unable to fetch stories', { cancel: true })
        })
    },
    fetchHighlights () {
      if (!this.downloadStarted) {
        return
      }

      if (!this.getHighlights) {
        return this.downloadLink()
      }

      const queryVariables = JSON.stringify({
        user_id: this.requestedUser.id,
        include_chaining: true,
        include_reel: true,
        include_suggested_users: false,
        include_logged_out_extras: false,
        include_highlight_reels: true,
        include_live_status: true
      })

      const url = `https://www.instagram.com/graphql/query/?query_hash=${highlightsIdsHash}&variables=${queryVariables}`

      axios.get(url, {
        timeout: this.downloadTimeout
      })
        .then((response) => {
          let highlights = null

          try {
            highlights = response.data.data.user.edge_highlight_reels.edges
          } catch (error) {
            this.addLogEntry(error)
            highlights = []
          }

          if (highlights == null || highlights.length <= 0) {
            return this.downloadLink()
          }

          highlights.forEach((highlight, index) => {
            this.highlightsIds.push(highlight.node.id)
          })

          this.iterateHighlights()
        })
        .catch((error) => {
          this.addLogEntry(error)

          try {
            if (error.response.status === 429) {
              return this.handleRateLimit()
            }
          } catch (e) { }

          this.massDownload ? this.nextAccount({ error: true }) : this.showErrorDialog('Unable to fetch highlights', { cancel: true })
        })
    },
    iterateHighlights () {
      if (!this.downloadStarted) {
        return
      }

      if (this.highlightsIds.length <= 0) {
        return this.downloadLink()
      }

      const highlightsArray = []

      while (highlightsArray.length < 10 && this.highlightsIds.length > 0) {
        highlightsArray.push(this.highlightsIds[0])
        this.highlightsIds.shift()
      }

      const queryVariables = JSON.stringify({
        reel_ids: [],
        tag_names: [],
        location_ids: [],
        highlight_reel_ids: highlightsArray,
        precomposed_overlay: false,
        show_story_viewer_list: true,
        story_viewer_fetch_count: 100,
        story_viewer_cursor: '',
        stories_video_dash_manifest: false
      })

      const url = `https://www.instagram.com/graphql/query/?query_hash=${highlightsHash}&variables=${queryVariables}`

      const username = this.requestedUser.username
      const userid = this.requestedUser.id

      axios.get(url, {
        timeout: this.downloadTimeout
      })
        .then((response) => {
          const reels = response.data.data.reels_media || []

          reels.forEach(reel => {
            reel.items.forEach(item => {
              const id = item.id
              const isVideo = item.is_video
              const timestamp = item.taken_at_timestamp

              if (isVideo) {
                this.pendingDownloads.push({
                  userid,
                  username,
                  id,
                  link: item.video_resources.reverse()[0].src,
                  timestamp,
                  isVideo,
                  isHighlight: true
                })
              } else {
                this.pendingDownloads.push({
                  userid,
                  username,
                  id,
                  link: item.display_resources.reverse()[0].src,
                  timestamp,
                  isVideo,
                  isHighlight: true
                })
              }
            })
          })

          if (this.highlightsIds.length > 0) {
            return this.iterateHighlights()
          }

          this.downloadLink()
        })
        .catch((error) => {
          this.addLogEntry(error)

          try {
            if (error.response.status === 429) {
              return this.handleRateLimit()
            }
          } catch (e) { }

          this.massDownload ? this.nextAccount({ error: true }) : this.showErrorDialog('Unable to fetch highlights', { cancel: true })
        })
    },
    downloadLink () {
      if (this.pendingDownloads.length <= 0) {
        return this.completeDownload()
      }

      if (!this.downloadStarted) {
        return
      }

      fs.ensureDirSync(path.resolve(this.userSaveFolder, 'Stories'))
      fs.ensureDirSync(path.resolve(this.userSaveFolder, 'Highlights'))

      const post = this.pendingDownloads[this.currentDownloadIndex]
      const postDateObj = new Date(post.timestamp * 1000)
      let postTimestamp = null

      switch (this.filenameFormat) {
        case 1:
          postTimestamp = `${postDateObj.getFullYear()}-${(postDateObj.getMonth() + 1).toString().padStart(2, 0)}-${postDateObj.getDate().toString().padStart(2, 0)}`
          break

        case 2:
          postTimestamp = `${postDateObj.getFullYear()}-${(postDateObj.getMonth() + 1).toString().padStart(2, 0)}-${postDateObj.getDate().toString().padStart(2, 0)}-${postDateObj.getHours().toString().padStart(2, 0)}h${postDateObj.getMinutes().toString().padStart(2, 0)}m`
          break

        default:
          postTimestamp = post.timestamp
          break
      }

      const filename = path.resolve(this.userSaveFolder, post.isStory ? 'Stories' : '', post.isHighlight ? 'Highlights' : '', `${postTimestamp}.${post.id}.${post.isVideo ? 'mp4' : 'jpg'}`)

      if (this.downloadedIds.includes(post.id.toString())) {
        return this.nextPost()
      }

      if (fs.existsSync(filename)) {
        fs.appendFileSync(this.userIdsFile, post.id + '\n')
        return this.nextPost()
      }

      axios.get(post.link, {
        validateStatus: status => {
          return status === 200
        },
        timeout: this.downloadTimeout,
        responseType: 'arraybuffer'
      })
        .then(response => {
          if (!this.downloadStarted) {
            return
          }

          try {
            fs.writeFileSync(path.resolve(filename), Buffer.from(response.data))
            fs.appendFileSync(this.userIdsFile, post.id + '\n')
            this.$store.commit('updateTotalDownloads', 1)
          } catch (error) {
            fs.removeSync(path.resolve(filename))
            this.$store.commit('updateTotalDownloads', -1)
            this.addLogEntry(error)
            this.showErrorDialog('Unable to save file to disk. Ensure you have enough space then try again', { cancel: true })
          }
        })
        .catch((error) => {
          this.addLogEntry(error)
          this.failedDownloads++
        })
        .finally(() => {
          this.nextPost()
        })
    },
    nextPost () {
      this.currentDownloadIndex++

      if (this.currentDownloadIndex >= this.pendingDownloads.length) {
        return this.completeDownload()
      }

      this.downloadLink()
    },
    generateQueryVariables (id, count = 50, cursor = null) {
      if (cursor) {
        return { id, first: count > 50 ? 50 : count, after: cursor }
      }
      return { id, first: count > 50 ? 50 : count }
    },
    handleRateLimit () {
      this.massDownload ? this.cancelMassDownload() : this.cancelDownload()
      return this.$swal.fire('Download Cancelled', 'You are being rate limited. Try again later.', 'error')
    },
    cancelDownload () {
      this.downloadStarted = false
      this.downloadCompleted = false
    },
    cancelMassDownload (opts = null) {
      this.cancelDownload()
      this.massDownloadCompleted = !!((opts != null && opts.complete === true))
      this.massDownload = false

      this.clearMassUpdateTimeout()

      this.resetFilters()
      this.$refs.form.reset()
    },
    async completeDownload () {
      if (!this.massDownload) {
        this.downloadStarted = false
        this.downloadCompleted = true
      }

      await this.setAccountUpdateTime()
        .catch(() => { })

      if (this.massDownload) {
        this.nextAccount()
      }
    },
    setAccountUpdateTime () {
      return new Promise((resolve, reject) => {
        fs.readFile(this.accountsFile, 'utf8')
          .then((data) => {
            if (data != null && data !== '') {
              let parsedData

              try {
                parsedData = JSON.parse(data)

                const userIndex = parsedData.findIndex(value => value.userid === this.requestedUser.id)

                parsedData[userIndex].updated = Date.now()

                fs.writeFileSync(this.accountsFile, JSON.stringify(parsedData))

                resolve('success')
              } catch (error) {
                this.addLogEntry(error)
                reject(new Error('setAccountUpdateTime failed'))
              }
            }
          })
          .catch((error) => {
            this.addLogEntry(error)
            reject(new Error('setAccountUpdateTime failed'))
          })
      })
    },
    showErrorDialog (error, opt) {
      if (error.name) {
        error.name = ''
      }

      this.$swal.fire({
        titleText: 'Error',
        text: error,
        icon: 'error',
        footer: opt.footer ? opt.footer.toString() : null
      })

      this.addLogEntry(error)

      if (opt.cancel) {
        this.cancelDownload()
      }
    },
    updateAll (accs) {
      if (!fs.existsSync(this.saveFolder)) {
        return this.$swal.fire('Update Failed', 'Save folder not found.', 'error')
      }

      if (this.isDownloading) {
        return
      }

      if (accs.length <= 0) {
        return
      }

      this.$swal.close()

      this.savedAccounts = accs

      this.maxPosts = this.massUpdateMaxPosts

      if (this.massUpdateMaxPosts < 10) {
        this.maxPosts = 10
      } else if (this.massUpdateMaxPosts > 200) {
        this.maxPosts = 200
      }

      this.massDownload = true
      this.massDownloadCompleted = false

      this.failedAccounts = 0
      this.currentAccountIndex = -1

      this.$store.commit('updateMassUpdateLastFetch', 0)

      this.nextAccount()
    },
    nextAccount (opts = null) {
      if (opts != null && opts.error === true) {
        this.failedAccounts++
      }

      if (!this.massDownload) {
        this.clearMassUpdateTimeout()
        return
      }

      const sleepDuration = this.massUpdateSleepTimer <= 0 ? 5000 : this.massUpdateSleepTimer * 1000

      if ((Date.now() - this.massUpdateLastFetch) < sleepDuration) {
        this.clearMassUpdateTimeout()
        this.massUpdateTimeoutId = setTimeout(this.nextAccount, 5000)
        return
      }

      this.$store.commit('updateMassUpdateLastFetch', Date.now())

      this.currentAccountIndex++

      if (this.currentAccountIndex >= this.savedAccounts.length) {
        return this.cancelMassDownload({ complete: true })
      }

      this.inputValue = this.savedAccounts[this.currentAccountIndex].username

      this.startDownload()
    },
    clearMassUpdateTimeout () {
      if (this.massUpdateTimeoutId == null) {
        return
      }

      clearTimeout(this.massUpdateTimeoutId)
      this.massUpdateTimeoutId = null
    },
    hideDownloadSummary () {
      this.downloadCompleted = false
      this.massDownloadCompleted = false
    },
    toggleDebugDialog () {
      this.debugDialog = !this.debugDialog
    },
    openPatreon () {
      shell.openExternal('https://www.patreon.com/assetkid')
    }
  }
}
</script>

<style lang="scss" scoped>
.filter-badge {
  cursor: pointer;
}

#more-btn {
  cursor: pointer;

  &.closed {
    animation: mover 0.65s infinite alternate;
  }
}

#start-btn {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  animation: pulse 1s infinite alternate;
}

#info-section {
  position: absolute;
  bottom: 10px;
}

#bug-icon {
  cursor: pointer;
  position: absolute;
  bottom: 5px;
  right: 5px;
  opacity: 0;

  &:hover {
    opacity: 0.5;
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(0.95);
  }
}

@keyframes mover {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-4px);
  }
}
</style>
