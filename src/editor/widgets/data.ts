import { h } from 'vue'
import type { WidgetDef } from '../core/registry'
import { box, num, splitList, str } from './helpers'

export const dataWidgets: WidgetDef[] = [
  {
    type: 'pm-table',
    name: '表格',
    category: 'data',
    icon: 'tabler:table',
    order: 40,
    defaultSize: { w: 320, h: 150 },
    defaultProps: { columns: '名称,状态,操作', rows: 3 },
    defaultStyle: { background: '#ffffff', color: '#334155', fontSize: '13px', border: '1px solid #e2e8f0' },
    propSchema: [
      { key: 'columns', label: '列(逗号分隔)', type: 'text' },
      { key: 'rows', label: '数据行数', type: 'number', min: 0, max: 20, step: 1 }
    ],
    render: (node) => {
      const columns = splitList(node.props.columns)
      const rows = Math.max(0, num(node.props.rows, 3))
      return h('table', { style: { width: '100%', height: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', background: str(node.style?.background, '#ffffff'), fontSize: str(node.style?.fontSize, '13px') } }, [
        h(
          'thead',
          {},
          [
            h(
              'tr',
              {},
              columns.map((column) =>
                h('th', { style: { border: '1px solid #e2e8f0', padding: '6px 8px', background: '#f8fafc', textAlign: 'left', fontWeight: 600 } }, column)
              )
            )
          ]
        ),
        h(
          'tbody',
          {},
          Array.from({ length: rows }).map(() =>
            h(
              'tr',
              {},
              columns.map(() => h('td', { style: { border: '1px solid #e2e8f0', padding: '6px 8px' } }, ''))
            )
          )
        )
      ])
    }
  },
  {
    type: 'pm-list',
    name: '列表',
    category: 'data',
    icon: 'tabler:list',
    order: 41,
    defaultSize: { w: 220, h: 132 },
    defaultProps: { items: '列表项一\n列表项二\n列表项三' },
    defaultStyle: { background: '#ffffff', color: '#334155', fontSize: '13px', border: '1px solid #e2e8f0', borderRadius: '6px' },
    propSchema: [{ key: 'items', label: '内容(每行一项)', type: 'textarea' }],
    render: (node) => {
      const items = splitList(node.props.items)
      return h(
        'ul',
        { style: { width: '100%', height: '100%', listStyle: 'none', margin: '0', padding: '0', background: str(node.style?.background, '#ffffff'), borderRadius: str(node.style?.borderRadius, '6px'), overflow: 'hidden' } },
        items.map((item) =>
          h('li', { style: { padding: '8px 10px', borderBottom: '1px solid #f1f5f9', fontSize: str(node.style?.fontSize, '13px'), color: str(node.style?.color, '#334155') } }, item)
        )
      )
    }
  },
  {
    type: 'pm-card',
    name: '卡片',
    category: 'data',
    icon: 'tabler:id-badge',
    order: 42,
    defaultSize: { w: 220, h: 140 },
    defaultProps: { title: '卡片标题', body: '这里是卡片的描述内容。' },
    defaultStyle: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a' },
    propSchema: [
      { key: 'title', label: '标题', type: 'text' },
      { key: 'body', label: '内容', type: 'textarea' }
    ],
    render: (node) =>
      box(
        node,
        [
          h('div', { style: { fontWeight: 600, fontSize: '14px', padding: '10px 12px', borderBottom: '1px solid #f1f5f9' } }, str(node.props.title)),
          h('div', { style: { padding: '10px 12px', fontSize: '13px', color: '#475569', lineHeight: '1.6' } }, str(node.props.body))
        ],
        { display: 'flex', flexDirection: 'column', overflow: 'hidden' }
      )
  },
  {
    type: 'pm-tag',
    name: '标签',
    category: 'data',
    icon: 'tabler:tag',
    order: 43,
    defaultSize: { w: 56, h: 24 },
    defaultProps: { label: '标签' },
    defaultStyle: { background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '4px', fontSize: '12px' },
    propSchema: [{ key: 'label', label: '文字', type: 'text' }],
    render: (node) => box(node, str(node.props.label, '标签'), { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' })
  },
  {
    type: 'pm-avatar',
    name: '头像',
    category: 'data',
    icon: 'tabler:user-circle',
    order: 44,
    defaultSize: { w: 40, h: 40 },
    defaultProps: { text: '王' },
    defaultStyle: { background: '#cbd5e1', color: '#ffffff', borderRadius: '50%', fontSize: '16px' },
    propSchema: [{ key: 'text', label: '文字', type: 'text' }],
    render: (node) => box(node, str(node.props.text, ''), { display: 'flex', alignItems: 'center', justifyContent: 'center' })
  },
  {
    type: 'pm-progress',
    name: '进度条',
    category: 'data',
    icon: 'tabler:progress',
    order: 45,
    defaultSize: { w: 200, h: 8 },
    defaultProps: { percent: 60, color: '#2563eb' },
    defaultStyle: { background: '#e2e8f0', borderRadius: '999px' },
    propSchema: [
      { key: 'percent', label: '百分比', type: 'number', min: 0, max: 100, step: 1 },
      { key: 'color', label: '颜色', type: 'color' }
    ],
    render: (node) => {
      const percent = Math.min(100, Math.max(0, num(node.props.percent, 60)))
      return box(
        node,
        [h('div', { style: { width: `${percent}%`, height: '100%', background: str(node.props.color, '#2563eb'), borderRadius: '999px' } })],
        { overflow: 'hidden' }
      )
    }
  },
  {
    type: 'pm-divider',
    name: '分割线',
    category: 'data',
    icon: 'tabler:separator-horizontal',
    order: 46,
    defaultSize: { w: 200, h: 2 },
    defaultProps: {},
    defaultStyle: { background: '#e2e8f0' },
    propSchema: [],
    render: (node, _children) => box(node, [])
  },
  {
    type: 'pm-breadcrumb',
    name: '面包屑',
    category: 'data',
    icon: 'tabler:chevron-right',
    order: 47,
    defaultSize: { w: 240, h: 24 },
    defaultProps: { items: '首页/列表/详情' },
    defaultStyle: { color: '#0f172a', fontSize: '13px', background: 'transparent' },
    propSchema: [{ key: 'items', label: '路径(斜杠分隔)', type: 'text' }],
    render: (node) => {
      const items = str(node.props.items)
        .split('/')
        .map((item) => item.trim())
        .filter(Boolean)
      return box(
        node,
        items.flatMap((item, index) =>
          index === 0
            ? [h('span', {}, item)]
            : [
                h('span', { style: { color: '#94a3b8', margin: '0 6px' } }, '/'),
                h('span', { style: { color: index === items.length - 1 ? '#0f172a' : '#2563eb' } }, item)
              ]
        ),
        { display: 'flex', alignItems: 'center' }
      )
    }
  },
  {
    type: 'pm-pagination',
    name: '分页',
    category: 'data',
    icon: 'tabler:dots',
    order: 48,
    defaultSize: { w: 220, h: 32 },
    defaultProps: { total: 5, current: 1 },
    defaultStyle: {},
    propSchema: [
      { key: 'total', label: '页数', type: 'number', min: 1, max: 20, step: 1 },
      { key: 'current', label: '当前页', type: 'number', min: 1, max: 20, step: 1 }
    ],
    render: (node) => {
      const total = Math.max(1, num(node.props.total, 5))
      const current = Math.min(total, Math.max(1, num(node.props.current, 1)))
      return box(
        node,
        Array.from({ length: total }).map((_, index) =>
          h(
            'span',
            {
              style: {
                minWidth: '28px',
                height: '28px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                fontSize: '13px',
                background: index + 1 === current ? '#2563eb' : '#ffffff',
                color: index + 1 === current ? '#ffffff' : '#334155'
              }
            },
            String(index + 1)
          )
        ),
        { display: 'flex', gap: '6px', alignItems: 'center' }
      )
    }
  }
]
