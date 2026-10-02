# 后端说明（若依 RuoYi-Vue）

本目录用于承载后端程序与若依管理端页面。原型工具的后端基于 **RuoYi-Vue 前后端分离版**，新增业务模块 `ruoyi-prototype`。

> 当前开发环境未安装 JDK / Maven，因此本目录以**源码 + 集成说明**形式交付；安装工具链后按下列步骤编译运行即可。

```
backend/
├─ ruoyi-prototype/          新增业务模块（Maven 子模块）
│  ├─ pom.xml
│  └─ src/main/
│     ├─ java/com/ruoyi/pm/  controller / domain / mapper / service
│     └─ resources/mapper/pm/PmProjectMapper.xml
├─ ruoyi-ui-src/             需复制进若依管理端的文件
│  ├─ api/pm/project.js
│  └─ views/pm/project/index.vue
└─ sql/pm_init.sql           业务表 + 菜单 + 角色 + 默认账号
```

## 环境要求

- JDK 1.8+
- Maven 3.6+
- MySQL 5.7+ / 8.0
- Redis 5+（若依默认依赖）

## 集成步骤

1. 获取若依源码（3.8.x）：
   ```
   git clone https://gitee.com/y_project/RuoYi-Vue.git
   ```
2. 将本目录的 `ruoyi-prototype/` 复制到 RuoYi-Vue 根目录。
3. 编辑根 `pom.xml`，在 `<modules>` 中加入：
   ```xml
   <module>ruoyi-prototype</module>
   ```
4. 编辑 `ruoyi-admin/pom.xml`，加入依赖：
   ```xml
   <dependency>
       <groupId>com.ruoyi</groupId>
       <artifactId>ruoyi-prototype</artifactId>
   </dependency>
   ```
5. 执行 `sql/pm_init.sql`（在若依业务库 `ry-vue` 中）。
6. 复制管理端页面：
   - `ruoyi-ui-src/api/pm/project.js` → `ruoyi-ui/src/api/pm/project.js`
   - `ruoyi-ui-src/views/pm/project/index.vue` → `ruoyi-ui/src/views/pm/project/index.vue`
7. 配置 `ruoyi-admin/src/main/resources/application-druid.yml` 数据源与 Redis。
8. 关闭图形验证码（前后端均不需要）：
   ```sql
   update sys_config set config_value = 'false' where config_key = 'sys.account.captchaEnabled';
   ```
9. 启动：后端 `ruoyi-admin` 主类，管理端 `ruoyi-ui` 执行 `npm run dev`。

## 账号说明

| 端 | 用户名 | 密码 | 角色 |
|---|---|---|---|
| 若依管理端 | `admin` | 部署时设置（勿提交明文） | 超级管理员 |
| 编辑器前端 | `wangzhe` | 本地模式开发默认值 | `pm_user` |

- 用户由管理员在「系统管理 → 用户管理」中创建 / 发放 / 改密；真实口令不在仓库中记录。
- `pm_user` 仅被授予 `pm:project:*` 业务权限，不授予后台菜单，因此登录管理端看不到菜单。

## 接口清单（前缀 `/pm/project`）

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | `/list` | `pm:project:list` | 分页列表 |
| GET | `/{id}` | `pm:project:query` | 详情 |
| POST | `/` | `pm:project:add` | 新建 |
| PUT | `/` | `pm:project:edit` | 保存（整包 content） |
| DELETE | `/{ids}` | `pm:project:remove` | 删除（逻辑删除） |

鉴权：请求头 `Authorization: Bearer <token>`，令牌由 `/login` 获取。

## 与编辑器前端联调

编辑器默认运行在本地模式（`localStorage` 持久化）。接入本后端时：

1. 在根目录 `.env` 中设置：
   ```
   VITE_USE_LOCAL=false
   VITE_API_BASE=/dev-api
   ```
2. `vite.config.ts` 已将 `/dev-api` 代理到 `http://localhost:8080`。
3. 编辑器登录页调用 `/login` 获取令牌并持久化。
