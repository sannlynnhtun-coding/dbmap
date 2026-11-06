// Diagram Geometry & Relationship Routing Engine
// Provides mathematically precise, obstacle-avoiding foreign key paths & cardinality anchors
import { getTableDimensions, isOptionalRelationship } from './diagramGeometry.js';

export function createRoundedPath(points, radius = 10) {
  if (!points || points.length < 2) return '';
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  for (let i = 1; i < points.length - 1; i++) {
    const pPrev = points[i - 1];
    const pCurr = points[i];
    const pNext = points[i + 1];

    const dx1 = pCurr.x - pPrev.x;
    const dy1 = pCurr.y - pPrev.y;
    const len1 = Math.hypot(dx1, dy1);

    const dx2 = pNext.x - pCurr.x;
    const dy2 = pNext.y - pCurr.y;
    const len2 = Math.hypot(dx2, dy2);

    if (len1 < 0.1 || len2 < 0.1) {
      d += ` L ${pCurr.x.toFixed(1)} ${pCurr.y.toFixed(1)}`;
      continue;
    }

    const actualR = Math.min(radius, len1 / 2, len2 / 2);
    const startX = pCurr.x - (dx1 / len1) * actualR;
    const startY = pCurr.y - (dy1 / len1) * actualR;
    const endX = pCurr.x + (dx2 / len2) * actualR;
    const endY = pCurr.y + (dy2 / len2) * actualR;

    d += ` L ${startX.toFixed(1)} ${startY.toFixed(1)} Q ${pCurr.x.toFixed(1)} ${pCurr.y.toFixed(1)}, ${endX.toFixed(1)} ${endY.toFixed(1)}`;
  }

  const last = points[points.length - 1];
  d += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
  return d;
}

