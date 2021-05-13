const bodyParser = require('koa-bodyparser')
const cors = require('koa2-cors')
const path = require('path')
const chalk = require('chalk')
const config = require('./lib/config')
const editorRouter = require('./lib/router')
const createMock = require('./lib/mock')
const { injectComponents } = require('./lib/template')

const mockRouter = createMock()

module.exports = {
  middleware: [
    cors({
      allowMethods:['GET', 'POST', 'DELETE'],
      origin: function (ctx) {
        return '*';
      },
    }),
    bodyParser(),
    editorRouter.routes(),
    editorRouter.allowedMethods(),
    mockRouter.routes(),
    mockRouter.allowedMethods(),
  ],
  start: function (callback) {
    injectComponents()
    const { name } = path.parse(process.cwd())
    const route = config.editorPath.replace(config.pagesPath, '')
      .split(path.sep).filter(item => !!item).join('/')
  
    console.log()
    console.log(chalk.yellow('[编辑器] 编辑器访问地址'))
    console.log(chalk.yellow(`[编辑器] https://cabinx.dmall.com?debug-${name}=https://local.dmall.com/kayak-project#full/${name}/${route}:mock=true`))
    console.log()
    console.log(chalk.yellow('[HOST] 请确保已经配置如下host'))
    console.log(chalk.yellow('[HOST] local.dmall.com 127.0.0.1'))
    console.log()
  }
}
