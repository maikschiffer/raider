const fs = require('fs')
const path = require('path')

const appVersion = require('../package.json').version

const dist = path.resolve('./dist_electron')
const oldPortableExecutable = path.resolve(dist, `Raider-${appVersion}-win.zip`)
const newPortableExecutable = path.resolve(dist, `Raider Portable ${appVersion}.zip`)

try {
  fs.renameSync(oldPortableExecutable, newPortableExecutable)
} catch (error) {
  console.error(error)
}