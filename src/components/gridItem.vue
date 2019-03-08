<template>
  <transition
    appear
    enter-active-class="animated fadeIn"
    leave-active-class="animated fadeOut"
  >
    <q-card flat class="pkg-card-wrapper bg-white overflow-hidden">
      <q-item class="pkg-card">
        <q-item-side>
          <gridItemImage
            :pkg="pkg"
            :width="width"
          />
        </q-item-side>
        <q-item-main class="pkg-label">
          <q-item-tile label>{{ controller.name }} <em class="ver-num text-light-blue">{{ controller.versionNumber }}</em></q-item-tile>
          <q-item-tile sublabel>{{ pkg.handle }}</q-item-tile>
        </q-item-main>
        <q-item-side right inverted>
          <q-btn dense flat round icon="more_vert" size="md">
            <q-popover>
              <q-list link>
                <q-item v-close-overlay @click.native="compress(pkg.handle)">
                  <q-item-side left style="min-width: auto;">
                    <q-icon name="archive" size="20px" />
                  </q-item-side>
                  <q-item-main>
                    Zip “{{ controller.name }}”
                  </q-item-main>
                </q-item>
                <q-item v-close-overlay @click.native="openPkgDir(pkg.nodeKey)">
                  <q-item-side left style="min-width: auto;">
                    <q-icon name="folder_open" size="20px" />
                  </q-item-side>
                  <q-item-main>
                    Open “{{ controller.name }}” folder
                  </q-item-main>
                </q-item>
              </q-list>
            </q-popover>
          </q-btn>
        </q-item-side>
      </q-item>
    </q-card>
  </transition>
</template>

<script>
const fs = require('fs-extra')
const path = require('path')
const chokidar = require('chokidar')
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
      watcher: null,
      controller: {
        versionNumber: 'v0.0.0',
        name: `¯\\_(ツ)_/¯`
      },
      isLast: false
    }
  },

  mounted: function () {
    const controller = this.pkg.nodeKey + path.sep + 'controller.php'
    this.setControllerData(controller)
    this.rootWatcherHandler(controller)
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
    rootWatcherHandler: function (controller) {
      if (controller) {
        this.watcher = chokidar.watch(controller, {
          ignorePermissionErrors: true
        })
        if (this.watcher) {
          this.watcher.on('ready', () => { // initial scan done
            // we only care if controller.php is added/modified/deleted
            this.watcher
              .on('change', (path) => {
                // if files are changed we only care if it is
                // controller.php and only if inside a package
                this.setControllerData(path)
              })
          })
          this.watcher.on('error', (error) => { // initial scan done
            console.error(error)
          })
        }
      }
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
          heading: 'Preparing building process. Please wait',
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
    this.watcher.close()
  }
}
</script>

<style>
.pkg-card-wrapper {
  border: 1px solid #ececec;
  /* background-color: #fff; */
  word-wrap: break-word;
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
</style>
