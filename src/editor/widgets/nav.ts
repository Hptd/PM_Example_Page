import { h } from 'vue'
import type { WidgetDef } from '../core/registry'
import { box, num, splitList, str } from './helpers'
import { renderIcon } from './icons'

const ALERT_STYLE: Record<string, { background: string; color: string; icon: string }> = {
  info: { background: '#eff6ff', color: '#2563eb', icon: 'tabler:info-circle' },
  success: { background: '#ecfdf5', color: '#059669', icon: 'tabler:circle-check' },
  warning: { background: '#fffbeb', color: '#d97706', icon: 'tabler:alert-triangle' },
  error: { background: '#fef2f2', color: '#dc2626', icon: 'tabler:alert-circle' }
}

export const navWidgets: WidgetDef[] = [
  {
    type: 'pm-navbar',
    name: '导航栏',
    category: 'nav',
    icon: 'tabler:layout-navbar',
    order: 60,
    defaultSize: { w: 375, h: 48 },
    defaultProps: { title: '页面标题', items: '首页,发现,我的' },
    defaultStyle: { background: '#ffffff', color: '#0f172a', borderBottom: '1px solid #e2e8f0', fontSize: '15px' },
    propSchema: [
      { key: 'title', label: '标题', type: 'text' },
      { key: 'items', label: '菜单(逗号分隔)', type: 'text' }
    ],
    render: (node) => {
      const items = splitList(node.props.items)
      return box(
        node,
        [
          h('span', { style: { fontWeight: 600 } }, str(node.props.title)),
          h(
            'div',
            { style: { display: 'flex', gap: '16px', fontSize: '13px', color: '#64748b' } },
            items.map((item) => h('span', {}, item))
          )
        ],
        { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px' }
      )
    }
  },
  {
    type: 'pm-menu',
    name: '侧边菜单',
    category: 'nav',
    icon: 'tabler:menu-2',
    order: 61,
    defaultSize: { w: 160, h: 200 },
    defaultProps: { items: '仪表盘\n项目\n设置', active: '仪表盘' },
    defaultStyle: { background: '#ffffff', color: '#334155', border: '1px solid #e2e8f0', fontSize: '14px' },
    propSchema: [
      { key: 'items', label: '菜单(每行一项)', type: 'textarea' },
      { key: 'active', label: '选中项', type: 'text' }
    ],
    render: (node) => {
      const items = splitList(node.props.items)
      const active = str(node.props.active)
      return box(
        node,
        items.map((item) =>
          h(
            'div',
            {
              style: {
                padding: '8px 12px',
                background: item === active ? '#eff6ff' : 'transparent',
                color: item === active ? '#2563eb' : 'inherit',
                borderRadius: '4px'
              }
            },
            item
          )
        ),
        { display: 'flex', flexDirection: 'column', gap: '2px', padding: '6px' }
      )
    }
  },
  {
    type: 'pm-tabs',
    name: '标签页',
    category: 'nav',
    icon: 'tabler:layout-columns',
    order: 62,
    defaultSize: { w: 280, h: 38 },
    defaultProps: { tabs: '标签一,标签二,标签三', active: '标签一' },
    defaultStyle: { background: 'transparent' },
    propSchema: [
      { key: 'tabs', label: '标签(逗号分隔)', type: 'text' },
      { key: 'active', label: '选中标签', type: 'text' }
    ],
    render: (node) => {
      const tabs = splitList(node.props.tabs)
      const active = str(node.props.active)
      return box(
        node,
        tabs.map((tab) =>
          h(
            'div',
            {
              style: {
                padding: '8px 12px',
                fontSize: '14px',
                borderBottom: tab === active ? '2px solid #2563eb' : '2px solid transparent',
                color: tab === active ? '#2563eb' : '#64748b'
              }
            },
            tab
          )
        ),
        { display: 'flex', borderBottom: '1px solid #e2e8f0' }
      )
    }
  },
  {
    type: 'pm-collapse',
    name: '折叠面板',
    category: 'nav',
    icon: 'tabler:chevrons-down',
    order: 63,
    defaultSize: { w: 240, h: 96 },
    defaultProps: { title: '折叠面板', body: '面板内容区域', open: true },
    defaultStyle: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', color: '#0f172a' },
    propSchema: [
      { key: 'title', label: '标题', type: 'text' },
      { key: 'body', label: '内容', type: 'textarea' },
      { key: 'open', label: '展开', type: 'boolean' }
    ],
    render: (node) => {
      const open = Boolean(node.props.open)
      return box(
        node,
        [
          h(
            'div',
            {
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                fontWeight: 600,
                fontSize: '14px',
                borderBottom: open ? '1px solid #f1f5f9' : 'none'
              }
            },
            [
              h('span', {}, str(node.props.title)),
              h('span', { style: { width: '16px', height: '16px', color: '#94a3b8' } }, [
                renderIcon(open ? 'tabler:chevron-up' : 'tabler:chevron-down')
              ])
            ]
          ),
          open ? h('div', { style: { padding: '10px 12px', fontSize: '13px', color: '#475569' } }, str(node.props.body)) : null
        ],
        { display: 'flex', flexDirection: 'column', overflow: 'hidden' }
      )
    }
  },
  {
    type: 'pm-modal',
    name: '弹窗',
    category: 'nav',
    icon: 'tabler:app-window',
    order: 64,
    defaultSize: { w: 280, h: 160 },
    defaultProps: { title: '弹窗标题', body: '这里是弹窗内容。' },
    defaultStyle: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a' },
    propSchema: [
      { key: 'title', label: '标题', type: 'text' },
      { key: 'body', label: '内容', type: 'textarea' }
    ],
    render: (node) =>
      box(
        node,
        [
          h(
            'div',
            {
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                fontWeight: 600,
                fontSize: '14px',
                borderBottom: '1px solid #f1f5f9'
              }
            },
            [h('span', {}, str(node.props.title)), h('span', { style: { width: '16px', height: '16px', color: '#94a3b8' } }, [renderIcon('tabler:x')])]
          ),
          h('div', { style: { padding: '12px', fontSize: '13px', color: '#475569', lineHeight: '1.6' } }, str(node.props.body))
        ],
        { display: 'flex', flexDirection: 'column', overflow: 'hidden' }
      )
  },
  {
    type: 'pm-alert',
    name: '提示',
    category: 'nav',
    icon: 'tabler:alert-circle',
    order: 65,
    defaultSize: { w: 260, h: 40 },
    defaultProps: { message: '这是一条提示信息', type: 'info' },
    defaultStyle: { borderRadius: '6px', fontSize: '13px' },
    propSchema: [
      { key: 'message', label: '内容', type: 'text' },
      {
        key: 'type',
        label: '类型',
        type: 'select',
        options: [
          { label: '信息', value: 'info' },
          { label: '成功', value: 'success' },
          { label: '警告', value: 'warning' },
          { label: '错误', value: 'error' }
        ]
      }
    ],
    render: (node) => {
      const preset = ALERT_STYLE[str(node.props.type, 'info')] ?? ALERT_STYLE.info!
      return box(
        node,
        [
          h('span', { style: { width: '16px', height: '16px', flex: '0 0 auto' } }, [renderIcon(preset.icon)]),
          h('span', {}, str(node.props.message))
        ],
        {
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '0 12px',
          background: preset.background,
          color: preset.color,
          border: `1px solid ${preset.color}33`
        }
      )
    }
  },
  {
    type: 'pm-steps',
    name: '步骤条',
    category: 'nav',
    icon: 'tabler:step-into',
    order: 66,
    defaultSize: { w: 300, h: 40 },
    defaultProps: { steps: '第一步,第二步,第三步', current: 1 },
    defaultStyle: { background: 'transparent', color: '#0f172a' },
    propSchema: [
      { key: 'steps', label: '步骤(逗号分隔)', type: 'text' },
      { key: 'current', label: '当前步骤', type: 'number', min: 1, max: 10, step: 1 }
    ],
    render: (node) => {
      const steps = splitList(node.props.steps)
      const current = num(node.props.current, 1)
      return box(
        node,
        steps.flatMap((step, index) => [
          h('div', { style: { display: 'flex', alignItems: 'center', gap: '6px' } }, [
            h(
              'span',
              {
                style: {
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  background: index < current ? '#2563eb' : '#e2e8f0',
                  color: index < current ? '#ffffff' : '#64748b'
                }
              },
              String(index + 1)
            ),
            h('span', { style: { fontSize: '13px', color: index < current ? '#0f172a' : '#94a3b8' } }, step)
          ]),
          index < steps.length - 1 ? h('div', { style: { flex: 1, height: '1px', background: '#e2e8f0' } }) : null
        ]),
        { display: 'flex', alignItems: 'center', gap: '8px' }
      )
    }
  }
]
