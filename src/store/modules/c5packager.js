// import fs from 'fs'
import { remote } from 'electron'
import { Notify } from 'quasar'
import openFolderDialog from '../../util/open-folder.dialog'
import checkDirExists from '../../util/check-dir-exists'
import settings from '../../util/app-settings'
import settingsStore from '../../util/app-settings-store'
const path = require('path')

export default {
  state: {
    c5packager: {
      selectedFolderPath: '',
      isSaved: false
    }
  },
  mutations: {
    SET_ROOT (state, newValue) {
      state.c5packager = newValue
    }
  },
  actions: {
    selectedFolder ({ state, commit }, selectedFolderPath) {
      const rootPath = {
        selectedFolderPath
      }

      commit('SET_ROOT', rootPath)
    },
    getRootList () {
      return JSON.parse(settings.getAppSettings('rootList')) || [] // gRootList
    },
    selectRoot ({ dispatch }) {
      // Provide the home directory as the base path for saving.
      let rootPath = settings.getAppSettings('lastDir')

      const defaultPath = rootPath || remote.app.getPath('home')

      // Only allow json as the file type to save as (this will be what
      // is readable when we attempt to open the file).

      // Utilize our helper function for opening the save folder dialog through
      // electron.
      openFolderDialog({
        title: 'Select a Concrete5 root',
        buttonTitle: 'Select',
        defaultPath,
        callback: folderPaths => {
          // If the folderPaths are undefined, the user did not select
          // any directories. Return to prevent any errors from occurring.
          if (folderPaths === undefined) return

          let selectedFolderPath = folderPaths[0]

          let parts = selectedFolderPath.split(path.sep)
          if (parts.length > 1 && parts[parts.length - 1].trim() === '') {
            parts.pop()
          }
          parts.push('packages')

          const hasPackage = checkDirExists(parts.join(path.sep))
          if (!hasPackage) {
            Notify.create({
              message: 'The selected directory does not appear to be a Concrete5 root',
              color: 'negative',
              icon: 'thumb_down',
              position: 'top-right',
              timeout: 2500
            })
            return
          }

          // removing the packages one
          parts.pop()

          let gRootList = JSON.parse(settings.getAppSettings('rootList')) || []
          if (process.platform === 'win32') {
            if (selectedFolderPath.charAt(selectedFolderPath.length - 1) === ':') {
              selectedFolderPath += path.sep
            }
          }
          gRootList.push(selectedFolderPath)
          let uniqueArray = (arrArg) => {
            return arrArg.filter((elem, pos, arr) => {
              return arr.indexOf(elem) === pos
            })
          }

          let newgRootList = uniqueArray(gRootList)
          const wasAdded = newgRootList.length === gRootList.length
          settings.setAppSettings(JSON.stringify(newgRootList), 'rootList')
          // remove actual folder to keep only parent
          parts.pop()
          let lastDir = parts.join(path.sep)

          settings.setAppSettings(lastDir, 'lastDir')

          remote
            .getGlobal('mainWindow')
            .send('root-added', newgRootList)

          if (wasAdded) {
            Notify.create({
              message: 'The selected Concrete5 root was added to the list',
              color: 'green',
              icon: 'thumb_up',
              position: 'top-right',
              timeout: 1500
            })
          } else {
            Notify.create({
              message: 'The selected Concrete5 root is already in the list',
              color: 'warning',
              icon: 'info',
              position: 'top-right',
              timeout: 1500
            })
          }

          dispatch('selectedFolder', selectedFolderPath)
        }
      })
    },
    selectWorkFolder ({ dispatch }) {
      // Provide the home directory as the base path for saving.
      let rootPath = settingsStore.getAppSettings('workFolder')

      const defaultPath = rootPath || remote.app.getPath('home')

      // Only allow json as the file type to save as (this will be what
      // is readable when we attempt to open the file).

      // Utilize our helper function for opening the save folder dialog through
      // electron.
      openFolderDialog({
        title: 'Select your build & release Destination folder',
        buttonTitle: 'Select',
        defaultPath,
        callback: folderPaths => {
          // If the folderPaths are undefined, the user did not select
          // any directories. Return to prevent any errors from occurring.
          if (folderPaths === undefined) return

          let selectedFolderPath = folderPaths[0]

          let parts = selectedFolderPath.split(path.sep)
          if (parts.length > 1 && parts[parts.length - 1].trim() === '') {
            parts.pop()
          }

          let workFolder = parts.join(path.sep)

          // settingsStore.setAppSettings(workFolder, 'workFolder')

          remote
            .getGlobal('mainWindow')
            .send('work-folder-added', workFolder)
          // dispatch('selectedFolder', selectedFolderPath)
        }
      })
    }
  }
}
