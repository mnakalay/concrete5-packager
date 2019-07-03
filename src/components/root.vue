<template>
  <q-item clickable v-ripple class="root-wrapper" @click.native="displayPackages(root.path, $event)" >
    <q-item-section inverted class="root-actions">
      <div>
        <q-btn dense round icon="clear" color="negative" size="sm" @click.native="removeRoot(root)" style="margin-right: 5px;" class="btn-remove-root">
          <q-tooltip>
            Remove “{{ root.label }}” from list
          </q-tooltip>
        </q-btn>
        <q-btn dense round icon="folder_open" color="positive" size="sm" @click.native="openRootDir(root.path)" class="btn-open-dir">
          <q-tooltip>
            Open installation folder
          </q-tooltip>
        </q-btn>
        <q-btn dense round icon="view_list" color="info" size="sm" style="margin-right: 5px; margin-left: 5px;">
          <q-tooltip>
            Display packages
          </q-tooltip>
        </q-btn>
      </div>
    </q-item-section>
    <q-item-section class="root-detail">
      <q-item-label overline>
        {{ root.label }}
      </q-item-label>
      <q-item-label caption lines="1">
        {{ root.path }}
      </q-item-label>
      <q-icon name="chevron_right" size="1.8rem" class="check" />
      <q-tooltip>
        Click to display packages
      </q-tooltip>
    </q-item-section>
  </q-item>
</template>

<script>
// const remote = require('electron').remote
// the following 2 lines are equivalent
// const { shell } = require('electron') // deconstructing assignment
import { shell } from 'electron'

export default {
  name: 'root',
  props: ['root'],
  data () {
    return {}
  },
  methods: {
    displayPackages (path, event) {
      let classes = ['btn-remove-root', 'btn-open-dir']
      let display = true

      for (let classname of classes) {
        if (
          event.target.classList.contains(classname) ||
          event.target.parentNode.classList.contains(classname) ||
          event.target.parentNode.parentNode.classList.contains(classname)
        ) {
          display = false
        }
      }
      if (display) {
        this.$root.$emit('display-pkg', path)
      }
    },
    removeRoot (root) {
      this.$emit('remove-root', root)
    },
    openRootDir (path) {
      shell.openItem(path)
    }
  }
}
</script>
<style>
.q-item-sublabel {
    font-size: 75%;
}
.root-list-wrapper {
    overflow: hidden;
    position: relative;
}

.root-wrapper .root-actions {
    padding-right: 5px;
    margin-left: -100%; /* -110px; */
    transition: all 0.3s;
    transform: rotate(75deg);
}

.root-wrapper:hover .root-actions {
    margin-left: 0;
    transform: rotate(0);
}

.check {
  opacity: 0;
  visibility: hidden;
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  transition: opacity 0.3s;
}
.root-active .check {
  opacity: 1;
  visibility: visible;
}
</style>
