const bodyParser = require('koa-bodyparser')
const editorRouter = require('./lib/router')
const createMock = require('./lib/mock')
const { injectComponents } = require('./lib/template')

module.exports = function(app) {
  injectComponents()
  app.use(bodyParser())
  app.use(editorRouter.routes())
  app.use(editorRouter.allowedMethods())
  const mockRouter = createMock()
  app.use(mockRouter.routes())
  app.use(mockRouter.allowedMethods())
}
