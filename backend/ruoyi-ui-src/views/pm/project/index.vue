<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch">
      <el-form-item label="项目名称" prop="name">
        <el-input v-model="queryParams.name" placeholder="请输入项目名称" clearable size="small" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="success" icon="el-icon-view" size="mini" :disabled="single" @click="handleView">查看内容</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete">删除</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="projectList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="ID" prop="id" width="80" align="center" />
      <el-table-column label="项目名称" prop="name" :show-overflow-tooltip="true" />
      <el-table-column label="描述" prop="description" :show-overflow-tooltip="true" />
      <el-table-column label="归属用户ID" prop="ownerId" width="110" align="center" />
      <el-table-column label="更新时间" prop="updateTime" width="180" align="center" />
      <el-table-column label="操作" align="center" width="140" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-view" @click="handleView(scope.row)">查看</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize" @pagination="getList" />

    <el-dialog title="画布内容" :visible.sync="viewOpen" width="720px" append-to-body>
      <pre class="pm-json">{{ currentContent }}</pre>
    </el-dialog>
  </div>
</template>

<script>
import { listProject, getProject, delProject } from '@/api/pm/project'

export default {
  name: 'PmProject',
  data() {
    return {
      loading: true,
      ids: [],
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      projectList: [],
      viewOpen: false,
      currentContent: '',
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        name: undefined
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      listProject(this.queryParams).then((response) => {
        this.projectList = response.rows
        this.total = response.total
        this.loading = false
      })
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.resetForm('queryForm')
      this.handleQuery()
    },
    handleSelectionChange(selection) {
      this.ids = selection.map((item) => item.id)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    handleView(row) {
      const id = row && row.id ? row.id : this.ids[0]
      getProject(id).then((response) => {
        this.currentContent = response.data ? response.data.content : ''
        this.viewOpen = true
      })
    },
    handleDelete(row) {
      const ids = row && row.id ? [row.id] : this.ids
      this.$modal
        .confirm('确认删除选中的原型项目？')
        .then(() => delProject(ids.join(',')))
        .then(() => {
          this.getList()
          this.$modal.msgSuccess('删除成功')
        })
        .catch(() => {})
    }
  }
}
</script>

<style scoped>
.pm-json {
  max-height: 520px;
  overflow: auto;
  background: #0f172a;
  color: #e2e8f0;
  padding: 12px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.5;
}
</style>
