<template>
<div class="root-list-wrapper">
      <q-list
        separator
      >
  <Root
    @click.native="setActive(root.id, $event)"
    v-on:remove-root="removeRoot"
    v-for="root in roots"
    v-bind:root="root"
    :key="root.id"
    :class="{ 'text-cyan-10 bg-light-blue-3 root-active': isActive(root.id) }"
  >
  </Root>
      </q-list>
      </div>
<!-- </div> -->
</template>

<script>
import Root from './root'
// import settings from '../util/app-settings-store'
import settings from '../util/app-settings'

export default {
  name: 'rootList',
  props: ['roots'],
  components: {
    Root
  },
  data () {
    return {
      activeRootID: null
    }
  },

  methods: {
    setActive (id, event) {
      let classes = ['btn-remove-root', 'btn-open-dir']
      let setActive = true

      for (let classname of classes) {
        if (
          event.target.classList.contains(classname) ||
          event.target.parentNode.classList.contains(classname) ||
          event.target.parentNode.parentNode.classList.contains(classname)
        ) {
          setActive = false
        }
      }
      if (setActive) {
        this.activeRootID = id
      }
    },
    isActive (id) {
      return this.activeRootID === id
    },
    removeRoot (root) {
      this.$q.dialog({
        title: 'Confirm',
        message: 'Please confirm you want to remove Concrete5 root “' + root.label + '”',
        ok: 'Yes, remove!',
        cancel: 'No'
      }).onOk(() => {
        // let gRootList = JSON.parse(settings.getAppSettings('rootList')) || []
        console.log('removing')
        // let gRootList = settings.getAppSettings('rootList', [])
        let gRootList = JSON.parse(settings.getAppSettings('rootList')) || []
        const rootID = root.id
        gRootList.splice(rootID, 1)
        settings.setAppSettings(JSON.stringify(gRootList), 'rootList')
        // settings.setAppSettings(gRootList, 'rootList')

        const rootIndex = this.roots.indexOf(root)
        this.roots.splice(rootIndex, 1)
        this.$root.$emit('root-removed', root.path)

        this.$q.notify({
          message: 'Concrete5 root “' + root.label + '” successfully removed',
          color: 'green',
          icon: 'thumb_up',
          position: 'top-right',
          timeout: 1500
        })
      }).onCancel(() => {
        console.log('removal cancelled')
      }).onDismiss(() => {
        console.log('modal dismissed')
      })
    }
  }
}
</script>

<style>

</style>
