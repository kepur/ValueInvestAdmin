<template>
  <div class="home">
    <img @click="handleClick" alt="Vue logo"  src="../assets/logo.png">
    <h1 >{{ name }}</h1>
  </div>
</template>

<script>
import { useStore } from 'vuex'
import { toRefs } from 'vue'
// @ is an alias to /src
// import axios from 'axios'

export default { 
  name: 'HomeView',
  setup(){

    // axios.get('https://www.fastmock.site/mock/ae8e9031947a302fed5f92425995aa19/jd/api/user/register').then((response) => {
    //   const msg = response.data.desc;
    //   console.log(msg)
    // })

    const store = useStore();
    //封装标准数据toRefs 不然不能动态加载
    const { name } = toRefs(store.state)
    const handleClick=()=>{
      //同步
      // store.commit("changeName","hozin")
      //异步 调用action
      store.dispatch('getData')
    }
    return {name,handleClick}
  }
}
</script>
