const VuetifyLoaderPlugin = require('vuetify-loader/lib/plugin')

module.exports = {
  productionSourceMap: false,
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      builderOptions: {
        appId: 'com.raider.askd',
        productName: 'Raider',
        win: {
          target: ['nsis', 'zip'],
          icon: 'build/icons/icon.ico'
        },
        nsis: {
          oneClick: false,
          allowToChangeInstallationDirectory: true,
          createDesktopShortcut: false,
          deleteAppDataOnUninstall: true
        }
      }
    }
  },
  configureWebpack: {
    plugins: [
      new VuetifyLoaderPlugin()
    ]
  },
  chainWebpack: config => {
    config.plugins.delete('prefetch')
    config.plugins.delete('preload')
  }
}
