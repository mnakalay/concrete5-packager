import remote from 'electron'
import settings from './app-settings-store'
import fileHelper from './file-helper'

const path = require('path')
const fs = require('fs-extra')
const archiver = require('archiver')
const glob = require('tiny-glob')
var shell = require('shelljs');

let dataObj = {
  srcDir: '',
  pkgHandle: '',
  workFolder: '',
  buildFolder: '',
  releaseFolder: '',
  releaseFile: '',
  defPath: '',
  deleteBuildFolder: true,
  addC5Exec: true,
  finalIgnoreList: [],
  filesToClean: []
}

export default async(rootDir, pkgHandle) => {
  if (rootDir.charAt(rootDir.length - 1) !== path.sep) {
    rootDir += path.sep
  }

  let results = await Promise.all([
    await setDefaults(rootDir, pkgHandle),
    await fs.ensureDir(dataObj.releaseFolder),
    await copyToBuild(),
    await cleanPHPFiles(),
    await zipIt()
  ])

  return results
}

async function setDefaults(rootDir, pkgHandle) {

  if (!shell.which('composer')) {
    console.log('sorry no composer')
  } else {
    console.log('yeah we have composer')
  }
  // shell.exit(0)

  dataObj.pkgHandle = pkgHandle
  dataObj.srcDir = rootDir + pkgHandle

  dataObj.defPath = remote.app.getPath('home')
  dataObj.defPath = dataObj.defPath.split(path.sep)
  dataObj.defPath.push('c5-packager')
  dataObj.defPath = dataObj.defPath.join(path.sep)

  dataObj.workFolder = settings.getAppSettings('workFolder', dataObj.defPath)
  dataObj.workFolder = dataObj.workFolder.split(path.sep)

  dataObj.buildFolder = Array.from(dataObj.workFolder)
  dataObj.buildFolder.push('build')
  dataObj.buildFolder.push(pkgHandle)
  dataObj.buildFolder = dataObj.buildFolder.join(path.sep)

  dataObj.deleteBuildFolder = settings.getAppSettings('deleteBuildFolder', 'yes')
  dataObj.deleteBuildFolder = (dataObj.deleteBuildFolder === 'yes') ? true : false

  dataObj.addC5Exec = settings.getAppSettings('addC5Exec', 'yes')
  dataObj.addC5Exec = (dataObj.addC5Exec === 'yes') ? true : false

  dataObj.releaseFolder = Array.from(dataObj.workFolder)
  dataObj.releaseFolder.push('release')

  dataObj.releaseFile = Array.from(dataObj.releaseFolder)
  dataObj.releaseFile.push(pkgHandle + '.zip')

  dataObj.releaseFolder = dataObj.releaseFolder.join(path.sep)
  dataObj.releaseFile = dataObj.releaseFile.join(path.sep)

  dataObj.workFolder = dataObj.workFolder.join(path.sep)

  dataObj.finalIgnoreList = ignore

  dataObj.filesToClean = []

  const customIgnore = settings.getAppSettings('ignore')

  if (customIgnore) {
    Array.prototype.push.apply(dataObj.finalIgnoreList, customIgnore);
  }
}

