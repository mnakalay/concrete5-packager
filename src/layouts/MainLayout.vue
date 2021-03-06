<template>
  <!-- <q-layout view="hHh lpR fFf"> -->
    <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="leftDrawerOpen = !leftDrawerOpen" aria-label="Menu" />
        <q-toolbar-title>
          Concrete5 Packager
          <div slot="subtitle">Running on Quasar v{{ $q.version }}</div>
        </q-toolbar-title>
        <!-- <q-toolbar-title>
          <q-avatar>
            <img src="https://cdn.quasar.dev/logo/svg/quasar-logo.svg">
          </q-avatar>
          Title
        </q-toolbar-title> -->
        <q-btn
          flat
          dense
          round
          @click.native="openWorkFolder()"
          aria-label="Click to browse your build & release folders"
        >
          <q-icon name="folder_open" />
          <q-tooltip>
            Browse your Build & Release folders
          </q-tooltip>
        </q-btn>
        <q-btn
          flat
          dense
          round
          @click="setShowSettings"
          aria-label="Click to open the settings screen"
        >
          <q-icon name="settings" />
          <q-tooltip>
            Settings
          </q-tooltip>
        </q-btn>
        <q-btn
          flat
          dense
          round
          @click.native="openAboutWindow()"
          aria-label="Click to display information about this app"
        >
          <q-icon name="details" />
          <q-tooltip>
            About this app
          </q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <!-- <q-drawer v-model="left" side="left" bordered>
    </q-drawer> -->
    <q-drawer
      v-model="leftDrawerOpen"
      side="left"
      :content-class="'bg-grey-2'"
      bordered
    >

      <!-- <q-list
        no-border
        inset-delimiter
      > -->

      <q-list>
        <q-item>
          <q-item-section>
            <div class="row justify-center items-center">
              <q-btn
                icon="library_add"
                label="Add a Concrete5 root"
                color="green"
                @click="triggerSelectRoot"
                aria-label="Add a Concrete5 root"
              />
            </div>
          </q-item-section>
        </q-item>
      </q-list>
      <!-- <div class="root-list-wrapper">
      <q-list
        separator
      > -->
        <!-- <q-item-label header>Concrete5 Root Folders</q-item-label> -->
        <root-list v-bind:roots="roots"></root-list>
      <!-- </q-list>
      </div> -->
    </q-drawer>

    <!-- <q-page-container>
      <router-view />
    </q-page-container> -->
    <q-page-container>
      <package-list
        :packages="packages"
      />
      <router-view v-if="!packages.length" />
    </q-page-container>
    <app-settings-dialog />
    <package-settings-dialog />
  </q-layout>
</template>

<script>
// This gives us access to the underlying Electron
// object from the "main" process
const remote = require('electron').remote
const path = require('path')
// file watcher
const chokidar = require('chokidar')

import walkFolders from '../util/walkFolders'
import rootList from '../components/rootList'
import appSettingsDialog from '../components/appSettingsDialog'
import packageSettingsDialog from '../components/packageSettingsDialog'
import packageList from '../pages/package-list'
import checkDirExists from '../util/check-dir-exists'
import checkFileExists from '../util/check-file-exists'
import settings from '../util/app-settings'
import settingsStore from '../util/app-settings-store'
import { shell, ipcRenderer as ipc } from 'electron'

