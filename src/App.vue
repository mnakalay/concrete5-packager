<template>
  <div id="q-app">
    <router-view />
  </div>
</template>

<script>
import { c5packagerActions } from './store/helpers'
import { ipcRenderer as ipc } from 'electron'

export default {
  name: 'App',
  mounted () {
    ipc.on('select-root', this.selectRoot)
    ipc.on('select-work-folder', this.selectWorkFolder)
  },
  methods: {
    ...c5packagerActions
  }
}
</script>

<style>
</style>
