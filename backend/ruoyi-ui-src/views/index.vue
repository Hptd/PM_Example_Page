<template>
  <div class="app-container home">
    <el-row :gutter="20">
      <el-col :sm="24" :lg="24">
        <div class="banner">
          <h1 class="banner-title">PM Canvas · 无限画布原型工具</h1>
          <p class="banner-desc">
            草稿级原型设计工具：在无限画布上摆放多块「页面设计区域」，用 Axure 风格的组件快速搭建布局，
            为组件添加评论说明，并导出<strong>带注释的独立 HTML</strong>，作为喂给 AI 设计工具的结构化输入。
          </p>
          <p>
            <el-tag type="success">Vue 3 + TypeScript</el-tag>
            <el-tag type="primary">无限画布</el-tag>
            <el-tag type="warning">30+ 组件</el-tag>
            <el-tag type="danger">注释导出</el-tag>
          </p>
        </div>
        <hr />
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="14" :lg="14">
        <el-card class="box-card">
          <div slot="header" class="clearfix">
            <span class="card-title"><i class="el-icon-magic-stick"></i> 前端功能说明</span>
          </div>
          <ul class="feature-list">
            <li>
              <b>无限画布：</b>平移 / 缩放、多页面 frame，坐标精确可控，适合搭建完整页面流程。
            </li>
            <li>
              <b>Axure 风格组件库：</b>基础绘图、表单控件、数据展示、导航容器四大类共 30+ 组件，拖拽即用。
            </li>
            <li>
              <b>拖拽与吸附：</b>从组件面板拖入画布，支持容器嵌套、边缘吸附与对齐参考线。
            </li>
            <li>
              <b>属性面板：</b>几何、外观、组件专属属性按 schema 动态生成，所见即所得。
            </li>
            <li>
              <b>组件级评论：</b>按页面层级最细颗粒度选中组件，评论按稳定 <code>id</code> 锚定，导出后不丢失。
            </li>
            <li>
              <b>导出三件套：</b>
              <el-tag size="mini">clean.html</el-tag> 纯布局 /
              <el-tag size="mini" type="success">annotated.html</el-tag> 带注释气泡 /
              <el-tag size="mini" type="warning">spec.md</el-tag> 文字说明。
            </li>
            <li>
              <b>账号体系：</b>登录后进入，统一账号库由若依后端管理（本地模式内置默认账号）。
            </li>
          </ul>
        </el-card>

        <el-card class="box-card">
          <div slot="header" class="clearfix">
            <span class="card-title"><i class="el-icon-s-order"></i> 使用流程</span>
          </div>
          <el-steps direction="vertical" :active="6" finish-status="success" class="flow-steps">
            <el-step title="登录" description="使用分配账号登录编辑器前端" />
            <el-step title="新建项目" description="创建项目并进入编辑器" />
            <el-step title="搭建页面" description="新建页面 frame，从左侧组件面板拖拽组件到画布" />
            <el-step title="调整与标注" description="右侧「属性」调几何与外观；「图层」看层级；「评论」写说明" />
            <el-step title="导出" description="导出注释 HTML / 干净 HTML / 说明 MD，作为 AI 设计输入" />
          </el-steps>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="10" :lg="10">
        <el-card class="box-card">
          <div slot="header" class="clearfix">
            <span class="card-title"><i class="el-icon-menu"></i> 常用快捷键</span>
          </div>
          <el-table :data="shortcuts" size="mini" :show-header="false">
            <el-table-column prop="action" label="操作" />
            <el-table-column prop="key" label="快捷键" width="140" align="right">
              <template slot-scope="scope">
                <el-tag size="mini">{{ scope.row.key }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card class="box-card">
          <div slot="header" class="clearfix">
            <span class="card-title"><i class="el-icon-cpu"></i> 技术栈</span>
          </div>
          <p class="tech-line">
            <el-tag size="small" v-for="t in techStack" :key="t" class="tech-tag">{{ t }}</el-tag>
          </p>
          <hr />
          <p>
            <b>编辑器账号：</b>由管理员在「系统管理 → 用户管理」中创建 / 发放 / 改密；
            <b>原型用户</b>角色仅被授予 <code>pm:project:*</code> 业务权限。
          </p>
          <p>
            <b>当前版本：</b><span>v{{ version }}</span>
          </p>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
export default {
  name: "Index",
  data() {
    return {
      // 版本号
      version: "3.8.8",
      shortcuts: [
        { action: "保存", key: "Ctrl + S" },
        { action: "撤销 / 重做", key: "Ctrl + Z / Y" },
        { action: "复制 / 粘贴 / 原地复制", key: "Ctrl + C / V / D" },
        { action: "删除选中", key: "Delete" },
        { action: "取消选中", key: "Esc" },
        { action: "缩放画布", key: "Ctrl + 滚轮" }
      ],
      techStack: [
        "Vue 3",
        "TypeScript",
        "Vite",
        "Pinia",
        "Vue Router",
        "Iconify",
        "Vue SSR",
        "Vitest"
      ]
    };
  },
  methods: {
    goTarget(href) {
      window.open(href, "_blank");
    }
  }
};
</script>

<style scoped lang="scss">
.home {
  blockquote {
    padding: 10px 20px;
    margin: 0 0 20px;
    font-size: 17.5px;
    border-left: 5px solid #eee;
  }
  hr {
    margin-top: 20px;
    margin-bottom: 20px;
    border: 0;
    border-top: 1px solid #eee;
  }
  .col-item {
    margin-bottom: 20px;
  }

  ul {
    padding: 0;
    margin: 0;
  }

  font-family: "open sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 13px;
  color: #676a6c;
  overflow-x: hidden;

  ul {
    list-style-type: none;
  }

  h4 {
    margin-top: 0px;
  }

  h2 {
    margin-top: 10px;
    font-size: 26px;
    font-weight: 100;
  }

  p {
    margin-top: 10px;

    b {
      font-weight: 700;
    }
  }

  .banner {
    padding: 24px 28px;
    border-radius: 8px;
    background: linear-gradient(135deg, #1890ff 0%, #36cfc9 100%);
    color: #fff;
  }

  .banner-title {
    margin: 0 0 8px;
    font-size: 28px;
    font-weight: 500;
  }

  .banner-desc {
    margin: 0 0 12px;
    font-size: 14px;
    line-height: 1.7;
    max-width: 900px;
  }

  .box-card {
    margin-bottom: 20px;
  }

  .card-title {
    font-size: 15px;
    font-weight: 600;
  }

  .feature-list {
    line-height: 1.9;

    li {
      padding: 4px 0;
    }
  }

  .flow-steps {
    height: 340px;
    padding-top: 4px;
  }

  .tech-line {
    line-height: 2.2;
  }

  .tech-tag {
    margin: 0 6px 6px 0;
  }

  .update-log {
    ol {
      display: block;
      list-style-type: decimal;
      margin-block-start: 1em;
      margin-block-end: 1em;
      margin-inline-start: 0;
      margin-inline-end: 0;
      padding-inline-start: 40px;
    }
  }
}
</style>
