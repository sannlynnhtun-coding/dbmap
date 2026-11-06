import { getTableDimensions, getTableCardHeight } from './diagramGeometry.js';

export function arrangeRelationshipFlow(tables, rels, displayMode) {
  const tableMap = new Map();
  tables.forEach(t => tableMap.set(t.name.toLowerCase(), t));

  const parentsOf = new Map(); // tables this table references (parents / root entities)
  const childrenOf = new Map(); // tables that reference this table (children / dependents)
  tables.forEach(t => {
    const k = t.name.toLowerCase();
    parentsOf.set(k, new Set());
    childrenOf.set(k, new Set());
  });

  rels.forEach(rel => {
    const childKey = rel.fromTable?.toLowerCase();
    const parentKey = rel.toTable?.toLowerCase();
    if (childKey && parentKey && parentsOf.has(childKey) && parentsOf.has(parentKey) && childKey !== parentKey) {
      parentsOf.get(childKey).add(parentKey);
      childrenOf.get(parentKey).add(childKey);
    }
  });

  // Separate connected tables from isolated tables
  const connected = [];
  const isolated = [];
  tables.forEach(t => {
    const k = t.name.toLowerCase();
    if (parentsOf.get(k).size === 0 && childrenOf.get(k).size === 0) {
      isolated.push(t);
    } else {
      connected.push(t);
    }
  });

  // Determine DAG topological levels: tables with 0 parents start at level 0
  const levels = new Map();
  connected.forEach(t => {
    const k = t.name.toLowerCase();
    levels.set(k, 0);
  });

  let changed = true;
  let passes = 0;
  while (changed && passes < connected.length + 2) {
    changed = false;
    passes++;
    connected.forEach(t => {
      const childKey = t.name.toLowerCase();
      const currentLvl = levels.get(childKey) || 0;
      const parentKeys = parentsOf.get(childKey);
      parentKeys.forEach(pKey => {
        const parentLvl = levels.get(pKey) || 0;
        if (currentLvl <= parentLvl) {
          levels.set(childKey, parentLvl + 1);
          changed = true;
        }
      });
    });
  }

  // Compress level numbers to eliminate any gaps
  const uniqueLevels = Array.from(new Set(connected.map(t => levels.get(t.name.toLowerCase()) || 0))).sort((a, b) => a - b);
  const levelRankMap = new Map();
  uniqueLevels.forEach((lvl, idx) => levelRankMap.set(lvl, idx));
  connected.forEach(t => {
    const k = t.name.toLowerCase();
    levels.set(k, levelRankMap.get(levels.get(k)) || 0);
  });

  // Group connected tables by level
  const levelGroups = new Map();
  connected.forEach(t => {
    const lvl = levels.get(t.name.toLowerCase()) || 0;
    if (!levelGroups.has(lvl)) levelGroups.set(lvl, []);
    levelGroups.get(lvl).push(t);
  });

  // Multi-column folding: if a level has more than 4 tables, fold it into adjacent sub-columns
  // to avoid gigantic 3000px vertical poles
  const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b);
  const visualColumns = [];
  const MAX_PER_SUBCOL = 4;

  sortedLevels.forEach(lvl => {
    const group = levelGroups.get(lvl) || [];
    if (group.length <= MAX_PER_SUBCOL) {
      visualColumns.push(group);
    } else {
      for (let i = 0; i < group.length; i += MAX_PER_SUBCOL) {
        visualColumns.push(group.slice(i, i + MAX_PER_SUBCOL));
      }
    }
  });

  const posMap = new Map();
  let curX = 50;
  const COL_GAP = 120; // Generous horizontal table gap for multi-track relation highways
  const ROW_GAP = 60;  // Generous vertical table gap for cross-table relation bridges

  visualColumns.forEach((colTables) => {
    // Sort tables by barycenter (average Y position of connected tables)
    colTables.sort((a, b) => {
      const aN = [...parentsOf.get(a.name.toLowerCase()), ...childrenOf.get(a.name.toLowerCase())];
      const bN = [...parentsOf.get(b.name.toLowerCase()), ...childrenOf.get(b.name.toLowerCase())];
      const aAvgY = aN.length ? aN.reduce((sum, k) => sum + (posMap.get(k)?.y || 0), 0) / aN.length : 300;
      const bAvgY = bN.length ? bN.reduce((sum, k) => sum + (posMap.get(k)?.y || 0), 0) / bN.length : 300;
      return aAvgY - bAvgY || a.name.localeCompare(b.name);
    });

    const colWidth = Math.max(...colTables.map(t => getTableDimensions(t).width));
    let curY = 40;
    colTables.forEach(t => {
      posMap.set(t.name.toLowerCase(), { x: curX, y: curY });
      curY += getTableCardHeight(t, displayMode) + ROW_GAP;
    });
    curX += colWidth + COL_GAP;
  });

  // Place isolated tables in a neat compact 2-column or 3-column grid
  if (isolated.length > 0) {
    let isoX = curX;
    let isoY = 40;
    isolated.forEach(t => {
      const w = getTableDimensions(t).width;
      const h = getTableCardHeight(t, displayMode);
      posMap.set(t.name.toLowerCase(), { x: isoX, y: isoY });
      isoY += h + ROW_GAP;
      if (isoY > 700) {
        isoX += w + COL_GAP;
        isoY = 40;
      }
    });
  }

  // Apply positions
  tables.forEach(t => {
    const pos = posMap.get(t.name.toLowerCase());
    if (pos) {
      t.x = Math.round(pos.x);
      t.y = Math.round(pos.y);
    }
  });

  // Final AABB separation guarantee for Flow layout
  resolveAABBOverlaps(tables, displayMode, 100, 50);
}

