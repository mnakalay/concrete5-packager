import { mapState, mapActions } from 'vuex'

export const c5packagerGetters = {
  ...mapState({
    c5packager: state => state.c5packager.c5packager
  })
}

export const c5packagerActions = mapActions([
  'selectRoot',
  'selectWorkFolder'
])
