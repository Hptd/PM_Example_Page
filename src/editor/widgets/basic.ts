import { h } from 'vue'
import type { WidgetDef } from '@/editor/core/registry'
import { baseStyle, box, num, str } from './helpers'
import { renderIcon } from './icons'

export const basicWidgets: WidgetDef[] = [
  {
    type: 'pm-rect',
    name: '矩形',
    category: 'basic',
    icon: 'tabler:rectangle',
    order: 1,
    defaultSize: { w: 160, h: 100 },
    defaultProps: {},
    defaultStyle: { background: '#e2e8f0', border: '1px solid #94a3b8', borderRadius: '0px' },
    propSchema: [],
    render: (node, _children) => box(node, [])
  },
  {
    type: 'pm-ellipse',
    name: '椭圆',
    category: 'basic',
    icon: 'tabler:circle',
    order: 2,
    defaultSize: { w: 120, h: 120 },
    defaultProps: {},
    defaultStyle: { background: '#e2e8f0', border: '1px solid #94a3b8', borderRadius: '50%' },
    propSchema: [],
    render: (node, _children) => box(node, [])
  },
  {
    type: 'pm-line',
    name: '线条',
    category: 'basic',
    icon: 'tabler:line',
    order: 3,
    defaultSize: { w: 160, h: 2 },
    defaultProps: { direction: 'horizontal', color: '#334155', thickness: 2 },
    defaultStyle: {},
    propSchema: [
      {
        key: 'direction',
        label: '方向',
        type: 'select',
        options: [
          { label: '水平', value: 'horizontal' },
          { label: '垂直', value: 'vertical' }
        ]
      },
      { key: 'color', label: '颜色', type: 'color' },
      { key: 'thickness', label: '粗细', type: 'number', min: 1, max: 20, step: 1 }
    ],
    render: (node) => {
      const horizontal = str(node.props.direction, 'horizontal') === 'horizontal'
      const color = str(node.props.color, '#334155')
      const thickness = num(node.props.thickness, 2)
      return h(
        'div',
        { style: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
        [
          h('div', {
            style: horizontal
              ? { width: '100%', height: `${thickness}px`, background: color }
              : { width: `${thickness}px`, height: '100%', background: color }
          })
        ]
      )
    }
  },
  {
    type: 'pm-text',
    name: '文本',
    category: 'basic',
    icon: 'tabler:typography',
    order: 4,
    defaultSize: { w: 120, h: 32 },
    defaultProps: { content: '文本内容' },
    defaultStyle: {
      color: '#1f2937',
      fontSize: '14px',
      fontWeight: '400',
      textAlign: 'left',
      background: 'transparent'
    },
    textEditor: { key: 'content', multiline: true },
    propSchema: [{ key: 'content', label: '内容', type: 'textarea' }],
    render: (node) =>
      box(node, str(node.props.content, ''), {
        display: 'flex',
        alignItems: 'center',
        padding: '0 2px',
        overflow: 'hidden',
        whiteSpace: 'pre-wrap'
      })
  },
  {
    type: 'pm-image',
    name: '图片',
    category: 'basic',
    icon: 'tabler:photo',
    order: 5,
    defaultSize: { w: 200, h: 140 },
    defaultProps: { src: '', fit: 'cover', alt: '图片' },
    defaultStyle: { background: '#f1f5f9', border: '1px dashed #cbd5e1', borderRadius: '4px' },
    propSchema: [
      { key: 'src', label: '图片地址', type: 'text', placeholder: 'https://...' },
      {
        key: 'fit',
        label: '填充方式',
        type: 'select',
        options: [
          { label: '填充裁剪', value: 'cover' },
          { label: '完整显示', value: 'contain' },
          { label: '拉伸', value: 'fill' }
        ]
      }
    ],
    render: (node) => {
      const src = str(node.props.src)
      if (!src) {
        return h(
          'div',
          { style: baseStyle(node, { display: 'flex', alignItems: 'center', justifyContent: 'center' }) },
          [h('div', { style: { width: '32px', height: '32px', color: '#94a3b8' } }, [renderIcon('tabler:photo')])]
        )
      }
      return h('img', {
        src,
        alt: str(node.props.alt, '图片'),
        style: baseStyle(node, { objectFit: str(node.props.fit, 'cover'), display: 'block' })
      })
    }
  },
  {
    type: 'pm-icon',
    name: '图标',
    category: 'basic',
    icon: 'tabler:star',
    order: 6,
    defaultSize: { w: 32, h: 32 },
    defaultProps: { name: 'tabler:star' },
    defaultStyle: { color: '#334155' },
    propSchema: [{ key: 'name', label: '图标', type: 'icon', iconSet: 'tabler' }],
    render: (node) => renderIcon(str(node.props.name, 'tabler:star'), str(node.style?.color, '#334155'), '100%')
  },
  {
    type: 'pm-logo',
    name: '品牌 Logo',
    category: 'basic',
    icon: 'simple-icons:github',
    order: 7,
    defaultSize: { w: 32, h: 32 },
    defaultProps: { name: 'simple-icons:github' },
    defaultStyle: { color: '#181717' },
    propSchema: [{ key: 'name', label: 'Logo', type: 'icon', iconSet: 'simple-icons' }],
    render: (node) => renderIcon(str(node.props.name, 'simple-icons:github'), str(node.style?.color, '#181717'), '100%')
  },
  {
    type: 'pm-button',
    name: '按钮',
    category: 'basic',
    icon: 'tabler:square-rounded',
    order: 8,
    defaultSize: { w: 96, h: 36 },
    defaultProps: { label: '按钮' },
    defaultStyle: {
      background: '#2563eb',
      color: '#ffffff',
      borderRadius: '6px',
      fontSize: '14px',
      border: 'none'
    },
    textEditor: { key: 'label' },
    propSchema: [{ key: 'label', label: '文字', type: 'text' }],
    render: (node) => box(node, str(node.props.label, '按钮'), { display: 'flex', alignItems: 'center', justifyContent: 'center' })
  },
  {
    type: 'pm-container',
    name: '容器',
    category: 'basic',
    icon: 'tabler:layout',
    order: 9,
    defaultSize: { w: 240, h: 180 },
    defaultProps: {},
    defaultStyle: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' },
    droppable: true,
    propSchema: [],
    render: (node, children) => h('div', { style: baseStyle(node, { position: 'relative' }) }, children)
  },
  {
    type: 'pm-custom',
    name: '自定义组件',
    category: 'custom',
    icon: 'tabler:box',
    order: 0,
    defaultSize: { w: 120, h: 120 },
    defaultProps: { name: '', svg: '' },
    defaultStyle: { background: 'transparent' },
    propSchema: [{ key: 'name', label: '名称', type: 'text' }],
    render: (node) => {
      const svg = str(node.props.svg)
      if (svg) {
        return h('img', { src: svg, alt: str(node.props.name, ''), draggable: false, style: baseStyle(node, { objectFit: 'contain', display: 'block' }) })
      }
      return box(node, str(node.props.name, '自定义组件'), {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#94a3b8',
        fontSize: '12px'
      })
    }
  }
]
