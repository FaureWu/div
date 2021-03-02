const path = require('path')
const ejs = require('ejs')
const prettier = require('prettier')
const config = require('./config')
const {
  isDirectory,
  isFileExist,

  createReadFiles,
  readFileContent,
  writeFileContent,
  tranHumpToLine,
  deleteDir,
} = require('./util')

const templateConfigName = 'config.json'
const previewName = '.preview'
const pageConfigName = '.config'

function readTemplateConfig(templateConfigPath) {
  delete require.cache[templateConfigPath]

  return require(templateConfigPath)
}

function isEjs(filePath) {
  const { ext } = path.parse(filePath)

  return ext === '.ejs'
}

function isEntryFile(file, compareFile) {
  const { dir, name, ext } = path.parse(file.replace('.ejs', ''))
  const { dir: compareDir, name: compareName } = path.parse(compareFile.replace('.ejs', ''))

  return ['.dss', '.dml', '.js'].indexOf(ext) !== -1 &&
    dir === compareDir && name === compareName
}

function parsePageTemplate({ config: templateConfig, page, files }) {
  const pageEntryTemplate = path.resolve(templateConfig.path, templateConfig.entry)
  const pageConfig = path.resolve(templateConfig.path, templateConfigName)

  return files.filter(file => file !== pageConfig).map(file => {
    const isEntry = isEntryFile(file, pageEntryTemplate)
    const { name, ext } = path.parse(file.replace('.ejs', ''))
    const pagePath = path.resolve(config.pagesPath, page.config.name.value)

    let dist = file.replace('.ejs', '')
      .replace(templateConfig.path, pagePath)
    
    if (isEntry) {
      dist = dist.replace(new RegExp(`(.*)${name}`), `$1${page.config.name.value}`)
    }

    return { src: file, dist }
  })
}

function prettierCode(code, file) {
  const { ext } = path.parse(file)

  const parser = {
    '.js': 'babel',
    '.dss': 'scss',
    '.json': 'json',
    '.dml': 'html',
  }

  return prettier.format(code, {
    printWidth: 80,
    tabWidth: 2,
    useTabs: false,
    semi: false,
    singleQuote: true,
    quoteProps: 'consistent',
    jsxSingleQuote: false,
    trailingComma: 'all',
    bracketSpacing: true,
    jsxBracketSameLine: false,
    arrowParens: 'always',
    parser: parser[ext] || 'babel',
    endOfLine: 'lf',
  })
}

function isPageExist(pageName) {
  const pagePath = path.resolve(config.pagesPath, pageName)

  return isFileExist(pagePath)
}

/**
 * 读取模版配置
 */
const readTemplatesConfig = createReadFiles(filePath => {
  if (!isDirectory(filePath)) return []

  const templateConfigPath = path.resolve(filePath, templateConfigName)
  if (!isFileExist(templateConfigPath)) return []

  const { name } = path.parse(filePath)
  const config = readTemplateConfig(templateConfigPath)
  config.name = name
  config.tagName = 'c-' + tranHumpToLine(name)
  config.path = filePath

  return config
})

function getComponentConfigsWidthRelativePath(basePath, componentConfigs) {
  return componentConfigs.map(componentConfig => {
    const componentEntryPath = path.resolve(componentConfig.path, componentConfig.entry || 'index.js')
    const { dir, name } = path.parse(componentEntryPath)

    const relativePath = path.relative(basePath, path.resolve(dir, name))
    return {
      ...componentConfig,
      relativePath: relativePath.split(path.sep).join('/'),
    }
  })
}

function transComponentsToNameMap(components) {
  return components.reduce((result, component) => ({
    ...result,
    [component.name]: component,
  }), {})
}

const readTemplateFiles = createReadFiles(filePath => {
  const { name } = path.parse(filePath)

  if (name === 'ignore') return

  if (isDirectory(filePath)) return readTemplateFiles(filePath)

  return filePath
})

