# 无限画布原型工具 · 设计文档

> 版本 v0.1 · 仅设计说明，不含实现代码
> 定位：草稿级原型设计工具，产出结构化 HTML + 注释，作为喂给 AI 设计工具的输入材料

---

## 1. 项目概述

本项目是一套**前后端分离**的无限画布原型设计工具，核心目标是「准 + 快」地搭建页面草稿：

- 每个画布 = 一个完整项目文件（`.pm.json`）。
- 画布上可放置任意多个「页面设计区域」（frame），每个 frame 是一块完整的页面设计。
- 支持右键将单个 frame 导出为独立 HTML 页面。
- 支持对 HTML 内每个 UI 组件做评论，评论随导出的 HTML 一并输出。
- 组件选择需按页面层级做到最细颗粒度。

解决的核心问题：产品设计阶段参考对标产品时，无需把页面全部转成提示词或图片，而是像传统原型工具一样手动搭建草稿，直接导出带注释的 HTML 交给 AI。

---

## 2. 核心设计准则

| 准则 | 含义 |
|---|---|
| 准 | 组件层级、坐标、属性精确可存、可选、可导出 |
| 快 | 拖拽即用、吸附对齐、80% Axure 常用组件开箱可用 |
| 草稿优先 | 只做简洁样式的静态草稿，不做高保真视觉 |
| 导出为纲 | 导出三件套服务 AI：clean.html / annotated.html / spec.md |
| 结构可读 | 导出 HTML 的 DOM 结构本身即是给 AI 的布局说明 |

---

## 3. 总体架构

前后端分离，两个独立前端 + 一个 Java 后端：

```
┌─────────────────────────┐        ┌──────────────────────────┐
│  根目录 frontend (Vite)  │        │  backend/ (RuoYi 全家桶)  │
│  无限画布原型编辑器 App    │  HTTP  │  Java Spring Boot 服务    │
│  Vue3 + TS + Pinia       │ <────> │  + RuoYi Admin 前端页面    │
└─────────────────────────┘        └──────────────────────────┘
        │                                      │
        │ 导出在前端 SSR 完成                    │ MySQL 存 Project JSON
        └──────────────────────────────────────┘
```

