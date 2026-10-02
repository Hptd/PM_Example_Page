import request from '@/utils/request'

// 查询原型项目列表
export function listProject(query) {
  return request({
    url: '/pm/project/list',
    method: 'get',
    params: query
  })
}

// 查询原型项目详细
export function getProject(id) {
  return request({
    url: '/pm/project/' + id,
    method: 'get'
  })
}

// 新增原型项目
export function addProject(data) {
  return request({
    url: '/pm/project',
    method: 'post',
    data: data
  })
}

// 修改原型项目
export function updateProject(data) {
  return request({
    url: '/pm/project',
    method: 'put',
    data: data
  })
}

// 删除原型项目
export function delProject(id) {
  return request({
    url: '/pm/project/' + id,
    method: 'delete'
  })
}
