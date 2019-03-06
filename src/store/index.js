import Vue from 'vue'
import Vuex from 'vuex'

import modules from './modules'

Vue.use(Vuex)

export default function () {
  const Store = new Vuex.Store({
    modules
  })

  return Store
}
