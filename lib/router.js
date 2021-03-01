const Router = require('koa-router')
const config = require('./config')
const { isFunction } = require('./util')
const { readTemplatesConfig, writePageTemplate, deletePage, savePage, saveTemplate, readHistoryPages, readTemplatePages } = require('./template')

const router = new Router()

function readTemplates() {
  return readTemplatesConfig(config.templatesPath)
}

function readComponents() {
  return readTemplatesConfig(config.componentsPath)
    .map(({ path, ...component }) => {
      return component
    })
}

function tranToMap(arr = []) {
  return arr.reduce((result, item) => ({
    ...result,
    [item.name]: item,
  }), [])
}

router.get('/mock/editor/templates', async ctx => {
  try {
    ctx.body = { code: 200, data: readTemplates() }
  } catch (e) {
    console.error(e)
    ctx.body = { code: 0, message: e.message }
  }
})

router.get('/mock/editor/components', async ctx => {
  try {
    ctx.body = { code: 200, data: readComponents() }
  } catch (e) {
    console.error(e)
    ctx.body = { code: 0, message: e.message }
  }
})

router.get('/mock/editor/prePages', async ctx => {
  try {
    const components = readComponents()
    ctx.body = { code: 200, data: { templatePages: readTemplatePages(), historyPages: readHistoryPages() }, componentMap: tranToMap(components) }
  } catch (e) {
    console.error(e)
    ctx.body = { code: 0, message: e.message }
  }
})

router.post('/mock/editor/savePage', async ctx => {
  try {
    savePage(ctx.request.body)
    ctx.body = { code: 200 }
  } catch (e) {
    console.error(e)
    ctx.body = { code: 0, message: e.message }
  }
})

router.post('/mock/editor/saveTemplate', async ctx => {
  try {
    saveTemplate(ctx.request.body)
    ctx.body = { code: 200 }
  } catch (e) {
    console.error(e)
    ctx.body = { code: 0, message: e.message }
  }
})

router.post('/mock/editor/createPage', async ctx => {
  const { template, data, preview } = ctx.request.body

  try {
    writePageTemplate(template, data, preview)
    ctx.body = { code: 200 }
  } catch (e) {
    console.error(e)
    ctx.body = { code: 0, message: e.message }
  }
})

router.post('/mock/editor/deletePage', async ctx => {
  const { name } = ctx.request.body
  
  try {
    deletePage(name)
    ctx.body = { code: 200 }
  } catch (e) {
    console.error(e)
    ctx.body = { code: 0, message: e.message }
  }
})

module.exports = router
