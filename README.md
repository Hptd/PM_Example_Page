# PM Canvas · 无限画布原型工具

草稿级原型设计工具：在无限画布上摆放多块「页面设计区域」，用 Axure 风格的组件快速搭建布局，为组件添加评论说明，并导出**带注释的独立 HTML**，作为喂给 AI 设计工具的结构化输入。

设计文档见 [DESIGN.md](./DESIGN.md)。

## 特性

- **无限画布**：平移 / 缩放、多页面 frame、坐标精确可控。
- **Axure 风格组件库**：基础绘图、表单控件、数据展示、导航容器四大类共 30+ 组件，拖拽即用。
- **拖拽与吸附**：从组件面板拖入画布，支持容器嵌套、边缘吸附与参考线。
- **属性面板**：几何、外观、组件专属属性按 schema 动态生成。
- **组件级评论**：按页面层级最细颗粒度选中组件，评论按稳定 `id` 锚定。
- **导出三件套**：`clean.html`（纯布局）/ `annotated.html`（带注释气泡）/ `spec.md`（文字说明）。
- **账号体系**：登录后进入，统一账号库由若依后端管理（本地模式内置默认账号）。

## 目录结构

```
pm_example_page/
├─ src/                     编辑器前端（Vite + Vue3 + TS + Pinia）
│  ├─ api/                  接口层（本地模式 / 若依后端可切换）
│  ├─ editor/
│  │  ├─ core/              schema / registry / store / geometry / hitTest
│  │  ├─ canvas/            无限画布与 frame 交互
│  │  ├─ widgets/           组件定义（对标 Axure）
│  │  ├─ panels/            组件面板 / 属性 / 图层 / 评论
│  │  ├─ components/        公共组件（图标选择器等）
│  │  └─ export/            SSR 导出与注释注入
│  ├─ router/               路由与登录守卫
│  └─ views/                登录 / 项目列表 / 编辑器
├─ backend/                 若依后端模块与管理端页面（见 backend/README.md）
├─ DESIGN.md                设计文档
└─ vitest.config.ts         单元测试配置
```

## 快速开始

```bash
npm install
npm run dev
```

浏览器打开后使用默认账号登录：

| 账号 | 密码 |
|---|---|
| `wangzhe` | `123456` |

> 默认启用**本地模式**（`VITE_USE_LOCAL=true`），项目数据保存在浏览器 `localStorage`，无需后端。
> 接入若依后端时将其改为 `false`，详见 [backend/README.md](./backend/README.md)。

## 使用流程

1. 登录 → 新建项目 → 进入编辑器。
2. 「新建页面」创建 frame，从左侧组件面板拖拽组件到画布。
3. 右侧「属性」调整几何与外观；「图层」查看层级；「评论」为选中组件添加说明。
4. 顶部或右键 frame：导出**注释 HTML** / **干净 HTML** / **说明 MD**。
5. `Ctrl+S` 保存（本地模式写入 localStorage，后端模式调用接口）。

## 常用快捷键

| 操作 | 快捷键 |
|---|---|
| 保存 | `Ctrl + S` |
| 撤销 / 重做 | `Ctrl + Z` / `Ctrl + Y` |
| 复制 / 粘贴 / 原地复制 | `Ctrl + C` / `Ctrl + V` / `Ctrl + D` |
| 删除选中 | `Delete` |
| 取消选中 | `Esc` |
| 缩放画布 | `Ctrl + 滚轮` |

## 开发与验证

遵循工程化约束，验证命令不使用 `npm run dev` / `npm run build`：

```bash
npx vue-tsc --noEmit   # 类型检查
npx vitest run         # 单元测试
```

覆盖范围：schema 序列化、几何换算与吸附、命中测试、组件注册表、编辑器状态与撤销重做、导出与规格生成。

## 技术栈

Vue 3 · TypeScript · Vite · Pinia · Vue Router · Iconify 图标数据（Tabler / Simple Icons）· Vue SSR 导出 · Vitest
