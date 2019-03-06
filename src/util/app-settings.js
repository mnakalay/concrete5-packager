import { LocalStorage } from 'quasar'

function getAppSettings (key = null) {
  if (!key) {
    if (LocalStorage.get.length() > 0) {
      return LocalStorage.get.all()
    } else {
      return false
    }
  }

  let ret = LocalStorage.get.item(key)

  return ret || false
}

function setAppSettings (value, key = null) {
  if (!key) {
    return false
  }

  LocalStorage.set(key, value)

  return LocalStorage.get.length()
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
