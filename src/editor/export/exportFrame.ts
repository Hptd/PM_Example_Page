import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import type { Comment, Frame, ID, Project } from '@/editor/core/schema'
import { walkTree } from '@/editor/core/tree'
import { renderNode, type RenderOptions } from '@/editor/render/renderNode'
import { loadAllIconSets } from '@/editor/widgets/icons'

export interface ExportResult {
  cleanHtml: string
  annotatedHtml: string
  annotationMap: Record<ID, Comment[]>
}

const BASE_CSS = [
  '*{box-sizing:border-box}',
  'body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"PingFang SC","Microsoft YaHei",sans-serif;background:#f1f5f9}',
  '.pm-frame{position:relative;margin:0 auto}',
  '.pm-node{position:absolute}'
].join('')

const ANNOTATED_CSS = [
  '.pm-has-comment{outline:1px dashed #f59e0b;outline-offset:1px}',
  '.pm-anno-badge{position:absolute;top:-8px;right:-8px;min-width:16px;height:16px;line-height:16px;padding:0 4px;border-radius:8px;background:#f59e0b;color:#fff;font-size:11px;text-align:center;cursor:pointer;z-index:1000;font-family:sans-serif}',
  '.pm-anno-popup{position:fixed;z-index:10000;max-width:260px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;box-shadow:0 8px 24px rgba(15,23,42,.16);padding:10px 12px;font-family:sans-serif;font-size:13px;color:#0f172a}',
  '.pm-anno-item+.pm-anno-item{margin-top:8px;border-top:1px solid #f1f5f9;padding-top:8px}',
  '.pm-anno-meta{color:#94a3b8;font-size:11px;margin-bottom:2px}'
].join('')

const RUNTIME = [
  '(function(){',
  'function esc(s){return String(s).replace(/[&<>]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;"}[c];});}',
  'var el=document.getElementById("pm-annotations");',
  'if(!el)return;',
  'var data={};',
  'try{data=JSON.parse(el.textContent||"{}");}catch(e){data={};}',
  'var popup=null;',
  'function closePopup(){if(popup){popup.remove();popup=null;}}',
  'function showPopup(nodeId,x,y){',
  'closePopup();',
  'var list=data[nodeId]||[];',
  'if(!list.length)return;',
  'popup=document.createElement("div");',
  'popup.className="pm-anno-popup";',
  'var html="";',
  'for(var i=0;i<list.length;i++){html+="<div class=\\"pm-anno-item\\"><div class=\\"pm-anno-meta\\">"+esc(list[i].author)+"</div><div>"+esc(list[i].text)+"</div></div>";}',
  'popup.innerHTML=html;',
  'popup.style.left=x+"px";',
  'popup.style.top=y+"px";',
  'document.body.appendChild(popup);',
  '}',
  'function init(){',
  'var nodes=document.querySelectorAll("[data-pm-comments]");',
  'for(var i=0;i<nodes.length;i++){(function(node){',
  'node.classList.add("pm-has-comment");',
  'var badge=document.createElement("span");',
  'badge.className="pm-anno-badge";',
  'badge.textContent=node.getAttribute("data-pm-comments");',
  'badge.addEventListener("click",function(ev){',
  'ev.stopPropagation();',
  'var r=node.getBoundingClientRect();',
  'showPopup(node.getAttribute("data-pm-id"),r.right+8,r.top);',
  '});',
  'node.appendChild(badge);',
  '})(nodes[i]);}',
  'document.addEventListener("click",function(){closePopup();});',
  '}',
  'if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",init);}else{init();}',
  '})();'
].join('')

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      default:
        return char
    }
  })
}

function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

function collectFrameAnnotations(frame: Frame, annotations: Record<ID, Comment[]>): Record<ID, Comment[]> {
  const result: Record<ID, Comment[]> = {}
  walkTree(frame.tree, (node) => {
    const list = annotations[node.id]
    if (list?.length) result[node.id] = list
  })
  return result
}

async function renderFrameBody(frame: Frame, options: RenderOptions): Promise<string> {
  const vnode = h(
    'div',
    {
      class: 'pm-frame',
      style: {
        position: 'relative',
        width: `${frame.w}px`,
        height: `${frame.h}px`,
        background: frame.background,
        overflow: 'hidden'
      }
    },
    frame.tree.map((node) => renderNode(node, options))
  )
  return renderToString(vnode)
}

function wrapDocument(title: string, body: string, annotationScript: string): string {
  return [
    '<!doctype html>',
    '<html lang="zh-CN">',
    '<head>',
    '<meta charset="UTF-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    `<title>${escapeHtml(title)}</title>`,
    `<style>${BASE_CSS}${annotationScript ? ANNOTATED_CSS : ''}</style>`,
    '</head>',
    '<body>',
    body,
    annotationScript,
    '</body>',
    '</html>'
  ].join('\n')
}

export async function exportFrame(frame: Frame, project: Project): Promise<ExportResult> {
  await loadAllIconSets()
  const annotationMap = collectFrameAnnotations(frame, project.annotations)
  const commentCounts: Record<ID, number> = {}
  for (const [id, list] of Object.entries(annotationMap)) {
    if (list.length) commentCounts[id] = list.length
  }

  const [cleanBody, annotatedBody] = await Promise.all([
    renderFrameBody(frame, {}),
    renderFrameBody(frame, { commentCounts })
  ])

  const payload = [`<script type="application/json" id="pm-annotations">${safeJson(annotationMap)}</script>`, `<script>${RUNTIME}</script>`].join('\n')

  return {
    cleanHtml: wrapDocument(frame.name, cleanBody, ''),
    annotatedHtml: wrapDocument(frame.name, annotatedBody, payload),
    annotationMap
  }
}
