import { LocalStorage } from 'quasar'

function getAppSettings (key = null) {
  if (!key) {
    if (LocalStorage.getLength() > 0) {
      return LocalStorage.getAll()
    } else {
      return false
    }
  }

  let ret = LocalStorage.getItem(key)

  return ret || false
}

function setAppSettings (value, key = null) {
  if (!key) {
    return false
  }

  LocalStorage.set(key, value)

  return LocalStorage.getLength()
}

function clearAppSettings (key = null) {
  if (key) {
    LocalStorage.remove(key)
  } else {
    LocalStorage.clear()
  }

  return true
}

export default { getAppSettings, setAppSettings, clearAppSettings }