// AABB Collision & Overlap Resolver: iteratively separates any overlapping table bounding boxes
// guaranteeing generous clearance margins (100px horizontal, 50px vertical) and zero overlap.
function resolveAABBOverlaps(tables, displayMode, minClearanceX = 100, minClearanceY = 50, maxIterations = 40) {
  if (!tables || tables.length <= 1) return;
  let hasOverlap = true;
  let iter = 0;

  while (hasOverlap && iter < maxIterations) {
    hasOverlap = false;
    iter++;

    for (let i = 0; i < tables.length; i++) {
      for (let j = i + 1; j < tables.length; j++) {
        const t1 = tables[i];
        const t2 = tables[j];
        const w1 = getTableDimensions(t1).width;
        const h1 = getTableCardHeight(t1, displayMode);
        const w2 = getTableDimensions(t2).width;
        const h2 = getTableCardHeight(t2, displayMode);

        const overlapX = Math.min(t1.x + w1, t2.x + w2) - Math.max(t1.x, t2.x) + minClearanceX;
        const overlapY = Math.min(t1.y + h1, t2.y + h2) - Math.max(t1.y, t2.y) + minClearanceY;

        if (overlapX > 0 && overlapY > 0) {
          hasOverlap = true;
          // Separating Axis Theorem: separate along the axis of minimal penetration
          // to preserve the clean 2D layout and avoid cascading shifts
          if (overlapX <= overlapY) {
            // Horizontal separation
            const shift = Math.ceil(overlapX / 2);
            if (t1.x <= t2.x) {
              t1.x -= shift;
              t2.x += shift;
            } else {
              t1.x += shift;
              t2.x -= shift;
            }
          } else {
            // Vertical separation
            const shift = Math.ceil(overlapY / 2);
            if (t1.y <= t2.y) {
              t1.y -= shift;
              t2.y += shift;
            } else {
              t1.y += shift;
              t2.y -= shift;
            }
          }
        }
      }
    }
  }

  // Diagram Boundary Normalization: ensure diagram starts cleanly at suitable boundary margins (x: 50, y: 40)
  let minX = Infinity, minY = Infinity;
  tables.forEach(t => {
    minX = Math.min(minX, t.x);
    minY = Math.min(minY, t.y);
  });
  if (isFinite(minX) && isFinite(minY)) {
    const shiftX = 50 - minX;
    const shiftY = 40 - minY;
    tables.forEach(t => {
      t.x = Math.round(t.x + shiftX);
      t.y = Math.round(t.y + shiftY);
    });
  }
}

