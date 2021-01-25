const Router = require('koa-router')
const config = require('./config')
const { isFunction } = require('./util')
const { readTemplatesConfig, writePageTemplate, deletePage, savePage, readPrePages } = require('./template')

const router = new Router()

router.get('/mock/editor/templates', async ctx => {
  try {
    const templatesConfig = readTemplatesConfig(config.templatesPath)
    ctx.body = { code: 200, data: templatesConfig }
  } catch (e) {
    console.error(e)
    ctx.body = { code: 0, message: e.message }
  }
})

router.get('/mock/editor/components', async ctx => {
  try {
    const componentsConfig = readTemplatesConfig(config.componentsPath)
      .map(({ path, ...component }) => {
        return component
      })
    ctx.body = { code: 200, data: componentsConfig }
  } catch (e) {
    console.error(e)
    ctx.body = { code: 0, message: e.message }
  }
})

router.get('/mock/editor/prePages', async ctx => {
  try {
    ctx.body = { code: 200, data: readPrePages() }
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

router.post('/mock/editor/createPage', async ctx => {
  const { template, data } = ctx.request.body

  try {
    writePageTemplate(template, data)
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
