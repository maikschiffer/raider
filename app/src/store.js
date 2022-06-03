import Vue from 'vue'
import Vuex from 'vuex'
import path from 'path'
import fs from 'fs-extra'
import Store from 'electron-store'

const { ipcRenderer } = require('electron')
const { app, session } = require('electron').remote

const store = new Store({
  name: 'prefs',
  fileExtension: '',
  defaults: {
    appName: 'Raider'
  }
})

const SAVE_FOLDER_KEY = 'saveFolder'
const USER_AGENT_KEY = 'userAgent'
const MEDIA_TYPES_KEY = 'mediaTypes'
const TIMEOUT_KEY = 'timeout'
const MAX_POSTS_KEY = 'maxPosts'
const SLEEP_TIMER_KEY = 'sleepTimer'
const FILENAME_FORMAT_KEY = 'filenameFormat'
const OPEN_ACCOUNR_FOLDER_KEY = 'openAccountFolder'
const SESSIONS_KEY = 'sessions'
const TOTAL_DOWNLOADS_KEY = 'totalDownloads'
const UPDATE_INTERVAL_KEY = 'updateInterval'
const ENABLE_SYSTEM_TRAY_ICON_KEY = 'enableTrayIcon'
const AUTOSTART_KEY = 'autoStart'
const CLOSE_TO_TRAY_KEY = 'closeTray'

Vue.use(Vuex)

const defaultUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36'

export default new Vuex.Store({
  state: {
    saveFolder: store.get(SAVE_FOLDER_KEY, path.join(app.getPath('downloads'), 'Raider')),
    userAgent: store.get(USER_AGENT_KEY, defaultUserAgent),
    mediaTypes: store.get(MEDIA_TYPES_KEY, ['images', 'videos', 'stories', 'highlights']),
    timeout: store.get(TIMEOUT_KEY, 60),
    maxPosts: store.get(MAX_POSTS_KEY, 50),
    sleepTimer: store.get(SLEEP_TIMER_KEY, 5),
    filenameFormat: store.get(FILENAME_FORMAT_KEY, 0),
    openAccountFolder: store.get(OPEN_ACCOUNR_FOLDER_KEY, false),
    sessions: store.get(SESSIONS_KEY, []),
    totalDownloads: store.get(TOTAL_DOWNLOADS_KEY, 0),
    updateInterval: store.get(UPDATE_INTERVAL_KEY, 0),
    enableTrayIcon: store.get(ENABLE_SYSTEM_TRAY_ICON_KEY, false),
    autoStart: store.get(AUTOSTART_KEY, false),
    closeTray: store.get(CLOSE_TO_TRAY_KEY, true),
    massUpdateLastFetch: 0,
    log: ['Instagram Raider Log\n']
  },
  mutations: {
    updateSaveFolder (state, payload) {
      state.saveFolder = payload
      store.set(SAVE_FOLDER_KEY, payload)
    },
    updateUserAgent (state, payload) {
      state.userAgent = payload.trim()
      store.set(USER_AGENT_KEY, payload)
    },
    updateMediaTypes (state, payload) {
      state.mediaTypes = payload
      store.set(MEDIA_TYPES_KEY, payload)
    },
    updateTimeout (state, payload) {
      payload = Number(payload)

      state.timeout = payload
      store.set(TIMEOUT_KEY, payload)
    },
    updateMaxPosts (state, payload) {
      payload = Number(payload)

      state.maxPosts = payload
      store.set(MAX_POSTS_KEY, payload)
    },
    updateSleepTimer (state, payload) {
      payload = Number(payload)

      state.sleepTimer = payload
      store.set(SLEEP_TIMER_KEY, payload)
    },
    updateFilenameFormat (state, payload) {
      state.filenameFormat = payload
      store.set(FILENAME_FORMAT_KEY, payload)
    },
    updateOpenAccountFolder (state, payload) {
      state.openAccountFolder = payload
      store.set(OPEN_ACCOUNR_FOLDER_KEY, payload)
    },
    createAccountsFile (state, payload) {
      if (!fs.existsSync(payload)) {
        fs.ensureFileSync(payload)
      }
    },
    addSession (state, payload) {
      state.sessions.push(payload)
      store.set(SESSIONS_KEY, state.sessions)
    },
    deleteSession (state, payload) {
      session.defaultSession.clearStorageData()
      session.defaultSession.flushStorageData()

      const index = state.sessions.findIndex(ses => ses.id === payload)
      state.sessions.splice(index, 1)

      store.set(SESSIONS_KEY, state.sessions)
    },
    updateTotalDownloads (state, payload) {
      state.totalDownloads += payload
      store.set(TOTAL_DOWNLOADS_KEY, state.totalDownloads)
    },
    updateUpdateInterval (state, payload) {
      state.updateInterval = payload
      store.set(UPDATE_INTERVAL_KEY, state.updateInterval)
    },
    updateEnableTrayIcon (state, payload) {
      state.enableTrayIcon = payload
      store.set(ENABLE_SYSTEM_TRAY_ICON_KEY, payload)

      ipcRenderer.send('tray-updated')
    },
    updateAutoStart (state, payload) {
      state.autoStart = payload
      store.set(AUTOSTART_KEY, payload)

      app.setLoginItemSettings({
        openAtLogin: (payload && state.enableTrayIcon),
        args: ['--hidden']
      })
    },
    updateCloseTray (state, payload) {
      state.closeTray = payload
      store.set(CLOSE_TO_TRAY_KEY, payload)
    },
    updateMassUpdateLastFetch (state, payload) {
      state.massUpdateLastFetch = payload
    },
    updateLog (state, payload) {
      state.log.push(`${new Date(Date.now()).toISOString()}: ${payload}`)
    },
    clearLog (state) {
      while (state.log.length > 0) {
        state.log.pop()
      }

      state.log.push('Instagram Raider Log\n')
    }
  },
  actions: {
    createAccountsFile ({ commit, getters }) {
      commit('createAccountsFile', getters.accountsFile)
    }
  },
  getters: {
    saveFolder: state => state.saveFolder,
    userAgent: state => state.userAgent,
    mediaTypes: state => state.mediaTypes,
    accountsFile: state => path.join(state.saveFolder, 'acc'),
    timeout: state => state.timeout,
    maxPosts: state => state.maxPosts,
    sleepTimer: state => state.sleepTimer,
    filenameFormat: state => state.filenameFormat,
    openAccountFolder: state => state.openAccountFolder,
    sessions: state => state.sessions,
    totalDownloads: state => state.totalDownloads,
    updateInterval: state => state.updateInterval,
    enableTrayIcon: state => state.enableTrayIcon,
    autoStart: state => state.autoStart,
    closeTray: state => state.closeTray,
    massUpdateLastFetch: state => state.massUpdateLastFetch,
    log: state => state.log
  }
})
