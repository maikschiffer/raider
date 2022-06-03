'use strict'

const { app, BrowserWindow, ipcMain, Menu, protocol, session, Tray } = require('electron')
const { createProtocol } = require('vue-cli-plugin-electron-builder/lib')
const path = require('path')
const Store = require('electron-store')
const contextMenu = require('electron-context-menu')
const { default: installExtension, VUEJS_DEVTOOLS } = require('electron-devtools-installer')

const isDevelopment = process.env.NODE_ENV !== 'production'

const gotSingleInstanceLock = app.requestSingleInstanceLock()

// Create/Load win-state store
const winStore = new Store({
  name: 'win-state',
  fileExtension: ''
})

const prefStore = new Store({
  name: 'prefs',
  fileExtension: ''
})

const USER_AGENT_KEY = 'userAgent'
const ENABLE_SYSTEM_TRAY_ICON_KEY = 'enableTrayIcon'
const CLOSE_TO_TRAY_KEY = 'closeTray'

const defaultUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36'
const userAgent = prefStore.get(USER_AGENT_KEY)

// Disable hardware acceleratin
app.disableHardwareAcceleration()

// Set App USer Model ID
app.setAppUserModelId('com.raider.askd')

// Global useragent
app.userAgentFallback = userAgent == null || userAgent === '' ? defaultUserAgent : userAgent

// Enable context menu
contextMenu({
  showSearchWithGoogle: false
})

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

let tray = null

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{
  scheme: 'app',
  privileges: { secure: true, standard: true }
}])

if (!app.isDefaultProtocolClient('raiderapp')) {
  app.setAsDefaultProtocolClient('raiderapp')
}

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    title: 'Raider',
    x: winStore.get('x'),
    y: winStore.get('y'),
    width: winStore.get('width', 750),
    height: winStore.get('height', 600),
    minWidth: 750,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#FFFFFF',
    webPreferences: {
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      webSecurity: false
    }
  })

  if (!isDevelopment) {
    win.removeMenu()
  }

  if (winStore.get('maximized', false)) {
    win.maximize()
  }

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders.Referer = 'https://www.instagram.com'
    details.requestHeaders['x-ig-app-id'] = '936619743392459'
    details.requestHeaders['X-Requested-With'] = 'XMLHttpRequest'
    // eslint-disable-next-line standard/no-callback-literal
    callback({ requestHeaders: details.requestHeaders })
  })

  session.defaultSession.clearCache()
  session.defaultSession.clearStorageData()

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }

  ipcMain.on('tray-updated', () => {
    createTray()
  })

  win.once('ready-to-show', () => {
    deepLinking(process.argv)

    const startHidden = process.argv.includes('--hidden')

    if (startHidden) {
      return
    }

    win.show()
  })

  win.on('close', (event) => {
    if (!gotSingleInstanceLock) {
      return
    }

    const enableTrayIcon = prefStore.get(ENABLE_SYSTEM_TRAY_ICON_KEY, false)
    const closeToTray = prefStore.get(CLOSE_TO_TRAY_KEY, true)

    if (!app.isQuiting && enableTrayIcon && closeToTray) {
      event.preventDefault()
      win.hide()
    }

    saveWindowState()
  })

  win.on('closed', () => {
    win = null
  })
}

function toggleVisibility () {
  win.isVisible() ? win.hide() : focusWindow()
}

function focusWindow () {
  if (win) {
    if (win.isMinimized()) {
      win.restore()
    }

    if (!win.isVisible()) {
      win.show()
    }

    win.focus()
  }
}

function createTray () {
  const enableTrayIcon = prefStore.get(ENABLE_SYSTEM_TRAY_ICON_KEY, false)

  if (!enableTrayIcon) {
    if (tray != null) {
      tray.destroy()
      tray = null
    }

    return
  }

  tray = new Tray(path.resolve(app.isPackaged ? __dirname : 'public', 'tray', 'icon.png'))

  tray.setToolTip('Raider')
  updateTrayContextMenu()

  tray.on('click', () => {
    if (win.isVisible()) {
      win.focus()
    }
  })

  tray.on('double-click', () => {
    toggleVisibility()
  })
}

function updateTrayContextMenu () {
  tray.setContextMenu(Menu.buildFromTemplate([
    {
      label: 'Raider for Instagram',
      enabled: false
    },
    {
      label: 'Update Accounts',
      click: () => win.webContents.send('update-accounts')
    },
    {
      type: 'separator'
    },
    {
      label: 'Restore Window',
      click: () => focusWindow()
    },
    {
      label: 'Exit',
      role: 'quit'
    }
  ]))
}

function deepLinking (args) {
  const testRegex = /raiderapp:\/\/(.+?)\//

  args.forEach(arg => {
    const result = arg.match(testRegex)

    if (result != null) {
      win.webContents.send('start-download', result[1])
    }
  })
}

function saveWindowState () {
  const winBounds = win.getBounds()

  winStore.set({
    maximized: win.isMaximized()
  })

  if (win.isMaximized() || win.isFullScreen()) {
    return
  }

  winStore.set({
    x: winBounds.x,
    y: winBounds.y,
    width: winBounds.width,
    height: winBounds.height
  })
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  app.isQuiting = true
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  } else {
    focusWindow()
  }
})

app.on('second-instance', (event, args) => {
  deepLinking(args)
  focusWindow()
})

if (!gotSingleInstanceLock) {
  app.quit()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (!gotSingleInstanceLock) {
    return
  }

  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }

  createWindow()
  createTray()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
