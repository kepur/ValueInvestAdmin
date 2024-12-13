<template>
  <div class="home">
    <img alt="Vue logo" src="../assets/logo.png">
  </div>
  {{ myname  }}
</template>

<script>
// @ is an alias to /src

export default {
  name: 'HomeView',
  computed:{
    myname(){
      return this.$store.state.name;
    }
  }
}
</script>
