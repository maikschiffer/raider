import Vue from 'vue'
import Vuetify from 'vuetify/lib'
import swal from 'sweetalert2'
import { longClickDirective } from 'vue-long-click'
import App from './App.vue'
import store from './store'
import icons from '@/assets/icons'
import 'vuetify/src/stylus/app.styl'

Vue.config.productionTip = false

const swalDefault = swal.mixin({
  heightAuto: false,
  confirmButtonColor: '#1976D2',
  cancelButtonColor: '#FF5252'
})

Vue.prototype.$swal = swalDefault

Vue.directive('longclick', longClickDirective({
  delay: 250,
  interval: 0
}))

Vue.use(Vuetify, {
  theme: {
    accent: '#F96854'
  },
  icons
})

new Vue({
  store,
  render: (h) => h(App)
}).$mount('#app')
