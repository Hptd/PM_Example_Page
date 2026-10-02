-- ----------------------------------------------------------------------------
-- 原型工具初始化脚本（在若依 ry-vue 库执行）
-- 内容：业务表 + 后台菜单 + pm_user 角色 + 默认账号
-- 注意：密码为 BCrypt 哈希，明文见 DESIGN.md 第 9 节
-- ----------------------------------------------------------------------------

-- ============================ 1. 业务表 ============================
drop table if exists pm_project;
create table pm_project (
    id          bigint(20)   not null auto_increment comment '项目ID',
    owner_id    bigint(20)   default null             comment '归属用户ID',
    name        varchar(128) not null                 comment '项目名称',
    description varchar(512) default ''               comment '项目描述',
    cover       varchar(512) default ''               comment '封面',
    content     longtext                              comment '画布内容(.pm.json 全文)',
    create_by   varchar(64)  default ''               comment '创建者',
    create_time datetime                              comment '创建时间',
    update_by   varchar(64)  default ''               comment '更新者',
    update_time datetime                              comment '更新时间',
    remark      varchar(500) default null             comment '备注',
    del_flag    char(1)      default '0'              comment '删除标志(0存在 2删除)',
    primary key (id),
    key idx_pm_project_owner (owner_id),
    key idx_pm_project_update (update_time)
) engine=innodb auto_increment=1 comment='原型项目表';

drop table if exists pm_project_version;
create table pm_project_version (
    id          bigint(20) not null auto_increment comment '版本ID',
    project_id  bigint(20) not null                comment '项目ID',
    version     int(11)    default 1               comment '版本号',
    content     longtext                           comment '画布内容快照',
    create_by   varchar(64)  default ''            comment '创建者',
    create_time datetime                           comment '创建时间',
    primary key (id),
    key idx_pm_version_project (project_id)
) engine=innodb auto_increment=1 comment='原型项目历史版本表';

-- ============================ 2. 后台菜单 ============================
delete from sys_role_menu where menu_id in (2000, 2001, 2002, 2003, 2004, 2005, 2006);
delete from sys_menu where menu_id in (2000, 2001, 2002, 2003, 2004, 2005, 2006);

insert into sys_menu (menu_id, menu_name, parent_id, order_num, path, component, query, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
values (2000, '原型管理', 0,    6, 'prototype', null,                '', 1, 0, 'M', '0', '0', '',                'tool',          'admin', sysdate(), '原型管理目录'),
       (2001, '原型项目', 2000, 1, 'project',   'pm/project/index',   '', 1, 0, 'C', '0', '0', '',                'documentation', 'admin', sysdate(), '原型项目菜单'),
       (2002, '项目列表', 2001, 1, '', '', '', 1, 0, 'F', '0', '0', 'pm:project:list',   '#', 'admin', sysdate(), ''),
       (2003, '项目查询', 2001, 2, '', '', '', 1, 0, 'F', '0', '0', 'pm:project:query',  '#', 'admin', sysdate(), ''),
       (2004, '项目新增', 2001, 3, '', '', '', 1, 0, 'F', '0', '0', 'pm:project:add',    '#', 'admin', sysdate(), ''),
       (2005, '项目修改', 2001, 4, '', '', '', 1, 0, 'F', '0', '0', 'pm:project:edit',   '#', 'admin', sysdate(), ''),
       (2006, '项目删除', 2001, 5, '', '', '', 1, 0, 'F', '0', '0', 'pm:project:remove', '#', 'admin', sysdate(), '');

-- ============================ 3. pm_user 角色 ============================
-- 仅授予业务权限（按钮），不授予后台菜单，避免 pm_user 看到管理端菜单
delete from sys_role_menu where role_id = 100;
delete from sys_role where role_id = 100;

insert into sys_role (role_id, role_name, role_key, role_sort, data_scope, status, del_flag, create_by, create_time, remark)
values (100, '原型用户', 'pm_user', 5, '1', '0', '0', 'admin', sysdate(), '原型编辑器用户');

insert into sys_role_menu (role_id, menu_id)
values (100, 2002), (100, 2003), (100, 2004), (100, 2005), (100, 2006);

-- ============================ 4. 默认账号 ============================
-- 编辑器前端默认账号 wangzhe / 123456
delete from sys_user_role where user_id = 100;
delete from sys_user where user_id = 100;

insert into sys_user (user_id, dept_id, user_name, nick_name, user_type, email, phonenumber, sex, avatar, password, status, del_flag, login_ip, login_date, create_by, create_time, remark)
values (100, 100, 'wangzhe', '默认用户', '00', '', '', '0', '',
        '$2b$10$65eILKAA3RKWP2wyOLXS4O4X8pamvxBoRA25CpUBSEd5lzWYhOj42',
        '0', '0', '', null, 'admin', sysdate(), '原型编辑器默认账号');

insert into sys_user_role (user_id, role_id) values (100, 100);

-- 管理端 admin 初始密码重置为 16 位随机值（见 DESIGN.md 第 9 节）
update sys_user set password = '$2b$10$wfRD/oQkhj2SPRhCUvPWyuPBOv1Uk.J3a6BFZ/hRjIyR2VQ3pzABO'
where user_name = 'admin';
