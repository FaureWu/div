const bodyParser = require('koa-bodyparser')
const path = require('path')
const chalk = require('chalk')
const config = require('./lib/config')
const editorRouter = require('./lib/router')
const createMock = require('./lib/mock')
const { injectComponents } = require('./lib/template')

const mockRouter = createMock()

module.exports = {
  middleware: [
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
  
    callback()

    console.log()
    console.log(chalk.yellow('[编辑器] 启动完成'))
    console.log(chalk.yellow('[编辑器] 编辑器访问地址'))
    console.log(chalk.yellow(`[编辑器] http://cabin.dmall.com?debug-${name}=http://local.dmall.com:3000/kayak-project#full/${name}/${route}`))
    console.log()
    console.log(chalk.yellow('[HOST] 请确保已经配置如下host'))
    console.log(chalk.yellow('[HOST] local.dmall.com 127.0.0.1'))
    console.log()
  }
}
