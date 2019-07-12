<template>
  <q-dialog
    v-model="shouldTrigger"
    @show="onShow"
    @hide="onHide"
    class="app-settings-dialog"
  >
    <q-card class="q-px-sm q-pb-md">
        <q-card-section>
          <div class="text-h5">File Exclusions for “{{ pkg.name }}”</div>
        </q-card-section>
        <q-card-section>
          <div class="row">
            <div class="col-12 q-mb-lg">
              <q-input
                v-model.trim.lazy="selectedExtensionExclusions"
                label="File extensions to exclude"
                hint="A coma separated list of file extensions you want excluded (no dots) for this package only."
                bottom-slots
                />
            </div>
            <div class="col-12 q-mb-lg">
              <q-input
                v-model.trim.lazy="selectedFileFolderExclusions"
                label="Files & folders to exclude"
                hint="A coma separated list of file & folders you want excluded from this package only."
                bottom-slots
                />
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="CANCEL" v-close-popup />
          <q-btn flat label="SAVE" v-close-popup @click.native="onOk()" />
        </q-card-actions>
      </q-card>
  </q-dialog>

</template>

<script>
import checkFileExists from '../util/check-file-exists'
const path = require('path')
const fs = require('fs-extra')

export default {
  name: 'PackageSettingsDialog',

  props: {
  },
  components: {},
  data () {
    return {
      trigger: false,
      pkg: {},
      extensionExclusions: '',
      fileFolderExclusions: '',
      exclusionsFile: ''
    }
  },
  computed: {
    shouldTrigger: {
      get: function () {
        return this.trigger
      },
      // setter
      set: function (newValue) {
        this.trigger = newValue
      }
    },
    selectedExtensionExclusions: {
      get: function () {
        if (this.extensionExclusions && this.extensionExclusions.length > 0) {
          return this.extensionExclusions
        }

        return ''
      },
      // setter
      set: function (newValue) {
        if (newValue.length <= 0 && this.extensionExclusions.length <= 0) {
          this.extensionExclusions = ''
        } else {
          this.extensionExclusions = newValue
        }
      }
    },
    selectedFileFolderExclusions: {
      get: function () {
        if (this.fileFolderExclusions && this.fileFolderExclusions.length > 0) {
          return this.fileFolderExclusions
        }

        return ''
      },
      // setter
      set: function (newValue) {
        if (newValue.length <= 0 && this.fileFolderExclusions.length <= 0) {
          this.fileFolderExclusions = ''
        } else {
          this.fileFolderExclusions = newValue
        }
      }
    }
  },
  methods: {
    onOk (data) {
      console.log('on ok')
      var exclusions = {}
      if (!this.extensionExclusions || !this.extensionExclusions.length) {
        this.extensionExclusions = ''
      } else {
        exclusions.extensions = this.extensionExclusions.split(',').map(str => str.trim())
      }
      if (!this.fileFolderExclusions || !this.fileFolderExclusions.length) {
        this.fileFolderExclusions = ''
      } else {
        exclusions.filesfolders = this.fileFolderExclusions.split(',').map(str => str.trim())
      }
      if (exclusions.extensions || exclusions.filesfolders) {
        fs.writeJson(this.exclusionsFile, exclusions)
          .then(() => {
            this.$q.notify({
              message: 'Your settings were successfully saved',
              color: 'green',
              icon: 'thumb_up',
              position: 'top-right',
              timeout: 1500
            })
          })
          .catch(err => {
            console.error('oups writing exclusions file ' + err)
            this.$q.notify({
              message: 'There was a problem saving your settings',
              color: 'red',
              icon: 'thumb_down',
              position: 'top-right',
              timeout: 1500
            })
          })
      } else {
        fs.remove(this.exclusionsFile)
          .then(() => {
            this.$q.notify({
              message: 'Your settings were successfully cleared',
              color: 'green',
              icon: 'thumb_up',
              position: 'top-right',
              timeout: 1500
            })
          })
          .catch(err => {
            console.error('oups removing exclusions file ' + err)
            this.$q.notify({
              message: 'There was a problem clearing your settings',
              color: 'red',
              icon: 'thumb_down',
              position: 'top-right',
              timeout: 1500
            })
          })
      }
    },

    // when props.cancel() gets called
    onCancel () { },

    // when we show it to the user
    onShow () { },

    // when it gets hidden
    onHide () { }
  },
  mounted: function () {
    // this.extensionExclusions = settingsStore.getAppSettings('extensionExclusions', '')
    // this.fileFolderExclusions = settingsStore.getAppSettings('fileFolderExclusions', '')

    this.$root.$on('show-package-settings', (event) => {
      console.log('launch')
      this.pkg = event
      this.exclusionsFile = this.pkg.nodeKey + path.sep + 'exclusions.json'
      let filesfolders = ''
      let extensions = ''
      let triggerRightAway = true
      if (checkFileExists(this.exclusionsFile)) {
        triggerRightAway = false
        fs.readJson(this.exclusionsFile, 'utf-8')
          .then(data => {
            let filesfolders = data.filesfolders
            let extensions = data.extensions

            if (filesfolders) {
              filesfolders = filesfolders.map(str => str.trim()).join(',')
            }

            if (extensions) {
              extensions = extensions.map(str => str.trim()).join(',')
            }
            this.extensionExclusions = extensions
            this.fileFolderExclusions = filesfolders
            this.trigger = true
          })
          .catch(err => {
            console.error('oups reading exclusions file ' + err)
            triggerRightAway = true
          })
      }

      if (triggerRightAway) {
        this.extensionExclusions = extensions
        this.fileFolderExclusions = filesfolders
        this.trigger = true
      }
    })
  },
  created () {

  },
  beforeDestroy: function () {
    this.$root.$off('show-package-settings')
  }
}
</script>
<style>
.btn-work-root {
  position: absolute;
  top: 15px;
  width: 100%;
}
.app-settings-dialog .modal-content {
  min-width: 550px
}

.app-settings-dialog .modal-body.modal-scroll {
  max-height: none;
  overflow: hidden;
}
</style>
