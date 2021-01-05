const path = require('path')
const fs = require('fs')

const configFileName = 'divconfig.js'

const basePath = process.cwd()
const defaultConfig = path.resolve(__dirname, `../${configFileName}`)
const config = path.resolve(basePath, configFileName)

module.exports = {
  basePath,
  config,
  defaultConfig,
}