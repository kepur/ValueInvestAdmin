import type { App, Component } from 'vue'
import IconIndex from './icons/IconIndex.vue'

const allClobalComponents: Record<string, Component> = { IconIndex }

export default {
  install(app: App) {
    Object.keys(allClobalComponents).forEach((key) => {
      app.component(key, allClobalComponents[key])
    })
  }
}
