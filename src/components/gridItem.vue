<template>
  <transition
    appear
    enter-active-class="animated fadeIn"
    leave-active-class="animated fadeOut"
  >
    <q-card flat class="pkg-card-wrapper bg-white overflow-hidden">
      <div class="has-custom-exclusions bg-amber-6 text-white" v-if="hasCustomExclusions">
        has exclusions
      </div>
      <q-item class="pkg-card">
        <q-item-section avatar>
          <gridItemImage
            :pkg="pkg"
            :width="width"
          />
        </q-item-section>

        <q-item-section class="pkg-label">
          <q-item-label overline>{{ controller.name }} <em class="ver-num text-light-blue">{{ controller.versionNumber }}</em></q-item-label>
          <q-item-label caption>{{ pkg.handle }}</q-item-label>
        </q-item-section>

        <!-- <q-item-label class="pkg-label">
          <q-item-section label>{{ controller.name }} <em class="ver-num text-light-blue">{{ controller.versionNumber }}</em></q-item-section>
          <q-item-section sublabel>{{ pkg.handle }}</q-item-section>
        </q-item-label> -->
        <q-item-section side>
          <q-btn dense flat round icon="more_vert" size="md">
            <q-menu>
              <q-list link>
                <q-item clickable v-ripple v-close-popup @click.native="compress(pkg.handle)">
                  <q-item-section avatar style="min-width: auto;">
                    <q-icon name="archive" size="20px" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="unbreakable-label">
                      Zip “{{ controller.name.trim() }}”
                    </q-item-label>
                  </q-item-section>
                </q-item>
                <q-item clickable v-ripple v-close-popup @click.native="openPkgDir(pkg.nodeKey)">
                  <q-item-section avatar style="min-width: auto;">
                    <q-icon name="folder_open" size="20px" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="unbreakable-label">
                      Browse the “{{ controller.name.trim() }}” folder
                    </q-item-label>
                  </q-item-section>
                </q-item>
                <q-item clickable v-ripple v-close-popup @click.native="setShowSettings(pkg, controller.name)">
                  <q-item-section avatar style="min-width: auto;">
                    <q-icon name="link_off" size="20px" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="unbreakable-label">
                      Set file exclusions for “{{ controller.name.trim() }}”
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </q-item-section>
      </q-item>
    </q-card>
  </transition>
</template>

<script>
const fs = require('fs-extra')
const path = require('path')
const chokidar = require('chokidar')
import checkFileExists from '../util/check-file-exists'
// const archiver = require('archiver')
import gridItemImage from '../components/gridItemImage'
import { shell, ipcRenderer as ipc } from 'electron'

