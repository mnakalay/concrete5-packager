<template>
  <q-dialog
    v-model="shouldTrigger"
    @show="onShow"
    @hide="onHide"
    class="app-settings-dialog"
  >
    <q-card class="q-px-sm q-pb-md">
        <q-card-section>
          <div class="text-h5">Packager Settings</div>
        </q-card-section>
        <q-card-section>
          <div class="row">
            <div class="col-12 q-mb-lg">
              <!-- <q-field
                helper="Where we'll build the package and save the release zip file."
                :error="workFolderHasError"
                error-label="We need an existing and valid folder"
                :warning="workFolderHasWarning"
                warning-label="If left empty it will revert back to default"
                :label-width="12"
              > -->
                <div class="row">
                  <div class="col-11">
                    <q-input
                      v-model.trim.lazy="selectedWorkFolder"
                      label="Build & release destination folder"
                      hint="Where we'll build the package and save the release zip file."
                      bottom-slots
                      />
                  </div>
                  <div class="col-1 relative-position">
                    <q-btn
                      icon="folder_special"
                      color="green"
                      @click="triggerSelectWorkFolder"
                      aria-label="Select your build & release destination folder"
                      class="btn-work-root"
                    />
                  </div>
                </div>
              <!-- </q-field> -->
            </div>

            <div class="col-12 q-mb-lg">
              <!-- <q-field
                helper="A coma separated list of file extensions you want excluded (no dots). Extensions already excluded are:
                sh, bash, bat, bin, exe, msi, sublime-project, sublime-workspace, code-workspace"
                :label-width="12"
              > -->
                <!-- <div class="row">
                  <div class="col-12"> -->
                    <q-input
                      v-model.trim.lazy="selectedExtensionExclusions"
                      label="File extensions to exclude"
                      hint="A coma separated list of file extensions you want excluded (no dots). Extensions already excluded are: sh, bash, bat, bin, exe, msi, sublime-project, sublime-workspace, code-workspace"
                      bottom-slots
                      />
                    <!-- </div> -->
                <!-- </div> -->

              <!-- </q-field> -->
            </div>

            <!-- <div class="col-12"> -->
              <!-- <q-field
                helper="A coma separated list of file & folders you want excluded. Files & folders already excluded are:
                Desktop.ini, thumbs.db, __macosx, DEV, .gitignore, .php_cs.dist, .vscode, .git, .idea, exclusions.json"
                :label-width="12"
              > -->
                <!-- <div class="row"> -->
                <div class="col-12 q-mb-lg">
                  <q-input
                    v-model.trim.lazy="selectedFileFolderExclusions"
                    label="Files & folders to exclude"
                    hint="A coma separated list of file & folders you want excluded. Files & folders already excluded are:
                Desktop.ini, thumbs.db, __macosx, DEV, .gitignore, .php_cs.dist, .vscode, .git, .idea, exclusions.json"
                    bottom-slots
                    />
                </div>
                <!-- </div> -->
              <!-- </q-field> -->
            <!-- </div> -->

            <!-- <div class="col-12"> -->
              <!-- <q-field
                :label-width="12"
                class="q-mt-lg"
              > -->
              <!-- <div class="q-mt-lg"> -->
                <div class="col-12 q-mb-lg">
                  <q-checkbox
                    v-model="selectDeleteBuildFolder"
                    label="Delete the build folder after zipping up the package"
                    true-value="yes"
                    false-value="no"
                    />
                </div>
              <!-- </div> -->

              <!-- </q-field> -->
            <!-- </div> -->

            <!-- <div class="col-12"> -->
              <!-- <q-field
                :label-width="12"
                class="q-mt-lg"
              > -->
              <!-- <div class="q-mt-lg"> -->
                <div class="col-12 q-mb-lg">
                  <q-checkbox
                    v-model="selectAddC5Exec"
                    label="Add missing C5_EXECUTE to every PHP file"
                    true-value="yes"
                    false-value="no"
                    />
                </div>
              <!-- </div> -->
              <!-- </q-field> -->
            <!-- </div> -->
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
      extensionExclusions: '',
      fileFolderExclusions: '',
      deleteBuildFolder: 'yes',
      addC5Exec: 'yes',
      defPath: ''
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
      if (!this.extensionExclusions || !this.extensionExclusions.length) {
        settingsStore.clearAppSettings('extensionExclusions')
        this.extensionExclusions = ''
      } else {
        settingsStore.setAppSettings(this.extensionExclusions, 'extensionExclusions')
      }
      if (!this.fileFolderExclusions || !this.fileFolderExclusions.length) {
        settingsStore.clearAppSettings('fileFolderExclusions')
        this.fileFolderExclusions = ''
      } else {
        settingsStore.setAppSettings(this.fileFolderExclusions, 'fileFolderExclusions')
      }
      settingsStore.setAppSettings(this.deleteBuildFolder, 'deleteBuildFolder')
      settingsStore.setAppSettings(this.addC5Exec, 'addC5Exec')
      this.$q.notify({
        message: 'Your settings were successfully saved',
        color: 'green',
        icon: 'thumb_up',
        position: 'top-right',
        timeout: 1500
      })
    },

    // when props.cancel() gets called
    onCancel () { },

    // when we show it to the user
    onShow () {
      this.workFolder = settingsStore.getAppSettings('workFolder', this.defPath)
      this.extensionExclusions = settingsStore.getAppSettings('extensionExclusions', '')
      this.fileFolderExclusions = settingsStore.getAppSettings('fileFolderExclusions', '')
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
    this.extensionExclusions = settingsStore.getAppSettings('extensionExclusions', '')
    this.fileFolderExclusions = settingsStore.getAppSettings('fileFolderExclusions', '')
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
