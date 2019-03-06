const Store = require('electron-store')
const storeName = 'c5-packager'
const storeEncryptKey = storeName

function getStore () {
  return new Store({name: storeName, encryptionKey: storeEncryptKey})
}

function getAppSettings (key = null, defValue = false) {
  const store = getStore()

  if (!key) {
    return store.size > 0 ? store.store : false
  }

  return store.get(key, defValue)
}

function setAppSettings (value, key = null) {
  const store = getStore()

  if (key) {
    store.set(key, value)
  } else {
    store.set(value)
  }

  return store.size
}

function clearAppSettings (key = null) {
  const store = getStore()

  if (key) {
    store.delete(key)
  } else {
    store.clear()
  }
  return true
}

export default { getAppSettings, setAppSettings, clearAppSettings }