export default {
  name: 'GridItem',

  components: {
    gridItemImage
  },

  props: {
    pkg: {
      type: Object,
      required: true
    }
    // selectedPackage: {
    //   type: Object | null,
    //   required: true
    // }
    // viewType: {
    //   type: String,
    //   required: true
    // }
  },

  data () {
    return {
      width: 90,
      fontSize: 12,
      delay: 200,
      timer: null,
      controllerWatcher: null,
      exclusionsWatcher: null,
      controller: {
        versionNumber: 'v0.0.0',
        name: `¯\\_(ツ)_/¯`
      },
      isLast: false,
      exclusionPath: '',
      exclusionTimestamp: ''
    }
  },
  computed: {
    hasCustomExclusions: {
      // getter
      get: function () {
        // is this a folder?
        if (this.pkg.data.isDir) {
          const exclusionTimestamp = this.exclusionTimestamp
          if (checkFileExists(this.exclusionPath)) {
            return exclusionTimestamp
          } else {
            return false
          }
        }
      },
      // setter
      set: function (timestamp) {
        this.exclusionTimestamp = timestamp
      }
    }
  },
  mounted: function () {
    this.exclusionPath = this.pkg.nodeKey + path.sep + 'exclusions.json'
    this.exclusionTimestamp = new Date().getTime()
    this.exclusionsWatcherHandler(this.exclusionPath)

    const controller = this.pkg.nodeKey + path.sep + 'controller.php'
    this.setControllerData(controller)
    this.controllerWatcherHandler(controller)
    if (this.$parent.$children[this.$parent.$children.length - 1] === this) {
      // when loading the last of gridItem,
      // emit this event to init "holmes"
      // the search engine available on package-list
      this.$root.$emit('package-list-ready')
    }
  },

  methods: {
    setControllerData: function (controller) {
      const that = this
      fs.readFile(controller, 'utf-8', (error, data) => {
        // If an error occurs, log it in the console and return
        // so that no other errors can occur.
        if (error) {
          console.error('oups ' + error)
          return
        }

        const vRegex = /\$pkgVersion[\s*]=[\s*]['|"](.*)['|"]/
        const nRegex = /function[\s]+getPackageName[\s]*\([\s]*\)[\s]*{[\s\S]*?return[\s+]+t[\s]*\([\s]*['|"](.*)['|"]/
        const v = vRegex.exec(data)
        const n = nRegex.exec(data)

        if (v && v.length) {
          that.controller.versionNumber = 'v' + v[1]
        } else {
          that.controller.versionNumber = 'v0.0.0'
        }

        if (n && n.length) {
          const countPlaceholder = (n[1].match(/%s/g) || []).length
          if (countPlaceholder > 0) {
            // All this is just in case the name uses %s placeholders
            let splitStr = n[1].split(',')
            let splitStrCopy = splitStr
            const cntSplitStr = splitStr.length
            if (cntSplitStr >= countPlaceholder + 1) {
              let replacements = []
              const repRegex = /['|"]?(.*)['|"]?/
              let tmpStr = ''
              let finalStr = ''
              let i
              for (i = cntSplitStr - 1; i >= (cntSplitStr - countPlaceholder); --i) {
                tmpStr = splitStr[i].trim()
                tmpStr = repRegex.exec(tmpStr)
                tmpStr = tmpStr[1].replace(/['|"]$/, '')
                replacements.push(tmpStr)
                splitStrCopy.pop()
              }
              replacements = replacements.reverse()
              splitStrCopy = splitStrCopy.join(',')
              finalStr = repRegex.exec(splitStrCopy)
              finalStr = finalStr[1].replace(/['|"]$/, '')
              for (i = 0; i <= (replacements.length - 1); ++i) {
                finalStr = finalStr.replace('%s', replacements[i])
              }
              n[1] = finalStr
            }
          }
          that.controller.name = n[1]
        } else {
          that.controller.name = `¯\\_(ツ)_/¯`
        }
      })
    },
    controllerWatcherHandler: function (controller) {
      if (controller) {
        this.controllerWatcher = chokidar.watch(controller, {
          ignorePermissionErrors: true
        })
        if (this.controllerWatcher) {
          this.controllerWatcher.on('ready', () => { // initial scan done
            // we only care if controller.php is added/modified/deleted
            this.controllerWatcher
              .on('change', (path) => {
                // if files are changed we only care if it is
                // controller.php and only if inside a package
                this.setControllerData(path)
              })
          })
          this.controllerWatcher.on('error', (error) => { // initial scan done
            console.error(error)
          })
        }
      }
    },
    exclusionsWatcherHandler: function (exclusions) {
      if (exclusions) {
        this.exclusionsWatcher = chokidar.watch(exclusions, {
          depth: 1,
          ignorePermissionErrors: true
        })
        if (this.exclusionsWatcher) {
          this.exclusionsWatcher.on('ready', () => { // initial scan done
            this.exclusionsWatcher
              .on('add', (path, stats) => {
                // if files are added/renamed we only care if it is
                // exclusions.json and only if inside a package
                this.hasCustomExclusions = new Date().getTime()
              })
              .on('unlink', (path) => {
                // if files are deleted we only care if it is
                // exclusions.json and only if inside a package
                this.hasCustomExclusions = new Date().getTime()
              })
          })
          this.exclusionsWatcher.on('error', (error) => { // initial scan done
            console.error(error)
          })
        }
      }
    },
    setShowSettings: function (pkg, name) {
      pkg.name = name
      this.$root.$emit('show-package-settings', pkg)
      // this.showSettings = true
    },
    compress: async function (pkgHandle) {
      // let pkgHandle = pkg.handle
      let url = 'http://localhost:8000/pkg/' + pkgHandle
      let that = this
      ipc.once('zipped', function (event, data) {
        that.$q.notify({
          message: data.msg,
          color: 'green',
          icon: 'thumb_up',
          position: 'top-right',
          timeout: 4500
        })
        ipc.removeAllListeners('zip-progress')
      })

      ipc.on('zip-progress', function (event, data) {
        that.$emit('zip-progress-change', data)
      })

      that.$emit(
        'zip-progress-change',
        {
          start: true,
          done: false,
          heading: 'Preparing build process. Please wait.',
          total: 1,
          processed: 0,
          goahead: async () => {
            try {
              // ipc.removeAllListeners('start-building')
              const ret = await this.$axios.get(url)

              if (ret.status !== 200) {
                ipc.removeAllListeners('zipped')
                ipc.removeAllListeners('zip-progress')
              }
            } catch (err) {
              ipc.removeAllListeners('zipped')
              ipc.removeAllListeners('zip-progress')
              this.$q.notify({
                color: 'negative',
                position: 'top',
                message: 'Loading failed',
                icon: 'report_problem'
              })
            }
            return true
          }
        }
      )
      // try {
      //   // ipc.removeAllListeners('start-building')
      //   const ret = await this.$axios.get(url)

      //   if (ret.status !== 200) {
      //     ipc.removeAllListeners('zipped')
      //     ipc.removeAllListeners('zip-progress')
      //   }
      // } catch (err) {
      //   ipc.removeAllListeners('zipped')
      //   ipc.removeAllListeners('zip-progress')
      //   this.$q.notify({
      //     color: 'negative',
      //     position: 'top',
      //     message: 'Loading failed',
      //     icon: 'report_problem'
      //   })
      // }
      return true
    },
    openPkgDir (path) {
      shell.openItem(path)
    }
  },
  beforeDestroy: function () {
    this.controllerWatcher.close()
    this.exclusionsWatcher.close()
  }
}
</script>

<style>
.pkg-card-wrapper {
  border: 1px solid #ececec;
  /* background-color: #fff; */
  word-wrap: break-word;
  position: relative;
}
.pkg-card-wrapper:hover {
  cursor: pointer;
  box-shadow: 0 1px 5px  rgba(0,0,0,0.2), 0 2px 2px rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12)!important;
  -webkit-transition: all 0.3s ease-in-out;
  transition: all 0.3s ease-in-out;
}
.pkg-card {
  padding: 5px;
}
.pkg-card .ver-num {
  font-style: italic;
  font-size: 75%;
}
.has-custom-exclusions {
    position: absolute;
    padding: 0 0.8em 0 0.8em;
    font-size: 0.8em;
    margin: 0;
    top: 1px;
    right: 1px;
    z-index: 99;
    line-height: 1.875em;
    border-radius: 0 4px 0 4px!important;
}
.unbreakable-label{
  white-space: nowrap!important;
}
</style>