export function getPathMidpoint(points) {
  if (!points || points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return { x: points[0].x, y: points[0].y };
  let totalLength = 0;
  const segLengths = [];
  for (let i = 0; i < points.length - 1; i++) {
    const len = Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
    segLengths.push(len);
    totalLength += len;
  }
  if (totalLength === 0) return { x: points[0].x, y: points[0].y };
  let target = totalLength / 2;
  for (let i = 0; i < points.length - 1; i++) {
    const len = segLengths[i];
    if (target <= len || i === points.length - 2) {
      const ratio = len > 0 ? target / len : 0.5;
      return {
        x: points[i].x + (points[i + 1].x - points[i].x) * ratio,
        y: points[i].y + (points[i + 1].y - points[i].y) * ratio
      };
    }
    target -= len;
  }
  return { x: points[0].x, y: points[0].y };
}

export function findChannelGraphRoute(start, startStub, endStub, end, candXs, candYs, isBlocked) {
  const xs = Array.from(new Set([startStub.x, endStub.x, ...candXs])).sort((a, b) => a - b);
  const ys = Array.from(new Set([startStub.y, endStub.y, ...candYs])).sort((a, b) => a - b);

  const startKey = `${Math.round(startStub.x)},${Math.round(startStub.y)}`;
  const endKey = `${Math.round(endStub.x)},${Math.round(endStub.y)}`;

  const dist = new Map();
  const prev = new Map();
  const queue = [{ x: startStub.x, y: startStub.y, d: 0, dir: null }];
  dist.set(startKey, 0);

  let reached = false;
  let iterations = 0;
  const maxIterations = 500;

  while (queue.length > 0 && iterations < maxIterations) {
    iterations++;
    queue.sort((a, b) => a.d - b.d);
    const curr = queue.shift();
    const currKey = `${Math.round(curr.x)},${Math.round(curr.y)}`;

    if (Math.abs(curr.x - endStub.x) < 1 && Math.abs(curr.y - endStub.y) < 1) {
      reached = true;
      break;
    }

    if (curr.d > (dist.get(currKey) ?? Infinity)) continue;

    const xIdx = xs.findIndex(val => Math.abs(val - curr.x) < 1);
    const neighbors = [];
    if (xIdx > 0) neighbors.push({ x: xs[xIdx - 1], y: curr.y, dir: 'H' });
    if (xIdx >= 0 && xIdx < xs.length - 1) neighbors.push({ x: xs[xIdx + 1], y: curr.y, dir: 'H' });

    const yIdx = ys.findIndex(val => Math.abs(val - curr.y) < 1);
    if (yIdx > 0) neighbors.push({ x: curr.x, y: ys[yIdx - 1], dir: 'V' });
    if (yIdx >= 0 && yIdx < ys.length - 1) neighbors.push({ x: curr.x, y: ys[yIdx + 1], dir: 'V' });

    for (const nb of neighbors) {
      const p1 = { x: curr.x, y: curr.y };
      const p2 = { x: nb.x, y: nb.y };
      const isExit = Math.abs(curr.x - startStub.x) < 1 && Math.abs(curr.y - startStub.y) < 1;
      const isEntry = Math.abs(nb.x - endStub.x) < 1 && Math.abs(nb.y - endStub.y) < 1;

      if (isBlocked(p1, p2, isExit, isEntry)) continue;

      const segLen = Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
      const bendCost = (curr.dir && curr.dir !== nb.dir) ? 35 : 0;
      const newDist = curr.d + segLen + bendCost;
      const nbKey = `${Math.round(nb.x)},${Math.round(nb.y)}`;

      if (newDist < (dist.get(nbKey) ?? Infinity)) {
        dist.set(nbKey, newDist);
        prev.set(nbKey, { x: curr.x, y: curr.y });
        queue.push({ x: nb.x, y: nb.y, d: newDist, dir: nb.dir });
      }
    }
  }

  if (!reached) return null;

  const pts = [{ x: endStub.x, y: endStub.y }];
  let k = endKey;
  while (prev.has(k)) {
    const p = prev.get(k);
    pts.unshift(p);
    k = `${Math.round(p.x)},${Math.round(p.y)}`;
  }

  const simplified = [start];
  for (let i = 0; i < pts.length; i++) {
    const last = simplified[simplified.length - 1];
    const curr = pts[i];
    const next = (i < pts.length - 1) ? pts[i + 1] : end;
    if ((Math.abs(last.x - curr.x) < 0.5 && Math.abs(curr.x - next.x) < 0.5) ||
        (Math.abs(last.y - curr.y) < 0.5 && Math.abs(curr.y - next.y) < 0.5)) {
      continue;
    }
    simplified.push(curr);
  }
  simplified.push(end);
  return simplified;
}

export function simplifyWaypoints(pts) {
  if (!pts || pts.length <= 2) return pts || [];
  const res = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = res[res.length - 1];
    const curr = pts[i];
    const next = pts[i + 1];
    if ((Math.abs(prev.x - curr.x) < 0.5 && Math.abs(curr.x - next.x) < 0.5) ||
        (Math.abs(prev.y - curr.y) < 0.5 && Math.abs(curr.y - next.y) < 0.5)) {
      continue;
    }
    res.push(curr);
  }
  res.push(pts[pts.length - 1]);
  return res;
}