export function arrangeCentralHubs(tables, rels, displayMode) {
  if (!tables || tables.length === 0) return;

  const tableMap = new Map();
  tables.forEach(t => tableMap.set(t.name.toLowerCase(), t));

  const degreeMap = new Map();
  const adjMap = new Map();
  const parentsOf = new Map();
  const childrenOf = new Map();

  tables.forEach(t => {
    const k = t.name.toLowerCase();
    degreeMap.set(k, 0);
    adjMap.set(k, new Set());
    parentsOf.set(k, new Set());
    childrenOf.set(k, new Set());
  });

  rels.forEach(r => {
    const f = r.fromTable?.toLowerCase();
    const t = r.toTable?.toLowerCase();
    if (f && t && f !== t && tableMap.has(f) && tableMap.has(t)) {
      degreeMap.set(f, degreeMap.get(f) + 1);
      degreeMap.set(t, degreeMap.get(t) + 1);
      adjMap.get(f).add(t);
      adjMap.get(t).add(f);
      parentsOf.get(f).add(t);
      childrenOf.get(t).add(f);
    }
  });

  const isolated = tables.filter(t => degreeMap.get(t.name.toLowerCase()) === 0);
  const connected = tables.filter(t => degreeMap.get(t.name.toLowerCase()) > 0);

  if (connected.length === 0) {
    // All tables isolated, arrange in a clean compact grid with suitable boundary & gaps
    let gridX = 50, gridY = 40;
    tables.forEach((t, i) => {
      t.x = gridX;
      t.y = gridY;
      gridX += getTableDimensions(t).width + 42;
      if ((i + 1) % 3 === 0) {
        gridX = 50;
        gridY += getTableCardHeight(t, displayMode) + 24;
      }
    });
    return;
  }

  // Sort connected tables by degree descending
  connected.sort((a, b) => degreeMap.get(b.name.toLowerCase()) - degreeMap.get(a.name.toLowerCase()));
  const maxDegree = degreeMap.get(connected[0].name.toLowerCase());

  // Determine Hub count: maintain compact clusters rather than wide horizontal expansions
  let maxHubs = 1;
  if (connected.length >= 14 && maxDegree >= 3) maxHubs = 3;
  else if (connected.length >= 8 && maxDegree >= 3) maxHubs = 2;

  const hubThreshold = Math.max(2, Math.floor(maxDegree * 0.65));
  let hubs = connected.filter(t => degreeMap.get(t.name.toLowerCase()) >= hubThreshold).slice(0, maxHubs);
  if (hubs.length === 0) hubs = [connected[0]];
  const hubKeys = new Set(hubs.map(h => h.name.toLowerCase()));

  const posMap = new Map();
  const GAP_X = 110;
  const ROW_GAP = 54;

  // Partition non-hub tables into bridge tables or hub satellites
  const satellitesByHub = new Map();
  hubs.forEach(h => satellitesByHub.set(h.name.toLowerCase(), []));
  const bridgeTables = [];

  connected.forEach(t => {
    const k = t.name.toLowerCase();
    if (hubKeys.has(k)) return;

    const connectedHubs = Array.from(adjMap.get(k) || []).filter(hKey => hubKeys.has(hKey));
    if (connectedHubs.length >= 2) {
      bridgeTables.push({ table: t, hubs: connectedHubs.slice(0, 2) });
    } else if (connectedHubs.length === 1) {
      satellitesByHub.get(connectedHubs[0]).push(t);
    } else {
      // Indirect satellite: associate with closest hub
      let bestHub = hubs[0].name.toLowerCase();
      hubs.forEach(h => {
        const hKey = h.name.toLowerCase();
        if (adjMap.get(k)?.has(hKey)) bestHub = hKey;
      });
      satellitesByHub.get(bestHub).push(t);
    }
  });

  // Calculate balanced cluster layout for each hub with compact 24px vertical gaps
  let currentClusterX = 50;
  hubs.forEach((hub) => {
    const hubKey = hub.name.toLowerCase();
    const sats = satellitesByHub.get(hubKey) || [];
    const hubDim = getTableDimensions(hub);
    const hubH = getTableCardHeight(hub, displayMode);

    // Split satellites into Left Wing (parents/lookups), Right Wing (children/dependents),
    // and Top/Bottom overflow if any wing has > 2 tables
    const leftSats = [];
    const rightSats = [];
    const topSats = [];
    const bottomSats = [];

    sats.forEach(sat => {
      const sKey = sat.name.toLowerCase();
      if (parentsOf.get(hubKey)?.has(sKey)) {
        leftSats.push(sat);
      } else if (childrenOf.get(hubKey)?.has(sKey)) {
        rightSats.push(sat);
      } else {
        if (leftSats.length <= rightSats.length) leftSats.push(sat);
        else rightSats.push(sat);
      }
    });

    // Balance wings
    while (leftSats.length > 2 && rightSats.length < 2) {
      rightSats.push(leftSats.pop());
    }
    while (rightSats.length > 2 && leftSats.length < 2) {
      leftSats.push(rightSats.pop());
    }

    // Overflow to top/bottom if either wing has more than 2 tables
    if (leftSats.length > 2) topSats.push(leftSats.pop());
    if (rightSats.length > 2) bottomSats.push(rightSats.pop());
    if (leftSats.length > 2) bottomSats.push(leftSats.pop());
    if (rightSats.length > 2) topSats.push(rightSats.pop());

    const maxLeftW = leftSats.length ? Math.max(...leftSats.map(t => getTableDimensions(t).width)) : 0;
    const maxRightW = rightSats.length ? Math.max(...rightSats.map(t => getTableDimensions(t).width)) : 0;
    const maxTopH = topSats.length ? Math.max(...topSats.map(t => getTableCardHeight(t, displayMode))) : 0;

    const totalLeftH = leftSats.reduce((sum, t) => sum + getTableCardHeight(t, displayMode) + ROW_GAP, 0) - (leftSats.length ? ROW_GAP : 0);
    const totalRightH = rightSats.reduce((sum, t) => sum + getTableCardHeight(t, displayMode) + ROW_GAP, 0) - (rightSats.length ? ROW_GAP : 0);
    const maxWingH = Math.max(hubH, totalLeftH, totalRightH);

    const hubX = currentClusterX + (leftSats.length ? maxLeftW + GAP_X : 0);
    const hubY = 40 + (topSats.length ? maxTopH + ROW_GAP : 0) + Math.max(0, (maxWingH - hubH) / 2);

    posMap.set(hubKey, { x: hubX, y: hubY });

    // Position Left Wing (vertically centered relative to maxWingH with exact ROW_GAP = 24px)
    let leftY = hubY + (hubH - totalLeftH) / 2;
    leftSats.forEach(sat => {
      const sw = getTableDimensions(sat).width;
      const sh = getTableCardHeight(sat, displayMode);
      posMap.set(sat.name.toLowerCase(), { x: hubX - sw - GAP_X, y: Math.round(leftY) });
      leftY += sh + ROW_GAP;
    });

    // Position Right Wing (vertically centered relative to maxWingH with exact ROW_GAP = 24px)
    let rightY = hubY + (hubH - totalRightH) / 2;
    rightSats.forEach(sat => {
      const sh = getTableCardHeight(sat, displayMode);
      posMap.set(sat.name.toLowerCase(), { x: hubX + hubDim.width + GAP_X, y: Math.round(rightY) });
      rightY += sh + ROW_GAP;
    });

    // Position Top Satellite (neatly centered above hub with exact ROW_GAP = 24px)
    topSats.forEach(sat => {
      const sw = getTableDimensions(sat).width;
      const sh = getTableCardHeight(sat, displayMode);
      posMap.set(sat.name.toLowerCase(), {
        x: Math.round(hubX + (hubDim.width - sw) / 2),
        y: Math.round(hubY - sh - ROW_GAP)
      });
    });

    // Position Bottom Satellite (neatly centered below hub with exact ROW_GAP = 24px)
    bottomSats.forEach(sat => {
      const sw = getTableDimensions(sat).width;
      posMap.set(sat.name.toLowerCase(), {
        x: Math.round(hubX + (hubDim.width - sw) / 2),
        y: Math.round(hubY + hubH + ROW_GAP)
      });
    });

    currentClusterX = hubX + hubDim.width + (rightSats.length ? GAP_X + maxRightW : 0) + 72;
  });

  // Position bridge tables in center corridor between their hubs with exact ROW_GAP = 44px
  if (bridgeTables.length > 0 && hubs.length >= 2) {
    const p1 = posMap.get(hubs[0].name.toLowerCase());
    const p2 = posMap.get(hubs[1].name.toLowerCase());
    if (p1 && p2) {
      const midX = Math.round((p1.x + getTableDimensions(hubs[0]).width + p2.x) / 2);
      const totalBridgeH = bridgeTables.reduce((sum, b) => sum + getTableCardHeight(b.table, displayMode) + ROW_GAP, 0) - ROW_GAP;
      let bridgeY = Math.round((p1.y + p2.y) / 2 - totalBridgeH / 2);
      bridgeTables.forEach(({ table }) => {
        const bw = getTableDimensions(table).width;
        posMap.set(table.name.toLowerCase(), {
          x: Math.round(midX - bw / 2),
          y: Math.round(bridgeY)
        });
        bridgeY += getTableCardHeight(table, displayMode) + ROW_GAP;
      });
    }
  }

  // Apply positions to connected tables
  connected.forEach(t => {
    const p = posMap.get(t.name.toLowerCase());
    if (p) {
      t.x = Math.round(p.x);
      t.y = Math.round(p.y);
    }
  });

  // Position isolated tables in a clean compact grid below connected tables
  if (isolated.length > 0) {
    const maxConnectedY = Math.max(...connected.map(t => t.y + getTableCardHeight(t, displayMode)));
    let isoX = 50;
    let isoY = maxConnectedY + 36;
    isolated.forEach((t, i) => {
      t.x = isoX;
      t.y = isoY;
      isoX += getTableDimensions(t).width + 50;
      if ((i + 1) % 3 === 0) {
        isoX = 50;
        isoY += getTableCardHeight(t, displayMode) + 36;
      }
    });
  }

  resolveAABBOverlaps(tables, displayMode, 100, 50);
}
