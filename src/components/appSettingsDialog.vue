<template>
  <q-dialog
    v-model="shouldTrigger"
    key="appSettingsDialog"
    ok="SAVE"
    cancel="CANCEL"
    @ok="onOk"
    @cancel="onCancel"
    @show="onShow"
    @hide="onHide"
    class="app-settings-dialog"
  >
    <span slot="title">Packager Settings</span>
    <div slot="body">
      <div class="row">
        <div class="col-12">
          <q-field
            helper="Where we'll build the package and save the release zip file."
            :error="workFolderHasError"
            error-label="We need an existing and valid folder"
            :warning="workFolderHasWarning"
            warning-label="If left empty it will revert back to default"
            :label-width="12"
          >
            <div class="row gutter-xs">
              <q-input
                v-model.trim.lazy="selectedWorkFolder"
                float-label="Build & release destination folder"
                class="col-10"
                />
              <div class="col-2 relative-position">
                <q-btn
                  icon="folder_special"
                  color="green"
                  @click="triggerSelectWorkFolder"
                  aria-label="Select your build & release destination folder"
                  class="btn-work-root"
                />
              </div>
            </div>
          </q-field>
        </div>

        <div class="col-12">
          <q-field
            :label-width="12"
            class="q-mt-lg"
          >
            <div class="row">
              <q-checkbox
                v-model="selectDeleteBuildFolder"
                label="Delete the build folder after zipping up the package"
                true-value="yes"
                false-value="no"
                />
            </div>
          </q-field>
        </div>

        <div class="col-12">
          <q-field
            :label-width="12"
            class="q-mt-lg"
          >
            <div class="row">
              <q-checkbox
                v-model="selectAddC5Exec"
                label="Add missing C5_EXECUTE to every PHP file"
                true-value="yes"
                false-value="no"
                />
            </div>
          </q-field>
        </div>
      </div>
    </div>
  </q-dialog>

</template>

<script>
import settingsStore from '../util/app-settings-store'
import { ipcRenderer as ipc } from 'electron'
const remote = require('electron').remote
const path = require('path')

export default {
  name: 'AppSettingsDialog',

  props: {
  },
  components: {},
  data () {
    return {
      trigger: false,
      workFolder: '',
      deleteBuildFolder: 'yes',
      addC5Exec: 'yes',
      defPath: '',
      workFolderHasError: false,
      workFolderHasWarning: false
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
    selectedWorkFolder: {
      get: function () {
        if (this.workFolder && this.workFolder.length > 0) {
          return this.workFolder
        }

        return this.defPath
      },
      // setter
      set: function (newValue) {
        if (newValue.length <= 0 && this.workFolder.length <= 0) {
          this.workFolder = this.defPath
        } else {
          this.workFolder = newValue
        }
      }
    },
    selectDeleteBuildFolder: {
      get: function () {
        return this.deleteBuildFolder
      },
      // setter
      set: function (newValue) {
        this.deleteBuildFolder = newValue
      }
    },
    selectAddC5Exec: {
      get: function () {
        return this.addC5Exec
      },
      // setter
      set: function (newValue) {
        this.addC5Exec = newValue
      }
    }
  },
  methods: {
    triggerSelectWorkFolder () {
      remote
        .getGlobal('mainWindow')
        .send('select-work-folder')
    },
    // when props.ok() gets called
    onOk (data) {
      if (!this.workFolder || !this.workFolder.length) {
        settingsStore.clearAppSettings('workFolder')
        this.workFolder = ''
      } else {
        settingsStore.setAppSettings(this.workFolder, 'workFolder')
      }
      settingsStore.setAppSettings(this.deleteBuildFolder, 'deleteBuildFolder')
      settingsStore.setAppSettings(this.addC5Exec, 'addC5Exec')
    },

    // when props.cancel() gets called
    onCancel () { },

    // when we show it to the user
    onShow () {
      this.workFolder = settingsStore.getAppSettings('workFolder', this.defPath)
      this.deleteBuildFolder = settingsStore.getAppSettings('deleteBuildFolder', 'yes')
      this.addC5Exec = settingsStore.getAppSettings('addC5Exec', 'yes')
    },

    // when it gets hidden
    onHide () { }
  },
  mounted: function () {
    let defPath = remote.app.getPath('home').split(path.sep)
    defPath.push('c5-packager')
    this.defPath = defPath.join(path.sep)
    this.workFolder = settingsStore.getAppSettings('workFolder', this.defPath)
    this.deleteBuildFolder = settingsStore.getAppSettings('deleteBuildFolder', 'yes')
    this.addC5Exec = settingsStore.getAppSettings('addC5Exec', 'yes')

    ipc.on('work-folder-added', (event, folder) => {
      this.workFolder = folder
    })

    this.$root.$on('show-app-settings', (event) => {
      this.trigger = true
    })
  },
  created () {

  },
  beforeDestroy: function () {
    this.$root.$off('show-app-settings')
  }
}
</script>
<style>
.btn-work-root {
  position: absolute;
  bottom: 0;
}
.app-settings-dialog .modal-content {
  min-width: 550px
}

.app-settings-dialog .modal-body.modal-scroll {
  max-height: none;
  overflow: hidden;
}
</style>
