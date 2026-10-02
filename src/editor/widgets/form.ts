import { h } from 'vue'
import type { WidgetDef } from '../core/registry'
import { baseStyle, box, str } from './helpers'
import { renderIcon } from './icons'

export const formWidgets: WidgetDef[] = [
  {
    type: 'pm-input',
    name: '输入框',
    category: 'form',
    icon: 'tabler:input-search',
    order: 20,
    defaultSize: { w: 200, h: 36 },
    defaultProps: { placeholder: '请输入内容', value: '' },
    defaultStyle: {
      background: '#ffffff',
      border: '1px solid #cbd5e1',
      borderRadius: '6px',
      color: '#0f172a',
      fontSize: '14px',
      padding: '0 10px'
    },
    propSchema: [
      { key: 'placeholder', label: '占位提示', type: 'text' },
      { key: 'value', label: '默认值', type: 'text' }
    ],
    render: (node) =>
      h('input', {
        readonly: true,
        placeholder: str(node.props.placeholder),
        value: str(node.props.value),
        style: baseStyle(node, { outline: 'none' })
      })
  },
  {
    type: 'pm-textarea',
    name: '文本域',
    category: 'form',
    icon: 'tabler:align-left',
    order: 21,
    defaultSize: { w: 220, h: 88 },
    defaultProps: { placeholder: '请输入多行内容', value: '' },
    defaultStyle: {
      background: '#ffffff',
      border: '1px solid #cbd5e1',
      borderRadius: '6px',
      color: '#0f172a',
      fontSize: '14px',
      padding: '8px 10px'
    },
    propSchema: [
      { key: 'placeholder', label: '占位提示', type: 'text' },
      { key: 'value', label: '默认值', type: 'textarea' }
    ],
    render: (node) =>
      h(
        'textarea',
        {
          readonly: true,
          placeholder: str(node.props.placeholder),
          style: baseStyle(node, { outline: 'none', resize: 'none', fontFamily: 'inherit' })
        },
        str(node.props.value)
      )
  },
  {
    type: 'pm-select',
    name: '下拉选择',
    category: 'form',
    icon: 'tabler:select',
    order: 22,
    defaultSize: { w: 200, h: 36 },
    defaultProps: { options: '选项一,选项二,选项三', value: '选项一' },
    defaultStyle: {
      background: '#ffffff',
      border: '1px solid #cbd5e1',
      borderRadius: '6px',
      color: '#0f172a',
      fontSize: '14px',
      padding: '0 10px'
    },
    propSchema: [
      { key: 'options', label: '选项(逗号分隔)', type: 'text' },
      { key: 'value', label: '选中值', type: 'text' }
    ],
    render: (node) => {
      const options = str(node.props.options)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
      const value = str(node.props.value)
      return h(
        'select',
        { style: baseStyle(node, { outline: 'none' }) },
        options.map((option) => h('option', { value: option, selected: option === value }, option))
      )
    }
  },
  {
    type: 'pm-checkbox',
    name: '复选框',
    category: 'form',
    icon: 'tabler:checkbox',
    order: 23,
    defaultSize: { w: 120, h: 24 },
    defaultProps: { label: '选项', checked: false },
    defaultStyle: { color: '#334155', fontSize: '14px', background: 'transparent' },
    propSchema: [
      { key: 'label', label: '文字', type: 'text' },
      { key: 'checked', label: '选中', type: 'boolean' }
    ],
    render: (node) => {
      const checked = Boolean(node.props.checked)
      return box(
        node,
        [
          h(
            'span',
            {
              style: {
                width: '16px',
                height: '16px',
                border: `1px solid ${checked ? '#2563eb' : '#94a3b8'}`,
                borderRadius: '3px',
                background: checked ? '#2563eb' : '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: '0 0 auto'
              }
            },
            checked ? [h('span', { style: { width: '10px', height: '10px' } }, [renderIcon('tabler:check', '#ffffff')])] : []
          ),
          h('span', {}, str(node.props.label, '选项'))
        ],
        { display: 'flex', alignItems: 'center', gap: '8px' }
      )
    }
  },
  {
    type: 'pm-radio',
    name: '单选框',
    category: 'form',
    icon: 'tabler:circle-dot',
    order: 24,
    defaultSize: { w: 120, h: 24 },
    defaultProps: { label: '选项', checked: false },
    defaultStyle: { color: '#334155', fontSize: '14px', background: 'transparent' },
    propSchema: [
      { key: 'label', label: '文字', type: 'text' },
      { key: 'checked', label: '选中', type: 'boolean' }
    ],
    render: (node) => {
      const checked = Boolean(node.props.checked)
      return box(
        node,
        [
          h(
            'span',
            {
              style: {
                width: '16px',
                height: '16px',
                border: `1px solid ${checked ? '#2563eb' : '#94a3b8'}`,
                borderRadius: '50%',
                background: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: '0 0 auto'
              }
            },
            checked ? [h('span', { style: { width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' } })] : []
          ),
          h('span', {}, str(node.props.label, '选项'))
        ],
        { display: 'flex', alignItems: 'center', gap: '8px' }
      )
    }
  },
  {
    type: 'pm-switch',
    name: '开关',
    category: 'form',
    icon: 'tabler:toggle-right',
    order: 25,
    defaultSize: { w: 44, h: 24 },
    defaultProps: { checked: true },
    defaultStyle: {},
    propSchema: [{ key: 'checked', label: '开启', type: 'boolean' }],
    render: (node) => {
      const checked = Boolean(node.props.checked)
      return box(
        node,
        [
          h('span', {
            style: {
              width: '40px',
              height: '22px',
              borderRadius: '11px',
              background: checked ? '#2563eb' : '#cbd5e1',
              position: 'relative',
              display: 'inline-block'
            }
          }, [
            h('span', {
              style: {
                position: 'absolute',
                top: '2px',
                left: checked ? '20px' : '2px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: '#ffffff'
              }
            })
          ])
        ],
        { display: 'flex', alignItems: 'center' }
      )
    }
  },
  {
    type: 'pm-upload',
    name: '上传',
    category: 'form',
    icon: 'tabler:upload',
    order: 26,
    defaultSize: { w: 200, h: 120 },
    defaultProps: { text: '点击或拖拽上传' },
    defaultStyle: { background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '6px' },
    propSchema: [{ key: 'text', label: '提示文字', type: 'text' }],
    render: (node) =>
      box(
        node,
        [
          h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: '#64748b' } }, [
            h('span', { style: { width: '28px', height: '28px' } }, [renderIcon('tabler:cloud-upload')]),
            h('span', { style: { fontSize: '13px' } }, str(node.props.text, '点击或拖拽上传'))
          ])
        ],
        { display: 'flex', alignItems: 'center', justifyContent: 'center' }
      )
  }
]
