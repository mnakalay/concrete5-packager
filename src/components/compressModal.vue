<template>
  <q-modal
    v-model="trigger"
    key="compressModal"
    :maximized="true"
    :no-route-dismiss="false"
    :no-esc-dismiss="false"
    :no-backdrop-dismiss="true"
    :content-classes="modalContentClasses"
  >
  </q-modal>
</template>

<script>

export default {
  name: 'CompressModal',

  props: {
    trigger: {
      type: Boolean,
      required: true
    },
    completedSteps: {
      type: Number,
      required: true
    },
    totalSteps: {
      type: Number,
      required: true
    },
    progress: {
      type: String,
      required: true
    }
  },
  components: {},
  data () {
    return {
      modalContentClasses: 'compress-modal'
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
.progress-modal .progress-bar {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