async function copyToBuild() {
  let entries = { total: 0, processed: 0 }
  let recordedProgress = 0
  let fileChecker = []
  
  let filterFunc = (src, dest) => {
    if (src !== dataObj.srcDir) {
      // all this to not copy excluded files
      const index = fileChecker.indexOf(src)
      if (index > -1) {
        // we found the file in the list of allowed files
        // we remove it from the list so it's smaller for next iteration
        fileChecker.splice(index, 1)
        if (dest.replace(dataObj.buildFolder + path.sep + 'vendor', '') === dest && dest.split('.').pop().toLowerCase() === 'php') {
        // if (dest.split('.').pop().toLowerCase() === 'php') {
          dataObj.filesToClean.push(dest)
        }
      } else {
        return false
      }
      entries.processed++
    }

    const tmpProgress = entries.processed / entries.total
    const done = false // (tmpProgress >= 1) ? true : false
    if (tmpProgress > recordedProgress * 1.15 || tmpProgress >= 1) {
      recordedProgress = tmpProgress
      global.mainWindow.webContents.send(
        'zip-progress', { success: true, done: done, heading: 'Copying files to Build folder', total: entries.total, processed: entries.processed }
      )
    }

    return true
  }

  try {
    let ignoreList = dataObj.finalIgnoreList

    if (process.platform === 'win32') {
      ignoreList = ignoreList.map( item => item.replace(/\//g, '\\'))
    }

    const ff = '!(' + ignoreList.join('|') + ')'
    
    let filesToCopy = await glob(
      ff,
      {
        cwd: dataObj.srcDir,
        absolute: true,
        dot: true
      }
    )

    entries.total = filesToCopy.length
    fileChecker = filesToCopy

    await fs.emptyDir(dataObj.buildFolder)
    await fs.copy(dataObj.srcDir, dataObj.buildFolder, { filter: filterFunc })
  } catch (err) {
    throw err
  }

  return true
}

async function cleanPHPFiles() {
  // let newContent = ''
  // let content = ''
  let recordedProgress = 0
  let processed = 0
  let cleaned = 0
  let tmpProgress = 0
  let done = false
  let index = 0
  const total = dataObj.filesToClean.length
  if (total <= 0 || !dataObj.addC5Exec) {
    console.log('nothing to clean here, returning')
    return
  }

  for (const [index, path] of dataObj.filesToClean.entries()) {
    processed = index + 1
    tmpProgress = processed / total
    done = false // (tmpProgress >= 1) ? true : false

    const content = await fileHelper.readFile(path)
    // .then(content => {
      
    if (content && content.length) {
      const isCleaned = await fixC5ExecOrDie(path, content, index)
      if (isCleaned) {
        cleaned++
      }
      
      if (tmpProgress > recordedProgress * 1.15 || tmpProgress >= 1) {
        recordedProgress = tmpProgress
        global.mainWindow.webContents.send(
          'zip-progress', { success: isCleaned, done: done, heading: `Checking ${total} PHP files - ${cleaned} cleaned`, total: total, processed: processed }
        )
      }
    } else {
      if (tmpProgress > recordedProgress * 1.15 || tmpProgress >= 1) {
        recordedProgress = tmpProgress
        global.mainWindow.webContents.send(
          'zip-progress', { success: true, done: done, heading: `Checking ${total} PHP files - ${cleaned} cleaned`, total: total, processed: processed }
        )
      }
    }
  }
}

async function zipIt() {
  // create a file to stream archive data to.
  const archiveFile = dataObj.releaseFile // + path.sep + dataObj.pkgHandle + '.zip'
  var output = fs.createWriteStream(archiveFile)
  var archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
  })

  // listen for all archive data to be written
  // 'close' event is fired only when a file descriptor is involved
  output.on('close', function(e) {
    if (dataObj.deleteBuildFolder) {
      fs.remove(dataObj.buildFolder)  
    }
      
    global.mainWindow.webContents.send(
      'zipped', {
        success: true,
        msg: 'Your package archive ' + dataObj.pkgHandle + '.zip (' + formatBytes(archive.pointer(), 2) + ') was created successfully inside its parent packages folder',
        size: archive.pointer()
      }
    )
  })

  // This event is fired when the data source is drained no matter what was the data source.
  // It is not part of this library but rather from the NodeJS Stream API.
  // @see: https://nodejs.org/api/stream.html#stream_event_end
  output.on('end', function() {
    console.log('Data has been drained')
  })

  // good practice to catch warnings (ie stat failures and other non-blocking errors)
  archive.on('warning', function(err) {
    if (err.code === 'ENOENT') {
      // log warning
      throw err
    } else {
      // throw error
      throw err
    }
  })

  // good practice to catch this error explicitly
  archive.on('error', function(err) {
    throw err
  })

  let recordedProgress = 0
  let done = false

  archive.on('progress', function(data) {
    const tmpProgress = data.entries.processed / data.entries.total
    done = (tmpProgress >= 1) ? true : false
    if (tmpProgress > recordedProgress * 1.15 || tmpProgress >= 1) {
      recordedProgress = tmpProgress
      global.mainWindow.webContents.send(
        'zip-progress', { success: true, done: done, heading: 'Zipping it up', total: data.entries.total, processed: data.entries.processed }
      )
    }
  })

  // pipe archive data to the file
  archive.pipe(output)

  // let dataObj.finalIgnoreList = ignore
  // const customIgnore = settings.getAppSettings('ignore')

  // if (customIgnore) {
  //   Array.prototype.push.apply(dataObj.finalIgnoreList, customIgnore);
  // }

  archive.glob('**', {
    cwd: dataObj.buildFolder,
    dot: false
    // ignore: dataObj.finalIgnoreList
  }, {
    prefix: dataObj.pkgHandle
  })

  // finalize the archive (ie we are done appending files but streams have to finish yet)
  // 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
  archive.finalize()

  return true
}

async function fixC5ExecOrDie (path, content, index) {
  const execRegex = /defined[\s]*\(['|"]C5_EXECUTE['|"]\)[\s]+or[\s]+die[\s]*\(['|"].+['|"]\)[\s]*;/gi
  const oldExecRegex = /defined[\s]*\(['|"]C5_EXECUTE['|"]\)[\s]+or[\s]+die[\s]*\([\s]*_[\s]*\([\s]*['|"].+['|"][\s]*\)[\s]*\)[\s]*;/gi
  const namespaceRegex = /(namespace[\s]*([a-z_]+)([\\]+[a-z_]+)*;)/gi
  const phpRegEx = /^([\s]*?<\?php)/i

  let newContent = ''
  // looking for nomal C5_EXECUTE
  if (!content.match(execRegex)) {
    if (content.match(oldExecRegex)) {
      // if we have old style C5_EXECUTE with the _() function
      newContent = await content.replace(oldExecRegex, 'defined(\'C5_EXECUTE\') or die(\'Access Denied.\');')
    } else if (content.match(namespaceRegex)) {
      // if we have a namespace
      newContent = await content.replace(namespaceRegex, '$1\r\n\r\ndefined(\'C5_EXECUTE\') or die(\'Access Denied.\');')
    } else {
      // if content starts with an open php tag add it there
      if (content.match(phpRegEx)) {
        newContent = await content.replace(phpRegEx, '<\?php defined(\'C5_EXECUTE\') or die(\'Access Denied.\');\r\n')
      } else {
        // otherwise just add it to the top
        newContent = '<\?php defined(\'C5_EXECUTE\') or die(\'Access Denied.\'); ?>\r\n\r\n' + content
      }
    }

    const ret = await fileHelper.writeFile(path, newContent)
    return ret
  } else {
    return false
  }
}

function formatBytes(bytes, decimals) {
  if (bytes == 0) return '0 Bytes';
  var k = 1024,
  dm = decimals <= 0 ? 0 : decimals || 2,
  sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
  i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const ignore = [
    '*(**/)*.{sh,bash,bat,bin,exe,msi,sublime-project,sublime-workspace,code-workspace}',
    '*(**/)*{Desktop.ini,thumbs.db,__macosx}',
    '.git',
    '.idea',
    '.vscode',
    '.php_cs.dist',
    'DEV',
    '.gitignore',
    'exclusions.json'
  ]