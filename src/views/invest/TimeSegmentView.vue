<template>
  <div class="about">
    <h1>This is an about page</h1>
    <h1>{{name}}</h1>
  </div>
</template>

<script>
// import axios from 'axios'
import { useStore } from 'vuex'
// @ is an alias to /src

export default {
  name: 'HomeView',
  setup() {

    const store = useStore();
    const name = store.state.name
    return { name }
  }
}
</script>