function getImportComponents(
  { name, children = [] },
  components,
  importComponents = [],
  usedComponents = {},
) {
  const com = components[name]

  if (com && !usedComponents[com.name]) {
    importComponents.push(com)
    usedComponents[com.name] = true
  }

  children.forEach(item => {
    importComponents = getImportComponents(
      item,
      components,
      importComponents,
      usedComponents,
    )
  })

  return importComponents
}

/**
 * 通过模版生成页面
 */
function writePageTemplate({ template: templateConfig, data, preview, config: pageConfig }) {
  const { page, ...params } = data
  const previewConfigFilePath = path.resolve(config.pagesPath, page.config.name.value, previewName)
  const configFilePath = path.resolve(config.pagesPath, page.config.name.value, pageConfigName)

  if (!isFileExist(previewConfigFilePath) && isPageExist(page.config.name.value)) throw new Error('页面已经存在！')

  deletePage(page.config.name.value)
  const componentConfigs = readTemplatesConfig(config.componentsPath)
  const files = readTemplateFiles(templateConfig.path)
  const templates = parsePageTemplate({ config: templateConfig, page, files })

  templates.forEach(template => {
    const components = transComponentsToNameMap(
      getComponentConfigsWidthRelativePath(
        path.parse(template.dist).dir,
        componentConfigs,
      )
    )
    const templateCode = readFileContent(template.src)
    const code = ejs.render(
      templateCode,
      {
        page,
        preview,
        components: getImportComponents(page, components),
        ...params,
      },
      { views: [templateConfig.path] },
    )
    writeFileContent(template.dist, prettierCode(code, template.dist))
  })

  if (preview) {
    writeFileContent(previewConfigFilePath, '')
  }

  writeFileContent(
    configFilePath,
    Buffer.from(encodeURIComponent(JSON.stringify(pageConfig))).toString('base64'),
  )
}

function injectComponents() {
  const componentConfigs = getComponentConfigsWidthRelativePath(
    config.editorPath,
    readTemplatesConfig(config.componentsPath),
  )
  const template = readFileContent(path.resolve(__dirname, 'templates/injectComponents.ejs'))
  const code = ejs.render(template, { components: componentConfigs })
  const distPath = path.resolve(config.editorPath, 'injectComs.js')
  writeFileContent(distPath, prettierCode(code, distPath))
}

function deletePage(name) {
  const pagePath = path.resolve(config.pagesPath, name)
  deleteDir(pagePath)
}

function savePage(page) {
  writeFileContent(
    path.resolve(config.tmpPath, 'pages', page.name),
    Buffer.from(encodeURIComponent(JSON.stringify(page))).toString('base64'),
  )
}

function saveTemplate(page) {
  writeFileContent(
    path.resolve(config.tmpPath, page.name),
    Buffer.from(encodeURIComponent(JSON.stringify(page))).toString('base64'),
  )
}

function readPrePages(path) {
  if (!isFileExist(path)) return []

  const readFiles = createReadFiles(filePath => {
    if (isDirectory(filePath)) return

    try {
      return JSON.parse(decodeURIComponent(Buffer.from(readFileContent(filePath), 'base64').toString()))
    } catch (e) {}
  })

  return readFiles(path)
}

function readTemplatePages() {
  return readPrePages(config.tmpPath)
}

function readHistoryPages() {
  const readPageConfigs = createReadFiles(filePath => {
    if (!isDirectory(filePath)) return

    const { name } = path.parse(filePath)
    const configFilePath = path.resolve(config.pagesPath, name, pageConfigName)
    if (!isFileExist(configFilePath)) return

    try {
      return JSON.parse(decodeURIComponent(Buffer.from(readFileContent(configFilePath), 'base64').toString()))
    } catch (e) {}
  })

  return readPageConfigs(config.pagesPath)
}

module.exports = {
  readTemplatesConfig,
  writePageTemplate,
  injectComponents,
  deletePage,
  savePage,
  saveTemplate,
  readHistoryPages,
  readTemplatePages,
}