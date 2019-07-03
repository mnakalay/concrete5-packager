<template>
  <q-dialog
    v-model="trigger"
    key="progressModal"
    persistent
    :maximized="true"
    :no-route-dismiss="true"
    :no-esc-dismiss="true"
    :no-backdrop-dismiss="true"
    :content-class="modalContentClasses"
  >
    <h4 v-if="progressData.heading">{{ progressData.heading }}</h4>
      <radial-progress-bar
      :diameter="300"
      :strokeWidth="20"
      :startColor="startColor"
      :stopColor="stopColor"
      :animateSpeed="350"
      :completed-steps="progressData.processed"
      :total-steps="progressData.total"
      :class="progressClasses"
      >
        <h3>{{ progress }}%</h3>
      </radial-progress-bar>
  </q-dialog>
</template>

<script>
import RadialProgressBar from 'vue-radial-progress'
// const glob = require('glob')

export default {
  name: 'ProgressModal',

  props: {
    trigger: {
      type: Boolean,
      required: true
    },
    progressData: {
      type: Object,
      required: true
    },
    // completedSteps: {
    //   type: Number,
    //   required: true
    // },
    // totalSteps: {
    //   type: Number,
    //   required: true
    // },
    progress: {
      type: String,
      required: true
    }
  },
  components: {
    RadialProgressBar
  },
  data () {
    return {
      modalContentClasses: 'progress-modal flex column',
      progressClasses: 'progress-bar',
      startColor: '#ffeb3b',
      stopColor: '#8bc34a'
    }
  }
}
</script>
<style>
.progress-modal {
  background-color: rgba(0, 0, 0, 0.85);
  color: #fff;
  text-align: center;
}
.progress-modal .progress-bar,
.progress-modal h4 {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.progress-modal h4 {
  transform: translate(-50%, -250px);
}
</style>
