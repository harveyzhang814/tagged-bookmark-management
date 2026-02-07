import {
  forceCollide as d3ForceCollide,
  forceX as d3ForceX,
  forceY as d3ForceY
} from 'd3-force-3d';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d';
import { getAllTags } from '../lib/bookmarkService';
import { getTagCooccurrenceMap } from '../lib/storage';
import { syncTagCooccurrence } from '../lib/tagCooccurrenceService';
import type { Tag } from '../lib/types';
import './tagGraphOverlay.css';

export interface TagGraphOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

type GraphNode = Tag & { id: string };
type GraphLink = { source: string; target: string; count: number; probability?: number };

export const TagGraphOverlay = ({ isOpen, onClose }: TagGraphOverlayProps) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<ForceGraphMethods<GraphNode, GraphLink> | undefined>(undefined);
  const labelColorRef = useRef('#2c2c2c');
  const debugRef = useRef({
    renderFramePostCalls: 0,
    nodeTextDraws: 0,
    linkTextDraws: 0,
    last: null as { label: string; mode: string; x: number; y: number; globalScale: number; showLabel?: boolean; r: number } | null
  });
  const [debugInfo, setDebugInfo] = useState<typeof debugRef.current>({ renderFramePostCalls: 0, nodeTextDraws: 0, linkTextDraws: 0, last: null });
  const [tags, setTags] = useState<Tag[]>([]);
  const [cooccur, setCooccur] = useState<Record<string, number>>({});
  const [mode, setMode] = useState<'global' | 'center'>('global');
  const [centerTagId, setCenterTagId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const modeRef = useRef(mode);
  const centerTagIdRef = useRef(centerTagId);
  const graphDataRef = useRef<{ nodes: Array<{ id: string; name: string; color: string; usageCount: number; __mode: 'global' | 'center'; __clusterId?: number; x?: number; y?: number; fx?: number; fy?: number }>; links: Array<{ source: string; target: string; count?: number; probability?: number }> }>({ nodes: [], links: [] });
  const clusterCentersRef = useRef<Array<[number, number]>>([]);

  const loadData = useCallback(async () => {
    const [tagsList, cooccurMap] = await Promise.all([
      getAllTags(),
      getTagCooccurrenceMap()
    ]);
    setTags(tagsList);
    setCooccur(cooccurMap);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    void loadData();
    setMode('global');
    setCenterTagId(null);
    modeRef.current = 'global';
    centerTagIdRef.current = null;
  }, [isOpen, loadData]);

  useEffect(() => {
    if (!isOpen) return;
    labelColorRef.current =
      getComputedStyle(document.documentElement).getPropertyValue('--text-main').trim() || '#2c2c2c';
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const tagById = useMemo(() => {
    const map = new Map<string, Tag>();
    tags.forEach((tag) => map.set(tag.id, tag));
    return map;
  }, [tags]);

  const { nodes, links } = useMemo(() => {
    const nodeList: GraphNode[] = tags.map((tag) => ({ ...tag, id: tag.id }));
    if (mode === 'global') {
      const linkList: GraphLink[] = [];
      Object.entries(cooccur).forEach(([key, count]) => {
        const [a, b] = key.split('|');
        if (tagById.has(a) && tagById.has(b)) {
          linkList.push({ source: a, target: b, count });
        }
      });
      return { nodes: nodeList, links: linkList };
    }
    if (!centerTagId) return { nodes: nodeList, links: [] as GraphLink[] };
    const centerTag = tagById.get(centerTagId);
    if (!centerTag) return { nodes: nodeList, links: [] as GraphLink[] };
    const centerUsage = centerTag.usageCount || 1;
    const neighborIds = new Set<string>();
    const linkList: GraphLink[] = [];
    Object.entries(cooccur).forEach(([key, count]) => {
      const [a, b] = key.split('|');
      if (a !== centerTagId && b !== centerTagId) return;
      const other = a === centerTagId ? b : a;
      if (!tagById.has(other)) return;
      neighborIds.add(other);
      linkList.push({
        source: centerTagId,
        target: other,
        count,
        probability: count / centerUsage
      });
    });
    const centerNode: GraphNode = { ...centerTag, id: centerTag.id };
    const neighborNodes: GraphNode[] = Array.from(neighborIds).map(
      (id) => ({ ...tagById.get(id)!, id })
    );
    return {
      nodes: [centerNode, ...neighborNodes],
      links: linkList
    };
  }, [tags, cooccur, mode, centerTagId, tagById]);

  const graphData = useMemo(() => {
    type NodeWithMeta = { id: string; name: string; color: string; usageCount: number; __mode: 'global' | 'center'; __clusterId?: number; x?: number; y?: number; fx?: number; fy?: number };
    const linksList = links as { source: string; target: string; count?: number; probability?: number }[];

    if (mode !== 'global' || linksList.length === 0) {
      const data = {
        nodes: nodes.map((n) => ({
          ...n,
          __mode: mode,
          ...(mode === 'center' && centerTagId != null && n.id === centerTagId ? { fx: 0, fy: 0 } : {})
        })) as NodeWithMeta[],
        links: linksList
      };
      graphDataRef.current = data;
      clusterCentersRef.current = [];
      return data;
    }

    const idToCluster = new Map<string, number>();
    const adj = new Map<string, Set<string>>();
    nodes.forEach((n) => adj.set(n.id, new Set()));
    linksList.forEach((link) => {
      const a = typeof link.source === 'string' ? link.source : (link.source as { id: string }).id;
      const b = typeof link.target === 'string' ? link.target : (link.target as { id: string }).id;
      adj.get(a)?.add(b);
      adj.get(b)?.add(a);
    });
    let clusterIndex = 0;
    const visited = new Set<string>();
    for (const node of nodes) {
      if (visited.has(node.id)) continue;
      const stack = [node.id];
      visited.add(node.id);
      while (stack.length > 0) {
        const id = stack.pop()!;
        idToCluster.set(id, clusterIndex);
        for (const nb of adj.get(id) ?? []) {
          if (!visited.has(nb)) {
            visited.add(nb);
            stack.push(nb);
          }
        }
      }
      clusterIndex += 1;
    }
    const numClusters = clusterIndex;
    const clusterSizes = new Array<number>(numClusters).fill(0);
    idToCluster.forEach((cid) => {
      clusterSizes[cid] += 1;
    });
    const maxSize = Math.max(...clusterSizes);
    const minSize = Math.min(...clusterSizes);
    const rMin = 80;
    const rMax = 380;
    const centers: Array<[number, number]> = [];
    for (let i = 0; i < numClusters; i++) {
      const size = clusterSizes[i];
      const t = maxSize > minSize ? (size - minSize) / (maxSize - minSize) : 1;
      const radius = rMax - (rMax - rMin) * t;
      const angle = (2 * Math.PI * i) / Math.max(1, numClusters);
      centers.push([radius * Math.cos(angle), radius * Math.sin(angle)]);
    }
    clusterCentersRef.current = centers;

    const data = {
      nodes: nodes.map((n) => ({
        ...n,
        __mode: mode,
        __clusterId: idToCluster.get(n.id) ?? 0
      })) as NodeWithMeta[],
      links: linksList
    };
    graphDataRef.current = data;
    return data;
  }, [nodes, links, mode, centerTagId]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    centerTagIdRef.current = centerTagId;
  }, [centerTagId]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await syncTagCooccurrence();
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  const handleNodeClick = useCallback((node: { id: string }) => {
    setCenterTagId(node.id);
    setMode('center');
    centerTagIdRef.current = node.id;
    modeRef.current = 'center';
  }, []);

  const handleGlobal = useCallback(() => {
    setMode('global');
    setCenterTagId(null);
    modeRef.current = 'global';
    centerTagIdRef.current = null;
  }, []);

  const [width, setWidth] = useState(640);
  const [height, setHeight] = useState(400);

  useEffect(() => {
    if (!isOpen || graphData.nodes.length === 0) return;
    const timer = setTimeout(() => {
      if (mode === 'center') {
        fgRef.current?.zoomToFit(350, 80);
        setTimeout(() => {
          const currentZoom = fgRef.current?.zoom();
          if (currentZoom != null) {
            fgRef.current?.zoom(currentZoom * 0.5, 200);
          }
        }, 100);
      } else {
        fgRef.current?.zoomToFit(350, 40);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [mode, centerTagId, graphData.nodes.length, isOpen]);

  useEffect(() => {
    if (!isOpen || !fgRef.current || graphData.nodes.length === 0) return;
    const currentMode = modeRef.current;

    const linkForce = fgRef.current.d3Force('link');
    if (linkForce) {
      linkForce.distance((link: GraphLink) => {
        return currentMode === 'center' ? 200 : 160;
      });
    }

    const chargeForce = fgRef.current.d3Force('charge');
    if (chargeForce && typeof chargeForce.strength === 'function') {
      chargeForce.strength(currentMode === 'center' ? -30 : -95);
    }

    const centerForce = fgRef.current.d3Force('center');
    if (centerForce && typeof centerForce.strength === 'function') {
      centerForce.strength(currentMode === 'center' ? 1 : 0.35);
    }

    type NodeWithVal = GraphNode & { val?: number };
    const collide = d3ForceCollide<NodeWithVal>().radius((node: NodeWithVal) => {
      const r = typeof node.val === 'number' ? node.val : Math.max(4, 2 + Math.sqrt(node.usageCount || 0));
      return r + 8;
    });
    fgRef.current.d3Force('collide', collide as any);

    const centers = clusterCentersRef.current;
    type NodeWithCluster = GraphNode & { __clusterId?: number };
    if (currentMode === 'global' && centers.length > 1) {
      const forceX = d3ForceX<NodeWithCluster>()
        .x((node: NodeWithCluster) => centers[node.__clusterId ?? 0]?.[0] ?? 0)
        .strength(0.07);
      const forceY = d3ForceY<NodeWithCluster>()
        .y((node: NodeWithCluster) => centers[node.__clusterId ?? 0]?.[1] ?? 0)
        .strength(0.07);
      fgRef.current.d3Force('x', forceX as any);
      fgRef.current.d3Force('y', forceY as any);
    } else {
      fgRef.current.d3Force('x', null);
      fgRef.current.d3Force('y', null);
    }

    fgRef.current.d3ReheatSimulation();
  }, [isOpen, graphData.nodes.length, graphData.links.length, mode]);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const el = containerRef.current;
    const updateSize = () => {
      if (el) {
        setWidth(el.offsetWidth);
        setHeight(el.offsetHeight);
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const t = setInterval(() => {
      setDebugInfo({ ...debugRef.current });
    }, 500);
    return () => clearInterval(t);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="tag-graph-overlay__backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={t('tag.graph')}
    >
      <div className="tag-graph-overlay__panel">
        <div className="tag-graph-overlay__topbar">
          <span className="tag-graph-overlay__title">{t('tag.graph')}</span>
          <div className="tag-graph-overlay__actions">
            {mode === 'center' && (
              <button
                type="button"
                className="tag-graph-overlay__btn"
                onClick={handleGlobal}
                aria-label={t('tag.graphGlobal')}
              >
                {t('tag.graphGlobal')}
              </button>
            )}
            <button
              type="button"
              className="tag-graph-overlay__btn"
              onClick={() => void handleRefresh()}
              disabled={refreshing}
              aria-label={t('tag.graphRefresh')}
            >
              {refreshing ? '...' : t('tag.graphRefresh')}
            </button>
            <button
              type="button"
              className="tag-graph-overlay__close"
              onClick={onClose}
              aria-label={t('tag.graphClose')}
            >
              {t('tag.graphClose')}
            </button>
          </div>
        </div>
        <div className="tag-graph-overlay__debug" aria-live="polite">
          renderFramePostCalls={debugInfo.renderFramePostCalls} nodeTextDraws={debugInfo.nodeTextDraws} linkTextDraws={debugInfo.linkTextDraws}
          {debugInfo.last != null && (
            <>
              {' '}
              | last: &quot;{debugInfo.last.label}&quot; mode={debugInfo.last.mode} x=
              {debugInfo.last.x.toFixed(0)} y={debugInfo.last.y.toFixed(0)} scale=
              {debugInfo.last.globalScale.toFixed(2)} showLabel={String(debugInfo.last.showLabel)} r=
              {debugInfo.last.r.toFixed(0)}
            </>
          )}
        </div>
        <div className="tag-graph-overlay__content" ref={containerRef}>
          {graphData.nodes.length === 0 ? (
            <p className="tag-graph-overlay__empty">{t('tag.noTags')}</p>
          ) : graphData.nodes.length > 0 && graphData.links.length === 0 && mode === 'global' ? (
            <p className="tag-graph-overlay__empty">暂无标签关系数据，请先添加书签并为其分配多个标签</p>
          ) : (
            <ForceGraph2D
              key={`graph-${graphData.nodes.length}`}
              ref={fgRef as React.RefObject<ForceGraphMethods<GraphNode, GraphLink>>}
              graphData={graphData}
              width={width}
              height={height}
              backgroundColor="transparent"
              nodeId="id"
              nodeVal={(n) => Math.max(4, 2 + Math.sqrt((n as GraphNode).usageCount || 0))}
              nodeColor={(n) => (n as GraphNode).color ?? 'var(--accent)'}
              nodeLabel={(n) => (n as GraphNode).name}
              onRenderFramePost={(ctx, globalScale) => {
                debugRef.current.renderFramePostCalls += 1;
                const currentMode = modeRef.current;
                const data = graphDataRef.current;
                const currentCenterTagId = centerTagIdRef.current;
                
                if (!data || !data.nodes || data.nodes.length === 0) return;
                
                ctx.save();
                try {
                  data.nodes.forEach((node) => {
                    if (node.x == null || node.y == null || isNaN(node.x) || isNaN(node.y)) return;
                    const nodeMode = node.__mode ?? currentMode;
                    const r = Math.max(4, 2 + Math.sqrt(node.usageCount || 0));
                    const label = node.name;
                    const showLabel = globalScale >= 0.3 || r * globalScale >= 6;
                    
                    if (showLabel) {
                      debugRef.current.nodeTextDraws += 1;
                      ctx.fillStyle = labelColorRef.current;
                      ctx.font = '9px sans-serif';
                      ctx.textAlign = 'center';
                      ctx.textBaseline = 'top';
                      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
                      ctx.lineWidth = 2;
                      const textY = node.y + r + 8;
                      ctx.strokeText(label, node.x, textY);
                      ctx.fillText(label, node.x, textY);
                      debugRef.current.last = { label, mode: nodeMode, x: node.x, y: node.y, globalScale, showLabel, r };
                    }
                  });
                  
                  if (currentMode === 'center' && currentCenterTagId) {
                    data.links.forEach((link) => {
                      const nodeList = data.nodes;
                      const getNode = (s: string | { id: string; x?: number; y?: number }) => {
                        if (typeof s === 'string') {
                          return nodeList.find((nd) => nd.id === s);
                        }
                        return s;
                      };
                      const src = getNode(link.source);
                      const tgt = getNode(link.target);
                      if (!src || !tgt || typeof src.x !== 'number' || typeof src.y !== 'number' || typeof tgt.x !== 'number' || typeof tgt.y !== 'number') {
                        return;
                      }
                      const isSrcCenter = src.id === currentCenterTagId;
                      const centerX = isSrcCenter ? src.x : tgt.x;
                      const centerY = isSrcCenter ? src.y : tgt.y;
                      const otherX = isSrcCenter ? tgt.x : src.x;
                      const otherY = isSrcCenter ? tgt.y : src.y;
                      const labelX = centerX + (otherX - centerX) * 0.2;
                      const labelY = centerY + (otherY - centerY) * 0.2;
                      const count = link.count ?? 0;
                      const pct = link.probability != null ? (link.probability * 100).toFixed(0) : '';
                      const text = pct ? `${pct}% (${count})` : `${count}`;
                      debugRef.current.linkTextDraws += 1;
                      ctx.font = '7px sans-serif';
                      ctx.textAlign = 'center';
                      ctx.textBaseline = 'middle';
                      ctx.fillStyle = 'rgba(0,0,0,0.85)';
                      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
                      ctx.lineWidth = 1.5;
                      ctx.strokeText(text, labelX, labelY);
                      ctx.fillText(text, labelX, labelY);
                    });
                  }
                } finally {
                  ctx.restore();
                }
              }}
              linkColor="var(--border-color)"
              linkWidth={(link) => {
                const l = link as GraphLink;
                const p = l.probability;
                if (mode === 'center' && p != null) {
                  return 1 + 5 * p;
                }
                if (mode === 'global' && graphData.links.length > 0) {
                  const maxCount = Math.max(1, ...graphData.links.map((x) => (x as GraphLink).count ?? 0));
                  const count = l.count ?? 0;
                  const strength = count / maxCount;
                  return 1 + 5 * strength;
                }
                return 1;
              }}
              onNodeClick={(n, ev) => {
                ev.preventDefault();
                handleNodeClick(n as { id: string });
              }}
              enableNodeDrag
            />
          )}
        </div>
      </div>
    </div>
  );
};
