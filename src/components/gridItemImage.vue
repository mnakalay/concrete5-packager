<template>
  <div class="square" :style="gridItemImageContainerStyleObject">
    <span class="img-helper"></span><img :src="pkgIcon" :style="gridItemImageStyleObject">
  </div>
</template>

<script>
import checkFileExists from '../util/check-file-exists'
const path = require('path')
const chokidar = require('chokidar')

export default {
  name: 'GridItemImage',

  props: {
    pkg: {
      type: Object,
      required: true
    },
    width: {
      type: Number,
      required: true
    }
  },

  data () {
    return {
      basePath: 'statics/images/',
      iconPath: '',
      iconRoute: '',
      watcher: null
    }
  },
  methods: {
    rootWatcherHandler: function (icon) {
      if (icon) {
        this.watcher = chokidar.watch(icon, {
          depth: 1,
          ignorePermissionErrors: true
        })
        if (this.watcher) {
          this.watcher.on('ready', () => { // initial scan done
            // we only care if icon.png is modified
            this.watcher
              .on('add', (path, stats) => {
                // if files are added/renamed we only care if it is
                // controller.php and only if inside a package
                this.pkgIcon = new Date().getTime()
              })
              .on('unlink', (path) => {
                // if files are deleted we only care if it is
                // controller.php and only if inside a package
                this.pkgIcon = new Date().getTime()
              })
              .on('change', (path) => {
                // if files are changed we only care if it is
                // icon.png
                this.pkgIcon = new Date().getTime()
              })
          })
          this.watcher.on('error', (error) => { // initial scan done
            console.error(error)
          })
        }
      }
    }
  },
  computed: {
    gridItemImageContainerStyleObject: function () {
      return {
        height: this.width + 10 + 'px',
        width: this.width + 10 + 'px'
      }
    },

    gridItemImageStyleObject: function () {
      return {
        'max-height': this.width + 'px',
        'max-width': this.width + 'px',
        'vertical-align': 'middle',
        'border-radius': '4px'
      }
    },

    pkgIcon: {
      // getter
      get: function () {
        // is this a folder?
        if (this.pkg.data.isDir) {
          const iconRoute = this.iconRoute
          if (checkFileExists(this.iconPath)) {
            return iconRoute
          } else {
            return this.basePath + 'icon_package_generic.png'
          }
        }
      },
      // setter
      set: function (timestamp) {
        this.iconRoute = 'http://localhost:8000/file/' + this.pkg.handle + '?' + timestamp
      }
    }
  },

  mounted: function () {
    this.iconPath = this.pkg.nodeKey + path.sep + 'icon.png'
    this.iconRoute = 'http://localhost:8000/file/' + this.pkg.handle
    this.rootWatcherHandler(this.iconPath)
  },
  beforeDestroy: function () {
    this.watcher.close()
  }
}
</script>

<style>
.square {
  text-align: center;
}

.img-helper {
  display: inline-block;
  height: 100%;
  vertical-align: middle;
}
</style>
