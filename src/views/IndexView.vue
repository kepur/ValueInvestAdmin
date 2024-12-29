
<script lang="ts" setup>
import { useAuthStore } from '@/stores/auth'
import {
  Avatar,
  Setting,
  Film,
  Opportunity,
  UserFilled,
  Switch,
  Aim,
  Coin
} from '@element-plus/icons-vue'
import { computed } from 'vue'
import { ElMessage } from 'element-plus'

const authStore = useAuthStore()
const { userRoles } = authStore

const isAdmin = computed(() => userRoles.includes('admin'))

const handleLogout = async () => {
  try {
    await authStore.logout()
    ElMessage.success('Logout successful')
  } catch (error) {
    ElMessage.error('Logout failed')
  }
}
</script>
<template>
  <div class="index">
    <div class="left">
      <h2>投资管理</h2>
      <el-menu
        active-text-color="#ffd04b"
        background-color="#545c64"
        class="el-menu-vertical-demo"
        default-active="2"
        text-color="#fff"
        :router="true"
      >
        <!-- Only Admin -->
        <!-- <el-sub-menu v-if="isAdmin" index="6"> -->
        <el-sub-menu index="1">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统管理</span>
          </template>
          <el-menu-item index="/index/home">实时价格</el-menu-item>
          <el-menu-item index="/index/usermgm">用户管理</el-menu-item>
          <el-menu-item index="/index/role">权限组管理</el-menu-item>
          <el-menu-item index="/index/permission">权限管理</el-menu-item>
          <el-menu-item index="/index/auditlog">系统日志</el-menu-item>
          <el-menu-item index="/index/process">系统后台任务</el-menu-item>
        </el-sub-menu>

        <!-- Novels -->
        <el-sub-menu index="2">
          <template #title>
            <el-icon><Coin /></el-icon>
            <span>代币管理</span>
          </template>
          <el-menu-item index="/index/coin">代币列表</el-menu-item>
          <el-menu-item index="/index/cointype">代币类型</el-menu-item>
          <el-menu-item index="/index/ecosystem">代币链管理</el-menu-item>
          <el-menu-item index="/index/founder">创始团队信息</el-menu-item>
          <el-menu-item index="/index/investmentinsitution">投资机构信息</el-menu-item>
        </el-sub-menu>

        <!-- Translang -->
        <el-sub-menu index="3">
          <template #title>
            <el-icon><Film /></el-icon>
            <span>大纪元</span>
          </template>
          <el-menu-item index="/index/eventcalendar">大事件</el-menu-item>
          <el-menu-item index="/index/analysis">风险评估</el-menu-item>
          <el-menu-item index="/index/socialmetric">情绪热度</el-menu-item>
          <el-menu-item index="/index/recommendation">代币信息管理</el-menu-item>
        </el-sub-menu>

        <!-- Resource -->
        <el-sub-menu index="4">
          <template #title>
            <el-icon><Aim /></el-icon>
            <span>投资管理</span>
          </template>
          <el-menu-item index="/index/investcycle">投资周期管理</el-menu-item>
          <el-menu-item index="/index/investmentstatge">投资阶段管理</el-menu-item>
          <el-menu-item index="/index/timesegment">时序分段管理</el-menu-item>
          <el-menu-item index="/index/strategy">策略管理</el-menu-item>
          <el-menu-item index="/index/investmentallocation">投资比例管理</el-menu-item>
          <el-menu-item index="/index/portfolioanalysis">投资组合管理</el-menu-item>
        </el-sub-menu>

        <!-- AI  -->
        <el-sub-menu index="5">
          <template #title>
            <el-icon><Opportunity /></el-icon>
            <span>交易管理</span>
          </template>
          <el-menu-item index="/index/dailyprofit">日收益分析</el-menu-item>
          <el-menu-item index="/index/simulationtrade">模拟交易</el-menu-item>
          <el-menu-item index="/index/realtrade">实盘交易</el-menu-item>
          <el-menu-item index="/index/transactionhistory">交易记录</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </div>
    <div class="right">
      <div class="top">
        <el-menu
          :ellipsis="false"
          class="el-menu-demo"
          mode="horizontal"
          background-color="#545c64"
          text-color="#fff"
          active-text-color="#ffd04b"
          :router="true"
        >
          <el-menu-item index="/index/auditlog">
            <el-icon><Switch /></el-icon>
            登录历史
          </el-menu-item>
          <el-sub-menu index="2">
            <template #title>
              <el-icon><UserFilled /></el-icon>
              Admin
            </template>
            <el-menu-item index="/index/userprofile">通知设置</el-menu-item>
            <el-menu-item index="/index/changepassword">更改密码</el-menu-item>
            <el-menu-item @click="handleLogout">退出登录</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </div>
      <div class="content">
        <RouterView></RouterView>
      </div>
    </div>
  </div>
</template>


<style scoped lang="scss">
.index {
  width: 100vw;
  height: 100vh;
  display: flex;
  .left {
    .el-menu {
      border-right: none;
    }
    ::v-deep .el-sub-menu__title__span {
      text-align: left;
    }
    width: 200px;
    background-color: #7b8a9c;
    color: white;
    h2 {
      font-size: 18px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      text-align: center;
      height: 60px;
      line-height: 60px;
    }
  }
  .right {
    flex: 1;
    display: flex;
    flex-direction: column;
    .top {
      height: 60px;
      background-color: #666b70;
      display: flex;
      justify-content: flex-end;
      border-bottom-width: none;
    }
    .content {
      flex: 1;
      padding: 5px;
    }
  }
}
</style>
