const fs = require('fs')
const path = require('path')
const shell = require('shelljs')

function check(data, type) {
  return Object.prototype.toString.call(data) === type
}

function isString(data) {
  return check(data, '[object String]')
}

function isFunction(data) {
  return check(data, '[object Function]')
}

function isDirectory(dir) {
  return fs.statSync(dir).isDirectory()
}

function isFileExist(file) {
  return fs.existsSync(file)
}

function formatFilePath(filePath) {
  if (filePath.indexOf(path.sep) === 0) return filePath

  return `${path.sep}${filePath}`
}

function createReadFiles(mapper) {
  return function (dir) {
    if (!isDirectory(dir)) return []
    return fs.readdirSync(dir).reduce((files, fileName) => {
      const filePath = path.resolve(dir, fileName)
      const addFiles = isFunction(mapper) ? mapper(filePath) : filePath
      return files.concat(addFiles || [])
    }, [])
  }
}

const readFilesDeep = createReadFiles(filePath => {
  if (isDirectory(filePath)) return readFilesDeep(filePath)

  return filePath
})

function readFileContent(filePath) {
  return fs
    .readFileSync(filePath)
    .toString()
}

function writeFileContent(filePath, content) {
  const fileParts = filePath.split(path.sep).filter(item => item)

  for (let i = 1; i < fileParts.length; i++) {
    const dir = formatFilePath(fileParts.slice(0, i).join(path.sep))
    if (isFileExist(dir)) continue
    fs.mkdirSync(dir)
  }

  fs.writeFileSync(filePath, content)
}

function deleteDir(path) {
  shell.rm('-rf', path)
}

function tranHumpToLine(name) {
  return name.replace(/([A-Z])/g, '-$1').toLowerCase()
}

module.exports = {
  isDirectory,
  isFileExist,
  isFunction,
  isString,

  createReadFiles,
  readFilesDeep,
  readFileContent,
  writeFileContent,
  deleteDir,
  formatFilePath,
  tranHumpToLine,
}