<template>
  <div v-if="packages && packages.length">
    <progress-modal
      :trigger="showProgress"
      :progress-data="progressData"
      :progress="progress"
    />
    <div class="packages-container">
      <div class="search row">
        <q-search
          v-model="searchText"
          clearable
          @clear="resetSearch"
          icon="search"
          float-label="Search packages by name or handle"
          color="white"
          inverted-light
          class="search-input col-12"
        />
      </div>
      <div class="packages-wrapper overflow-hidden">
        <div class="row justify-center gutter-sm">
          <div v-for="pkg in packages" :key="pkg.nodeKey" class="pkg-item col-xs-12 col-sm-6 col-lg-6 col-xl-4">
            <gridItem
              @zip-progress-change="setProgress"
              :pkg="pkg"
              class="non-selectable"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import gridItem from '../components/gridItem'
import progressModal from '../components/progressModal'
import holmes from 'holmes.js'

export default {
  name: 'PackageList',
  props: {
    packages: {
      type: Array,
      required: true
    }
  },

  components: {
    gridItem,
    progressModal
  },

  data () {
    return {
      imageWidth: 25,
      // selectedPackage: null,
      progressData: {
        processed: 0,
        total: 1,
        heading: '',
        done: false,
        start: false,
        goahead: () => { }
      },
      progress: '0', // progress is set to be a string because of toFixed()
      showProgress: false,
      holmes: false,
      searchText: ''
    }
  },

  watch: {
  },
  methods: {
    setProgress: function (data) {
      this.progressData = data
      const progress = data.processed / data.total
      this.progress = (progress * 100).toFixed(0)
      if (data.close) {
        this.showProgress = false
      } else if (data.done) {
        setTimeout(this.setProgress, 450, {heading: 'All done!', processed: 1, total: 1})
        setTimeout(this.setProgress, 1500, {close: true, processed: 0, total: 1})
      } else {
        this.showProgress = true
      }
      if (data.start) {
        data.goahead(true)
      }
      return true
    },
    resetSearch: function () {
      this.holmes.clear()
    },
    resetSearchInput: function () {
      this.searchText = ''
    },
    initSearch: function () {
      if (this.holmes) {
        this.holmes.stop()
      }
      this.holmes = holmes({
        input: '.search input',
        find: '.packages-wrapper .pkg-item'
      })
      this.holmes.start()
    },
    getIcon: function (pkg) {
      return 'menu'
    }
  },
  created () {
    this.$root.$on('package-list-ready', this.initSearch)
    this.$root.$on('display-pkg', this.resetSearchInput)
  },
  beforeDestroy: function () {
    this.$root.$off('package-list-ready', this.initSearch)
    this.$root.$off('display-pkg', this.resetSearchInput)
    if (this.holmes) {
      this.holmes.stop()
    }
  }
}
</script>

<style>
.packages-wrapper {
  position: relative;
  width: 100%;
  /* height: calc(100vh - 50px); */
  padding: 15px;
}

.packages-container {
  position: relative;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
}

.packages-container .search {
  padding: 25px 15px 15px 15px;
}
.packages-container .hidden {
  display: none;
}
</style>
