import { remote } from 'electron'
// const localStorage = require('electron-browser-storage')
let storageWindow = false
let localStorage = getStore()

// Execute code in the BrowserWindow
function execute (code) {
  storageWindow = remote.getGlobal('mainWindow')
  if (!storageWindow) {
    throw Error('Storage window is not initialized.')
  }

  return storageWindow.webContents.executeJavaScript(code)
}

function Storage (storageName) {
  /**
   * Returns the number of items in the storage
   */
  this.length = () => execute(`window.${storageName}.length;`)

  /**
   * Returns the key at the given index
   * @param {number} index Index to get
   */
  this.key = index => execute(`window.${storageName}.key('${index}');`)

  /**
   * Returns the value for the given key
   * @param {string} key Key to get
   */
  this.getItem = key => execute(`window.${storageName}.getItem('${key}');`)

  /**
   * Sets the value for the given key
   * @param {string} key Key to set
   * @param {*} value Value to set
   */
  this.setItem = (key, value) => execute(`window.${storageName}.setItem('${key}', '${value}');`)

  /**
   * Removes the item at the given key
   * @param {string} key Key to remove
   */
  this.removeItem = key => execute(`window.${storageName}.removeItem('${key}');`)

  /**
   * Removes all keys and values
   */
  this.clear = () => execute(`window.${storageName}.clear();`)
}

function getStore () {
  return new Storage('localStorage')
}

function getAppSettings (key = null) {
  if (!key) {
    const length = localStorage.length()
    if (length > 0) {
      let obj = {}
      let keyName = ''
      for (var i = length - 1; i >= 0; i--) {
        localStorage.key(i)
          .then(function (k) {
            keyName = localStorage.getItem(k)
          }).then(function (v) {
            v = JSON.parse(v)
            v = (v.length && v.isString) ? decodeURIComponent(v.strValue) : decodeURIComponent(v)
            obj[keyName] = v
          })
      }

      return obj
    } else {
      return false
    }
  }

  localStorage.getItem(key)
    .then(function (v) {
      if (v) {
        v = JSON.parse(v)
        const ret = (v.length && v.isString) ? decodeURIComponent(v.strValue) : decodeURIComponent(v)
        return ret
      }

      return false
    })
}

function setAppSettings (value, key = null, isJson = true) {
  if (!key) {
    return false
  }

  value = !isJson ? {isString: true, strValue: encodeURIComponent(value)} : encodeURIComponent(value)
  localStorage.setItem(key, JSON.stringify(value))
    .then(function () {
      return localStorage.length()
    })
}

function clearAppSettings (key = null) {
  if (key) {
    localStorage.removeItem(key)
      .then(function () {
        return true
      })
  } else {
    localStorage.clear()
      .then(function () {
        return true
      })
  }

  return true
}

export default { getAppSettings, setAppSettings, clearAppSettings }
