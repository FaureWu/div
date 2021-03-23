require('@babel/register')({
  presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
})

const Router = require('koa-router')
const chokidar = require('chokidar')
const fs = require('fs')
const path = require('path')
const config = require('./config')

function delay(time) {
  return new Promise(function(resolve) {
    setTimeout(resolve, time)
  })
}

function isTrue() {
  return true
}

function read(dir, filter = isTrue) {
  return fs
    .readdirSync(dir)
    .reduce(
      function(files, file) {
        return fs.statSync(path.join(dir, file)).isDirectory()
          ? files.concat(read(path.join(dir, file)))
          : files.concat(path.join(dir, file))
      },
      [],
    )
    .filter(filter)
}

function getMocks() {
  if (!fs.existsSync(config.mockPath)) return {}

  return read(config.mockPath, function(file) {
    return /^\.js$/.test(path.extname(file))
  }).reduce(function(mock, file) {
    delete require.cache[file]
    return {
      ...mock,
      ...require(file).default,
    }
  }, {})
}

async function matchRouter(ctx) {
  const url = `${ctx.method.toLocaleUpperCase()} ${ctx.path.replace('/mock', '')}`
  const mocks = getMocks()

  const route = mocks[url]

  await delay(config.mockDelay)

  if (typeof route === 'function') {
    try {
      const data = route(ctx)
      if (data) ctx.body = data
    } catch (e) {
      ctx.body = { code: 0, message: e.message }
    }
  } else if (route) {
    ctx.body = route
  } else {
    ctx.body = { code: 0, message: 'unknown mock api define' }
  }
}

module.exports = function () {
  const router = new Router()
  router.all('/mock/(.*)', async function(ctx) {
    await matchRouter(ctx)
  })

  return router
}