- **根目录**：Vite + Vue 前端项目，即原型编辑器应用。
- **backend/**：后端程序（Java / Spring Boot / RuoYi）+ 若依自带的前端管理页面。
- **导出逻辑**：在编辑器前端用 Vue SSR 完成，后端只负责存储与鉴权。

---

## 4. 目录结构

```
pm_example_page/
├─ DESIGN.md                 # 本文档
├─ src/                      # 【根目录】Vite + Vue 编辑器应用
│  └─ editor/
│     ├─ core/               # schema / registry / store / history
│     ├─ canvas/             # Canvas / Frame / NodeRenderer
│     ├─ widgets/            # 组件库（按 Axure 对标）
│     ├─ panels/             # 组件面板 / 属性面板 / 图层
│     ├─ interactions/       # 拖拽 / 缩放 / 吸附 / 相机
│     ├─ export/             # SSR 导出 + 注释注入
│     └─ views/              # 登录、项目列表、编辑器页
├─ backend/                  # 【后端 + 若依前端】
│  ├─ ruoyi-prototype/       # 新增业务模块
│  ├─ ruoyi-admin/           # 启动模块
│  ├─ ruoyi-ui/              # 若依管理前端页面
│  └─ ...
└─ ...
```

---

## 5. 技术选型

| 层 | 技术 | 说明 |
|---|---|---|
| 编辑器前端 | Vite + Vue3 + TypeScript + Pinia + Vue Router | 根目录项目 |
| 导出 | `@vue/server-renderer` (SSR) | 编辑态与导出态同源，所见即所得 |
| 画布 | 自研（CSS transform 相机 + 指针事件） | 绝对定位语义，不引重量级库 |
| 图标/Logo | Iconify + simple-icons | 通用图标 + 品牌 logo，可换色 SVG |
| 后端 | Java + Spring Boot + RuoYi（前后端分离版） | backend/ 目录 |
| 数据库 | MySQL | 存项目 JSON 等 |
| 鉴权 | RuoYi Token（JWT） | 编辑器 App 调 RuoYi 登录接口 |
| 验证 | `vue-tsc --noEmit` + Vitest | 不使用 npm run dev/build |

---

## 6. 数据模型

坐标放在 node 顶层（不进 style），使拖拽、吸附、导出都清晰可控：

```ts
interface Project {
  id: string
  name: string
  version: number
  viewport: { x: number; y: number; zoom: number }
  frames: Frame[]
}

interface Frame {
  id: string
  name: string
  x: number; y: number; w: number; h: number
  background: string
  tree: Node[]
}

interface Node {
  id: string
  type: string                 // 注册表 key，如 'pm-rect'
  x: number; y: number; w: number; h: number
  props: Record<string, any>   // 组件专有属性
  style: Record<string, any>   // 填充/描边/圆角/阴影等
  children?: Node[]            // 容器组件才有
  name?: string
  locked?: boolean
  hidden?: boolean
}
```

**文件格式**：一个 `.pm.json` = 一个 `Project`。组件 `id` 必须持久稳定，评论与导出锚点全靠它。

---

## 7. 组件体系（对标 Axure）

每个组件 = 一份 `WidgetDef`，注册进注册表；编辑、属性面板、导出都从这里读取：

```ts
interface WidgetDef {
  type: string
  name: string
  category: string
  icon: string
  defaultSize: { w: number; h: number }
  defaultProps: Record<string, any>
  defaultStyle: Record<string, any>
  droppable?: boolean          // 可否作为容器
  propSchema: PropField[]      // 驱动属性面板
  render: VueComponent         // 编辑与导出共用
}
```

### 组件清单（分阶段）

| 分组 | 组件 | 阶段 |
|---|---|---|
| 基础绘图 | 矩形(填充/描边/圆角/阴影)、椭圆、线条、文本/标签、图片占位、图标、品牌 Logo、容器/分组、按钮 | MVP |
| 表单控件 | 输入框、文本域、下拉、复选、单选、开关、日期、滑块、上传 | MVP |
| 数据展示 | 表格、列表、卡片、标签/徽标、头像、进度条、分割线、面包屑、分页 | P1 |
| 导航容器 | 导航栏、侧边菜单、标签页、折叠面板、弹窗、抽屉、提示、步骤条 | P1 |
| 复杂件(简化) | 中继器→静态列表、动态面板→多状态 frame、热区、内联框架、连接线、便签注释 | P2 |

MVP 三组约 28 个组件，覆盖草稿阶段约 80% 场景。

### 属性面板

按 `propSchema` 动态生成：

- 几何：x / y / w / h / 旋转 / 层级
- 外观：填充 / 描边 / 圆角 / 阴影 / 透明度
- 文本：内容 / 字号 / 颜色 / 对齐
- 组件专有 traits

---

## 8. 核心功能设计

### 8.1 无限画布

- 相机（viewport）实现平移、缩放、坐标换算（世界 ↔ 屏幕）。
- 平移：空格 + 拖拽 / 中键拖拽；缩放：滚轮 / Ctrl + 滚轮。
- frame 为画布上的自由摆放区域。

### 8.2 拖拽与嵌套

- 组件在 frame 内 `position: absolute`，与 Axure 一致。
- 落点判定：命中最近的 `droppable` 容器，显示插入框。
- 吸附对齐：边缘/中线吸附 + 智能参考线（「准 + 快」关键）。
- 8 向缩放手柄，Shift 锁比例。

### 8.3 评论系统

- 选中组件（按页面层级最细颗粒度）→ 取其稳定 id → 评论按 `nodeId` 存储。
- 评论**不按坐标存储**，避免布局变化导致错位。

### 8.4 导出三件套

导出流程：`renderToString(组件树)` → 注入 `data-pm-id` → 追加注释 JSON + 悬浮脚本：

| 产物 | 用途 |
|---|---|
| `clean.html` | 纯布局结构，给 AI 读 |
| `annotated.html` | 注入注释气泡 + 悬浮高亮，给人看 |
| `spec.md` / `spec.json` | 注释与层级转成文字提示词，AI 最友好 |

---

## 9. 账号与权限（阶段一）

阶段一聚焦账号管理与身份校验，采用 **统一账号库 + 角色隔离** 模型。

### 统一账号库

- RuoYi 的 `sys_user` 表是**唯一账号库**，管理端与编辑器前端共用，不是两套账号。
- 管理端登录与编辑器登录**调用同一个登录接口**（`/login`），区别只在角色。
- 管理员在若依「系统管理 → 用户管理」中创建、发放、停用账号、重置密码；即支持后续**手动创建与发放账号**。

### 角色隔离

| 角色 | 可进入 | 能力 |
|---|---|---|
| `admin` | 若依管理端 + 编辑器 | 用户管理、项目管理、发放账号 |
| `pm_user` | 仅编辑器 | 使用画布与原型功能，无管理端菜单 |

若依按角色下发菜单/权限，`pm_user` 登录后看不到管理端菜单。

### 登录流程

```
                 ┌──────────────────────────┐
                 │   RuoYi sys_user 统一账号  │
                 └────────────┬─────────────┘
             admin 角色        │        pm_user 角色
        ┌─────────────────────┴─────────────────────┐
        ▼                                            ▼
  若依管理端登录                                编辑器前端登录
  （用户管理/发放账号）                          （登录后进入画布）
```

1. 使用者在编辑器前端输入账号密码，调 RuoYi 登录接口。
2. 成功后拿 Token，前端本地保存。
3. 后续请求带 `Authorization: Bearer <token>`。
4. 未登录访问编辑器页面时，路由守卫重定向到登录页。

### 验证码策略

- **所有环境（含正式服）均不启用图形验证码**，直接账号密码登录。
- 管理端与编辑器前端登录接口一致，均免验证码。

### 初始账号

| 端 | 用户名 | 密码 | 角色 |
|---|---|---|---|
| 若依管理端 | `admin` | 部署时设置（勿提交明文） | 超级管理员 |
| 编辑器前端 | `wangzhe` | 本地模式开发默认值 | `pm_user` |

- 编辑器默认账号仅用于**本地模式**开发联调，可在若依后端「用户管理」中维护（创建/发放/改密/停用）。
- 管理端 `admin` 初始密码为随机值，由部署流程下发，**首次登录后应立即修改**。

> 安全提示：密码在数据库中应以 BCrypt 哈希存储，禁止明文。仓库与文档不得提交真实口令，上线前必须更换为随机强口令。

---

## 10. 后端设计（RuoYi）

在 RuoYi-Vue（前后端分离版）中新增 Maven 模块 `ruoyi-prototype`，依赖 `ruoyi-common`：

```
backend/ruoyi-prototype/
  controller/  PmProjectController.java
  domain/      PmProject.java  PmProjectVersion.java
  mapper/      PmProjectMapper.java (+ XML)
  service/     IPmProjectService.java / impl
```

### 表设计

| 表 | 关键字段 |
|---|---|
| `pm_project` | id, name, owner_id, description, cover, content(LONGTEXT, 存整个 Project JSON), create_by/time, update_time, del_flag |
| `pm_project_version` | id, project_id, version, content, create_time（历史/回滚，可选） |

`content` 直接存 `.pm.json` 全文，前后端按整体读写。

### 接口约定（前缀 `/pm/project`）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/list` | 分页列表 |
| GET | `/{id}` | 详情 |
| POST | `/` | 新建 |
| PUT | `/` | 保存（整包 content） |
| DELETE | `/{id}` | 删除 |
| POST | `/upload` | 图片资源（复用 RuoYi 文件服务） |

鉴权走 RuoYi Token。

---

## 11. 里程碑

| 阶段 | 内容 | 验证 |
|---|---|---|
| M1 | 编辑器骨架：脚手架 + schema + registry + store + 相机画布 + frame + 3 组件(矩形/文本/图片) + 拖放 + 选中删除 | `vue-tsc --noEmit` + Vitest |
| M2 | 属性面板 + 拖拽嵌套 + 吸附对齐 + resize | 单测 + 手动 |
| M3 | 补齐 MVP 28 组件 + 图标/Logo 选择器 | 单测 |
| M4 | SSR 导出三件套 | 快照对比 |
| M5 | `ruoyi-prototype` 模块 + 建表 + 接口 + 登录鉴权 + 图片上传 | 接口联调 |
| M6 | 评论锚点 + 导出联调 | 端到端 |

**M1 验收**：打开编辑器 → 新建 frame → 拖入矩形/文本/图片 → 绝对定位摆放 → 选中可删 → 撤销可回退。

---

## 12. 范围边界（非目标）

- 不做高保真视觉设计（Figma 类）。
- 不做完整交互逻辑（动态面板、复杂事件）——纯静态草稿。
- 不做多人实时协作。
- 导出不做响应式适配（绝对定位，面向固定画布尺寸）。

---

## 13. 风险与对策

| 风险 | 对策 |
|---|---|
| 多 frame 性能：每 frame 为完整 DOM 子树 | 离屏 frame 降级为静态缩略图，仅渲染激活 frame |
| 绝对定位导出与响应式冲突 | 明确定位为固定尺寸草稿，非目标已声明 |
| 组件量大导致工期膨胀 | 严格按 MVP 28 组件推进，复杂件后置 |
| 评论锚点失效 | 依赖持久稳定 id，禁止按坐标存储 |
| 安全：初始弱口令 | 开发环境限定，上线前强制更换 + BCrypt |