export function calculateRelationshipsWithCoords({
  tables = [],
  relationships = [],
  tableDisplayMode = 'all',
  showOptionalRelationships = true,
  lineStyle = 'orthogonal',
  selectedRelId = null
}) {
  if (!tables || !relationships) return [];

  const rowHeight = 33;

  const tableBounds = tables.map(t => {
    const { width: tWidth, headerHeight: tHeaderHeight } = getTableDimensions(t);
    let colCount = t.columns ? t.columns.length : 1;
    if (tableDisplayMode === 'tables') {
      colCount = 0;
    } else if (tableDisplayMode === 'keys') {
      const keys = (t.columns || []).filter(c => c.isPk || c.pk || c.isFk || c.fk || c.isUnique || c.unique);
      colCount = keys.length === 0 ? 1 : keys.length;
    }
    const h = tHeaderHeight + colCount * rowHeight + 28;
    return {
      id: t.id,
      name: (t.name || '').toLowerCase(),
      left: t.x,
      right: t.x + tWidth,
      top: t.y,
      bottom: t.y + h,
      width: tWidth,
      headerHeight: tHeaderHeight
    };
  });

  const visibleRels = relationships.filter(r => {
    if (!showOptionalRelationships) {
      return !isOptionalRelationship(r, tables);
    }
    return true;
  });

  const pairCounts = {};
  visibleRels.forEach(r => {
    const t1 = (r.fromTable || '').toLowerCase();
    const t2 = (r.toTable || '').toLowerCase();
    const pairKey = t1 < t2 ? `${t1}<->${t2}` : `${t2}<->${t1}`;
    pairCounts[pairKey] = (pairCounts[pairKey] || 0) + 1;
  });
  const pairSeen = {};

  const PAD = 10;
  const paddedObstacles = tableBounds.map(t => ({
    id: t.id,
    left: t.left - PAD,
    right: t.right + PAD,
    top: t.top - PAD,
    bottom: t.bottom + PAD
  }));

  const STUB = 22;

  return visibleRels.map(rel => {
    const fromTbl = tables.find(t => (t.name || '').toLowerCase() === (rel.fromTable || '').toLowerCase());
    const toTbl = tables.find(t => (t.name || '').toLowerCase() === (rel.toTable || '').toLowerCase());

    if (!fromTbl || !toTbl) return null;

    const fromDims = getTableDimensions(fromTbl);
    const toDims = getTableDimensions(toTbl);

    let y1 = fromTbl.y + (fromDims.headerHeight / 2);
    let y2 = toTbl.y + (toDims.headerHeight / 2);

    if (tableDisplayMode === 'tables') {
      y1 = fromTbl.y + (fromDims.headerHeight / 2);
      y2 = toTbl.y + (toDims.headerHeight / 2);
    } else if (tableDisplayMode === 'keys') {
      const fromKeys = (fromTbl.columns || []).filter(c => c.isPk || c.pk || c.isFk || c.fk || c.isUnique || c.unique);
      const toKeys = (toTbl.columns || []).filter(c => c.isPk || c.pk || c.isFk || c.fk || c.isUnique || c.unique);

      const fromKeyIdx = rel.fromColumn
        ? fromKeys.findIndex(c => (c.name || '').toLowerCase() === rel.fromColumn.toLowerCase())
        : -1;
      const toKeyIdx = rel.toColumn
        ? toKeys.findIndex(c => (c.name || '').toLowerCase() === rel.toColumn.toLowerCase())
        : -1;

      y1 = fromKeyIdx >= 0
        ? fromTbl.y + fromDims.headerHeight + (fromKeyIdx * rowHeight) + (rowHeight / 2)
        : fromTbl.y + (fromDims.headerHeight / 2);

      y2 = toKeyIdx >= 0
        ? toTbl.y + toDims.headerHeight + (toKeyIdx * rowHeight) + (rowHeight / 2)
        : toTbl.y + (toDims.headerHeight / 2);
    } else {
      let fromColIdx = -1;
      if (rel.fromColumn && fromTbl.columns) {
        fromColIdx = fromTbl.columns.findIndex(c => (c.name || '').toLowerCase() === rel.fromColumn.toLowerCase());
      }

      let toColIdx = -1;
      if (rel.toColumn && toTbl.columns) {
        toColIdx = toTbl.columns.findIndex(c => (c.name || '').toLowerCase() === rel.toColumn.toLowerCase());
      }

      y1 = fromColIdx >= 0
        ? fromTbl.y + fromDims.headerHeight + (fromColIdx * rowHeight) + (rowHeight / 2)
        : fromTbl.y + fromDims.headerHeight + 16;

      y2 = toColIdx >= 0
        ? toTbl.y + toDims.headerHeight + (toColIdx * rowHeight) + (rowHeight / 2)
        : toTbl.y + toDims.headerHeight + 16;
    }

    const isOptional = isOptionalRelationship(rel, tables);

    const t1 = (rel.fromTable || '').toLowerCase();
    const t2 = (rel.toTable || '').toLowerCase();
    const pairKey = t1 < t2 ? `${t1}<->${t2}` : `${t2}<->${t1}`;
    const totalInPair = pairCounts[pairKey] || 1;
    const pairIdx = pairSeen[pairKey] || 0;
    pairSeen[pairKey] = pairIdx + 1;
    const lineShift = totalInPair > 1 ? (pairIdx - (totalInPair - 1) / 2) * 20 : 0;

    // Self-referencing relationship
    if (fromTbl.id === toTbl.id) {
      const x1 = fromTbl.x + fromDims.width;
      const x2 = fromTbl.x + fromDims.width;
      const y2Offset = Math.abs(y1 - y2) < 10 ? y1 + 36 : y2;

      let pathD = '';
      if (lineStyle === 'orthogonal') {
        const waypoints = [
          { x: x1, y: y1 },
          { x: x1 + 55 + Math.abs(lineShift), y: y1 },
          { x: x1 + 55 + Math.abs(lineShift), y: y2Offset },
          { x: x2, y: y2Offset }
        ];
        pathD = createRoundedPath(waypoints, 10);
      } else {
        const stub = 65 + Math.abs(lineShift);
        pathD = `M ${x1} ${y1} C ${x1 + stub} ${y1}, ${x2 + stub} ${y2Offset}, ${x2} ${y2Offset}`;
      }

      const midX = x1 + 55 + Math.abs(lineShift);
      const midY = (y1 + y2Offset) / 2;

      const cardStr = rel.cardinality || '1:N';
      const parts = cardStr.split(':');
      let fromLabel = parts[0]?.trim() || '1';
      let toLabel = parts[1]?.trim() || 'N';
      if (isOptional) {
        if (fromLabel === 'N' || fromLabel === 'M' || fromLabel === '*') fromLabel = '0..N';
        else if (toLabel === 'N' || toLabel === 'M' || toLabel === '*') toLabel = '0..N';
      }

      const displayCardinality = isOptional ? (cardStr === '1:1' ? '1 : 0..1' : '1 : 0..N') : cardStr;
      const pillWidth = isOptional ? 76 : 54;
      const hoverInfo = isOptional
        ? `${rel.fromTable}.${rel.fromColumn} >? ${rel.toTable}.${rel.toColumn} (optional)`
        : `${rel.fromTable}.${rel.fromColumn} → ${rel.toTable}.${rel.toColumn}`;
      const hoverWidth = Math.max(140, hoverInfo.length * 7 + 28);

      return {
        ...rel,
        isOptional,
        pathD,
        x1, y1,
        x2, y2: y2Offset,
        midX, midY,
        fromBadgeX: x1 + 16,
        fromBadgeY: y1 - 10,
        toBadgeX: x2 + 16,
        toBadgeY: y2Offset + 10,
        fromLabel,
        toLabel,
        fromLabelWidth: fromLabel.length > 2 ? 34 : 22,
        toLabelWidth: toLabel.length > 2 ? 34 : 22,
        displayCardinality,
        pillWidth,
        hoverInfo,
        hoverWidth,
        isSelected: selectedRelId === rel.id
      };
    }

    const fromRight = fromTbl.x + fromDims.width;
    const fromLeft = fromTbl.x;
    const toRight = toTbl.x + toDims.width;
    const toLeft = toTbl.x;

    function segmentCollides(p1, p2, isExitStub = false, isEntryStub = false) {
      if (Math.abs(p1.x - p2.x) < 0.5) {
        const x = p1.x;
        const minY = Math.min(p1.y, p2.y);
        const maxY = Math.max(p1.y, p2.y);
        for (let i = 0; i < paddedObstacles.length; i++) {
          const obs = paddedObstacles[i];
          if (isExitStub && obs.id === fromTbl.id) continue;
          if (isEntryStub && obs.id === toTbl.id) continue;
          if (x >= obs.left && x <= obs.right && maxY >= obs.top && minY <= obs.bottom) {
            return true;
          }
        }
      } else if (Math.abs(p1.y - p2.y) < 0.5) {
        const y = p1.y;
        const minX = Math.min(p1.x, p2.x);
        const maxX = Math.max(p1.x, p2.x);
        for (let i = 0; i < paddedObstacles.length; i++) {
          const obs = paddedObstacles[i];
          if (isExitStub && obs.id === fromTbl.id) continue;
          if (isEntryStub && obs.id === toTbl.id) continue;
          if (y >= obs.top && y <= obs.bottom && maxX >= obs.left && minX <= obs.right) {
            return true;
          }
        }
      }
      return false;
    }

    const portOptions = [];
    if (fromRight + 15 <= toLeft) {
      portOptions.push({ fromSide: 'right', toSide: 'left', x1: fromRight, x2: toLeft });
      portOptions.push({ fromSide: 'right', toSide: 'right', x1: fromRight, x2: toRight });
      portOptions.push({ fromSide: 'left', toSide: 'left', x1: fromLeft, x2: toLeft });
      portOptions.push({ fromSide: 'left', toSide: 'right', x1: fromLeft, x2: toRight });
    } else if (toRight + 15 <= fromLeft) {
      portOptions.push({ fromSide: 'left', toSide: 'right', x1: fromLeft, x2: toRight });
      portOptions.push({ fromSide: 'left', toSide: 'left', x1: fromLeft, x2: toLeft });
      portOptions.push({ fromSide: 'right', toSide: 'right', x1: fromRight, x2: toRight });
      portOptions.push({ fromSide: 'right', toSide: 'left', x1: fromRight, x2: toLeft });
    } else {
      if (fromTbl.x <= toTbl.x) {
        portOptions.push({ fromSide: 'right', toSide: 'right', x1: fromRight, x2: toRight });
        portOptions.push({ fromSide: 'left', toSide: 'left', x1: fromLeft, x2: toLeft });
        portOptions.push({ fromSide: 'right', toSide: 'left', x1: fromRight, x2: toLeft });
        portOptions.push({ fromSide: 'left', toSide: 'right', x1: fromLeft, x2: toRight });
      } else {
        portOptions.push({ fromSide: 'left', toSide: 'left', x1: fromLeft, x2: toLeft });
        portOptions.push({ fromSide: 'right', toSide: 'right', x1: fromRight, x2: toRight });
        portOptions.push({ fromSide: 'left', toSide: 'right', x1: fromLeft, x2: toRight });
        portOptions.push({ fromSide: 'right', toSide: 'left', x1: fromRight, x2: toLeft });
      }
    }

    const gapXs = new Set();
    const gapYs = new Set();

    for (let i = 0; i < tableBounds.length; i++) {
      const tb1 = tableBounds[i];
      gapXs.add(tb1.left - 24);
      gapXs.add(tb1.right + 24);
      gapYs.add(tb1.top - 24);
      gapYs.add(tb1.bottom + 24);

      for (let j = i + 1; j < tableBounds.length; j++) {
        const tb2 = tableBounds[j];
        const leftT = tb1.left < tb2.left ? tb1 : tb2;
        const rightT = tb1.left < tb2.left ? tb2 : tb1;
        if (leftT.right < rightT.left) {
          gapXs.add(Math.round((leftT.right + rightT.left) / 2));
        }

        const topT = tb1.top < tb2.top ? tb1 : tb2;
        const botT = tb1.top < tb2.top ? tb2 : tb1;
        if (topT.bottom < botT.top) {
          gapYs.add(Math.round((topT.bottom + botT.top) / 2));
        }
      }
    }

    const minObsX = Math.min(...tableBounds.map(t => t.left));
    const maxObsX = Math.max(...tableBounds.map(t => t.right));
    const minObsY = Math.min(...tableBounds.map(t => t.top));
    const maxObsY = Math.max(...tableBounds.map(t => t.bottom));

    gapXs.add(minObsX - 45);
    gapXs.add(maxObsX + 45);
    gapYs.add(minObsY - 40);
    gapYs.add(maxObsY + 40);

    let chosenRoute = null;

    for (const port of portOptions) {
      const { fromSide: fSide, toSide: tSide, x1: px1, x2: px2 } = port;
      const start = { x: px1, y: y1 };
      const end = { x: px2, y: y2 };
      const startStub = { x: fSide === 'right' ? px1 + STUB : px1 - STUB, y: y1 };
      const endStub = { x: tSide === 'right' ? px2 + STUB : px2 - STUB, y: y2 };

      const candXs = [];
      if (fSide !== tSide) {
        candXs.push(Math.round((startStub.x + endStub.x) / 2) + lineShift);
      } else if (fSide === 'right') {
        candXs.push(Math.max(startStub.x, endStub.x) + 16 + lineShift);
      } else {
        candXs.push(Math.min(startStub.x, endStub.x) - 16 + lineShift);
      }

      const sortedGapXs = Array.from(gapXs).sort((a, b) => {
        const mid = (startStub.x + endStub.x) / 2;
        return Math.abs(a - mid) - Math.abs(b - mid);
      });
      for (const gx of sortedGapXs) {
        candXs.push(gx + lineShift);
      }

      for (const cx of candXs) {
        if (fSide === 'right' && cx < startStub.x - 0.5) continue;
        if (fSide === 'left' && cx > startStub.x + 0.5) continue;
        if (tSide === 'right' && cx < endStub.x - 0.5) continue;
        if (tSide === 'left' && cx > endStub.x + 0.5) continue;

        const pts = [
          start,
          startStub,
          { x: cx, y: startStub.y },
          { x: cx, y: endStub.y },
          endStub,
          end
        ];
        let clear = true;
        for (let i = 0; i < pts.length - 1; i++) {
          if (segmentCollides(pts[i], pts[i + 1], i === 0, i === pts.length - 2)) {
            clear = false;
            break;
          }
        }
        if (clear) {
          chosenRoute = { waypoints: simplifyWaypoints(pts), fromSide: fSide, toSide: tSide, x1: px1, x2: px2 };
          break;
        }
      }
      if (chosenRoute) break;

      const sortedGapYs = Array.from(gapYs).sort((a, b) => {
        const mid = (y1 + y2) / 2;
        return Math.abs(a - mid) - Math.abs(b - mid);
      });

      for (const by of sortedGapYs) {
        const pts = [
          start,
          startStub,
          { x: startStub.x, y: by },
          { x: endStub.x, y: by },
          endStub,
          end
        ];
        let clear = true;
        for (let i = 0; i < pts.length - 1; i++) {
          if (segmentCollides(pts[i], pts[i + 1], i === 0, i === pts.length - 2)) {
            clear = false;
            break;
          }
        }
        if (clear) {
          chosenRoute = { waypoints: simplifyWaypoints(pts), fromSide: fSide, toSide: tSide, x1: px1, x2: px2 };
          break;
        }
      }
      if (chosenRoute) break;
    }

    if (!chosenRoute) {
      for (const port of portOptions) {
        const { fromSide: fSide, toSide: tSide, x1: px1, x2: px2 } = port;
        const start = { x: px1, y: y1 };
        const end = { x: px2, y: y2 };
        const startStub = { x: fSide === 'right' ? px1 + STUB : px1 - STUB, y: y1 };
        const endStub = { x: tSide === 'right' ? px2 + STUB : px2 - STUB, y: y2 };

        const candXs = Array.from(gapXs);
        const candYs = Array.from(gapYs);

        const routePts = findChannelGraphRoute(
          start, startStub, endStub, end, candXs, candYs,
          (p1, p2, isExit, isEntry) => segmentCollides(p1, p2, isExit, isEntry)
        );

        if (routePts) {
          chosenRoute = { waypoints: routePts, fromSide: fSide, toSide: tSide, x1: px1, x2: px2 };
          break;
        }
      }
    }

    if (!chosenRoute) {
      const p0 = portOptions[0];
      const start = { x: p0.x1, y: y1 };
      const end = { x: p0.x2, y: y2 };
      const startStub = { x: p0.fromSide === 'right' ? p0.x1 + STUB : p0.x1 - STUB, y: y1 };
      const endStub = { x: p0.toSide === 'right' ? p0.x2 + STUB : p0.x2 - STUB, y: y2 };

      const outerY = (y1 + y2) / 2 < (minObsY + maxObsY) / 2
        ? minObsY - 45 - Math.abs(lineShift)
        : maxObsY + 45 + Math.abs(lineShift);

      chosenRoute = {
        waypoints: simplifyWaypoints([
          start,
          startStub,
          { x: startStub.x, y: outerY },
          { x: endStub.x, y: outerY },
          endStub,
          end
        ]),
        fromSide: p0.fromSide,
        toSide: p0.toSide,
        x1: p0.x1,
        x2: p0.x2
      };
    }

    const { waypoints, fromSide, toSide, x1, x2 } = chosenRoute;

    const pathMid = getPathMidpoint(waypoints);
    let midX = pathMid.x;
    let midY = pathMid.y;

    let pathD = '';
    if (lineStyle === 'orthogonal') {
      pathD = createRoundedPath(waypoints, 10);
    } else {
      if (waypoints.length === 4 && Math.abs(waypoints[1].x - waypoints[2].x) < 1) {
        const p0 = waypoints[0];
        const p1 = waypoints[1];
        const p2 = waypoints[2];
        const p3 = waypoints[3];
        pathD = `M ${p0.x.toFixed(1)} ${p0.y.toFixed(1)} C ${p1.x.toFixed(1)} ${p0.y.toFixed(1)}, ${p2.x.toFixed(1)} ${p3.y.toFixed(1)}, ${p3.x.toFixed(1)} ${p3.y.toFixed(1)}`;
      } else {
        pathD = createRoundedPath(waypoints, 16);
      }
    }

    const fromBadgeX = fromSide === 'right' ? x1 + 16 : x1 - 16;
    const fromBadgeY = y1 - 8;
    const toBadgeX = toSide === 'right' ? x2 + 16 : x2 - 16;
    const toBadgeY = y2 - 8;

    const cardStr = rel.cardinality || '1:N';
    const parts = cardStr.split(':');
    let fromLabel = parts[0]?.trim() || '1';
    let toLabel = parts[1]?.trim() || 'N';

    if (isOptional) {
      if (fromLabel === 'N' || fromLabel === 'M' || fromLabel === '*') {
        fromLabel = '0..N';
      } else if (toLabel === 'N' || toLabel === 'M' || toLabel === '*') {
        toLabel = '0..N';
      } else if (cardStr === '1:1') {
        fromLabel = '0..1';
      } else {
        fromLabel = '0..N';
      }
    }

    const fromLabelWidth = fromLabel.length > 2 ? 34 : 22;
    const toLabelWidth = toLabel.length > 2 ? 34 : 22;

    const displayCardinality = isOptional
      ? (cardStr === '1:1' ? '1 : 0..1' : '1 : 0..N')
      : cardStr;
    const pillWidth = isOptional ? 76 : 54;

    const hoverInfo = isOptional
      ? `${rel.fromTable}.${rel.fromColumn} >? ${rel.toTable}.${rel.toColumn} (optional)`
      : `${rel.fromTable}.${rel.fromColumn} → ${rel.toTable}.${rel.toColumn}`;
    const hoverWidth = Math.max(140, hoverInfo.length * 7 + 28);

    return {
      ...rel,
      isOptional,
      pathD,
      x1, y1,
      x2, y2,
      midX, midY,
      fromBadgeX,
      fromBadgeY,
      toBadgeX,
      toBadgeY,
      fromLabel,
      toLabel,
      fromLabelWidth,
      toLabelWidth,
      displayCardinality,
      pillWidth,
      hoverInfo,
      hoverWidth,
      isSelected: selectedRelId === rel.id
    };
  }).filter(Boolean);
}