export default {
  name: 'MainLayout',
  components: {
    // Add a reference to the RootList component in the components property
    rootList,
    packageList,
    appSettingsDialog,
    packageSettingsDialog
  },
  data () {
    return {
      leftDrawerOpen: true,
      // left: true,
      showSettings: false,
      roots: [],
      packages: [],
      selectedRoot: null,
      selectedID: null,
      refreshDialogVisible: false,
      watcher: null
    }
  },
  computed: {
    // shouldShowSettings: {
    //   get: function () {
    //     return this.showSettings
    //   },
    //   // setter
    //   set: function (newValue) {
    //     this.showSettings = newValue
    //   }
    // }
  },
  watch: {
    selectedRoot: function (newRoot, oldRoot) {
      // The User can de-select a Root, in which case
      // value will be null, so use root Root
      if (!newRoot) {
        newRoot = null
      }
      // const that = this
      // tell back-end to serve files from this folder
      ipc.send('root', newRoot)

      // root watcher handler
      this.rootWatcherHandler(newRoot, oldRoot)

      this.clearAllPackages()
      this.packages.push(...this.getRootPackages(newRoot))
    }
  },
  methods: {
    setShowSettings: function () {
      this.$root.$emit('show-app-settings')
      // this.showSettings = true
    },
    setSelectedRoot: function (root) {
      this.selectedRoot = root
    },
    shouldClear: function (root) {
      if (this.selectedRoot === root) {
        this.setSelectedRoot(null)
      }
    },
    rescanCurrentRoot: function () {
      if (this.refreshDialogVisible) {
        return
      }
      const that = this
      this.refreshDialogVisible = true
      this.$q.dialog({
        title: 'Packages modified',
        message: 'Some packages were added or removed. Do you want to refresh the list?',
        ok: 'Yes please!',
        cancel: 'No'
      }).onOk(() => {
        that.clearAllPackages()
        that.packages.push(...that.getRootPackages(that.selectedRoot))
        that.refreshDialogVisible = false
      }).onCancel(() => {
        console.log('refresh cancelled')
        that.refreshDialogVisible = false
      })
    },
    rootWatcherHandler: function (newRoot, oldRoot) {
      if (oldRoot && this.watcher) {
        this.watcher.close()
      }
      if (newRoot) {
        // let backend know to statically serve files from this folder
        ipc.send('root', newRoot)

        this.watcher = chokidar.watch(newRoot + path.sep + 'packages', {
          depth: 1,
          ignorePermissionErrors: true,
          ignored: '*.*'
        })
        if (this.watcher) {
          this.watcher.on('ready', () => { // initial scan done
            // we only care if controller.php is added/modified/deleted
            this.watcher
              .on('add', (path, stats) => {
                // if files are added/renamed we only care if it is
                // controller.php and only if inside a package
                if (this.validatePackageChanges(path)) {
                  this.$root.$emit('rescan-current-root')
                }
              })
              .on('unlink', (path) => {
                // if files are deleted we only care if it is
                // controller.php and only if inside a package
                if (this.validatePackageChanges(path)) {
                  this.$root.$emit('rescan-current-root')
                }
              })
              // .on('change', (path) => {
              //   // if files are changed we only care if it is
              //   // controller.php and only if inside a package
              //   if (this.validatePackageChanges(path)) {
              //     this.$root.$emit('rescan-current-root', 'change')
              //   }
              // })
          })
          this.watcher.on('error', (error) => { // initial scan done
            console.error(error)
          })
        }
      }
    },
    validatePackageChanges: function (rootPath) {
      let parts = rootPath.split(path.sep)
      if (parts.length > 1 && parts[parts.length - 1].trim() === '') {
        parts.pop()
      }
      return (
        parts[parts.length - 1] === 'controller.php' &&
        parts[parts.length - 2] !== 'packages' &&
        parts[parts.length - 3] === 'packages'
      )
    },
    getRootPackages: function (root) {
      let packages = []
      let fullPath = ''

      // check incoming arg
      if (!root || typeof root !== 'string') {
        return packages
      }

      if (root.charAt(root.length - 1) !== path.sep) {
        root += path.sep
      }
      root += 'packages'

      for (const fileInfo of walkFolders(root, 0)) {
        // all files and folders
        if ('error' in fileInfo) {
          console.error(`Error: ${fileInfo.rootDir} - ${fileInfo.error}`)
          continue
        }
        // not a directory
        if (!fileInfo.isDir) {
          continue
        }

        fullPath = fileInfo.path
        if (fullPath.charAt(fullPath.length - 1) !== path.sep) {
          fullPath += path.sep
        }

        // no controller
        if (!checkFileExists(fullPath + 'controller.php')) {
          continue
        }

        const node = this.createNode(fileInfo)
        packages.push(node)
      }

      return packages
    },
    createNode: function (fileInfo) {
      let nodeKey = fileInfo.rootDir
      if (nodeKey.charAt(nodeKey.length - 1) !== path.sep) {
        nodeKey += path.sep
      }
      if (fileInfo.fileName === path.sep) {
        fileInfo.fileName = nodeKey
      } else {
        nodeKey += fileInfo.fileName
      }
      // create object
      return {
        handle: fileInfo.fileName,
        nodeKey: nodeKey,
        data: {
          isDir: fileInfo.isDir,
          rootDir: fileInfo.rootDir,
          stat: fileInfo.stat
        }
      }
    },
    clearAllPackages: function () {
      this.packages.splice(0, this.packages.length)
    },
    triggerSelectRoot: function () {
      remote
        .getGlobal('mainWindow')
        .send('select-root')
        // in electron-main.js mainWindow was a local variable
        // So I didn't have access to it and had to do
        // remote
        // .getCurrentWindow()
        // .webContents
        // .send('select-root')
        // But now I attached it to global and I can have access
        // and send my trigger straight to it
    },
    buildRootList: function (check) {
      // settings2.clearAppSettings('ignore')
      // settings2.setAppSettings(['css/buttons.css'], 'ignore')
      check = check || false
      let gRootList = JSON.parse(settings.getAppSettings('rootList')) || []
      let rootList = []

      if (!gRootList) {
        return
      }

      gRootList.forEach(function (rootPath, index) {
        let parts = rootPath.split(path.sep)
        if (parts.length > 1 && parts[parts.length - 1].trim() === '') {
          parts.pop()
        }

        if (check) {
          parts.push('packages')
          if (!checkDirExists(parts.join(path.sep))) {
            gRootList.splice(index, 1)
            return
          }
          // removing packages
          parts.pop()
        }

        rootList.push({id: index, path: rootPath, label: parts[parts.length - 1]})
      })

      if (check) {
        settings.setAppSettings(JSON.stringify(gRootList), 'rootList')
      }

      if (rootList.length) {
        rootList.sort(function (a, b) {
          // Use toUpperCase() to ignore character casing
          const labelA = a.label.toUpperCase()
          const labelB = b.label.toUpperCase()

          let comparison = 0
          if (labelA > labelB) {
            comparison = 1
          } else if (labelA < labelB) {
            comparison = -1
          }
          return comparison
        })
      }
      this.roots = rootList
    },
    openWorkFolder () {
      let defPath = remote.app.getPath('home').split(path.sep)
      defPath.push('c5-packager')
      defPath = defPath.join(path.sep)
      let workFolder = settingsStore.getAppSettings('workFolder', defPath)
      shell.openItem(workFolder)
    },
    openAboutWindow () {
      ipc.send('show-about')
    }
  },
  created () {
    ipc.on('root-added', (event) => {
      this.buildRootList()
    })

    this.$root.$on('root-removed', this.shouldClear)
    this.$root.$on('display-pkg', this.setSelectedRoot)
    this.$root.$on('rescan-current-root', this.rescanCurrentRoot)
    this.buildRootList(true)
  },
  beforeDestroy: function () {
    this.$root.$off('root-removed', this.shouldClear)
    this.$root.$off('display-pkg', this.setSelectedRoot)
    this.$root.$off('rescan-current-root', this.rescanCurrentRoot)
    this.watcher.close()
    // if (this.packages && this.packages.length) {
    //   this.packages.destroy()
    // }

    // if (this.roots && this.roots.length) {
    //   this.roots.destroy()
    // }
  }
}
</script>

<style>
</style>
