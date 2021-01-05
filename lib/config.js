const path = require('path')
const { isFileExist } = require('./util')
const paths = require('./path')

function readConfig({ basePath, configPath, defaultConfigPath }) {
  const userConfig = isFileExist(configPath) ? require(configPath) : {}
  const defaultConfig = require(defaultConfigPath)

  const divConfig = { ...defaultConfig, ...userConfig }

  const templatesPath = path.resolve(basePath, divConfig.templatesPath)
  const componentsPath = path.resolve(basePath, divConfig.componentsPath)
  const pagesPath = path.resolve(basePath, divConfig.pagesPath)
  const editorPath = path.resolve(basePath, divConfig.editorPath)
  const mockPath = path.resolve(basePath, divConfig.mockPath)
  const tmpPath = path.resolve(basePath, divConfig.tmpPath)

  return {
    templatesPath,
    componentsPath,
    pagesPath,
    tmpPath,
    editorPath,
    mockPath,
    mockDelay: divConfig.mockDelay,
  }
}

module.exports = readConfig({
  basePath: paths.basePath,
  configPath: paths.config,
  defaultConfigPath: paths.defaultConfig,
})