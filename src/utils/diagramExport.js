// Academic & High-Definition Diagram Exporter for dbmaps
// Generates HD PNG, HD JPG, Vector SVG, and Academic Report PDF (A4/Letter)
import { getTableDimensions } from './diagramGeometry.js';
import { calculateRelationshipsWithCoords } from './diagramRouting.js';
import { jsPDF } from 'jspdf';

// Helper to escape XML/SVG special characters
function escapeXml(unsafe) {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Format date for academic header
function formatAcademicDate(d = new Date()) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return d.toLocaleDateString('en-US', options);
}

// Generate pure, standalone, standard Vector SVG XML from project
export function generateDiagramSvg(project, options = {}) {
  const {
    theme = 'light', // 'light' | 'dark' | 'transparent'
    tableDisplayMode = 'all',
    showOptionalRelationships = true,
    lineStyle = 'orthogonal',
    padding = 40
  } = options;

  const tables = project?.tables || [];
  const relationships = project?.relationships || [];

  if (tables.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300">
      <rect width="600" height="300" fill="#f8fafc" rx="12" />
      <text x="300" y="150" font-family="system-ui, sans-serif" font-size="16" fill="#64748b" text-anchor="middle">No tables in schema</text>
    </svg>`;
  }

  // Calculate table dimensions and bounds
  const rowHeight = 33;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  const computedTables = tables.map(t => {
    const { width: tWidth, headerHeight: tHeaderHeight } = getTableDimensions(t);
    let colCount = t.columns ? t.columns.length : 1;
    if (tableDisplayMode === 'tables') {
      colCount = 0;
    } else if (tableDisplayMode === 'keys') {
      const keys = (t.columns || []).filter(c => c.isPk || c.pk || c.isFk || c.fk || c.isUnique || c.unique);
      colCount = keys.length === 0 ? 1 : keys.length;
    }
    const height = tHeaderHeight + colCount * rowHeight + 28;

    if (t.x < minX) minX = t.x;
    if (t.y < minY) minY = t.y;
    if (t.x + tWidth > maxX) maxX = t.x + tWidth;
    if (t.y + height > maxY) maxY = t.y + height;

    return {
      ...t,
      width: tWidth,
      height,
      headerHeight: tHeaderHeight,
      visibleColumns: tableDisplayMode === 'tables'
        ? []
        : tableDisplayMode === 'keys'
          ? (t.columns || []).filter(c => c.isPk || c.pk || c.isFk || c.fk || c.isUnique || c.unique)
          : (t.columns || [])
    };
  });

  const diagramWidth = Math.max(500, Math.round(maxX - minX + padding * 2));
  const diagramHeight = Math.round(maxY - minY + padding * 2);

  const offsetX = Math.round(-minX + padding);
  const offsetY = Math.round(-minY + padding);

  // Compute relationship routes with exact coordinates
  const computedRels = calculateRelationshipsWithCoords({
    tables,
    relationships,
    tableDisplayMode,
    showOptionalRelationships,
    lineStyle
  });

  // Palette definitions
  const isDark = theme === 'dark';
  const isTransparent = theme === 'transparent';

  const bgColor = isDark ? '#090d16' : '#ffffff';
  const canvasBorderColor = isDark ? '#1e293b' : '#e2e8f0';
  const tableCardBg = isDark ? '#111827' : '#ffffff';
  const tableCardBorder = isDark ? '#1f2937' : '#e2e8f0';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const mutedTextColor = isDark ? '#94a3b8' : '#64748b';
  const subtleBorder = isDark ? '#1f2937' : '#f1f5f9';
  const rowAltBg = isDark ? '#131d2e' : '#f8fafc';
  const gridDotColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';

  // Build SVG XML
  let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  svg += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${diagramWidth} ${diagramHeight}" width="${diagramWidth}" height="${diagramHeight}" style="background-color: ${isTransparent ? 'transparent' : bgColor}; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n`;

  // Defs & Filters
  svg += `  <defs>\n`;
  svg += `    <filter id="card-shadow" x="-8%" y="-8%" width="120%" height="120%">\n`;
  svg += `      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="${isDark ? '0.5' : '0.08'}" />\n`;
  svg += `    </filter>\n`;
  svg += `    <filter id="badge-shadow" x="-20%" y="-20%" width="140%" height="140%">\n`;
  svg += `      <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000000" flood-opacity="${isDark ? '0.4' : '0.12'}" />\n`;
  svg += `    </filter>\n`;
  svg += `    <pattern id="grid-dots" width="24" height="24" patternUnits="userSpaceOnUse">\n`;
  svg += `      <circle cx="2" cy="2" r="1.2" fill="${gridDotColor}" />\n`;
  svg += `    </pattern>\n`;
  svg += `  </defs>\n`;

  // Background
  if (!isTransparent) {
    svg += `  <!-- Canvas Background -->\n`;
    svg += `  <rect width="${diagramWidth}" height="${diagramHeight}" fill="${bgColor}" />\n`;
    svg += `  <rect width="${diagramWidth}" height="${diagramHeight}" fill="url(#grid-dots)" />\n`;
    svg += `  <rect x="0.5" y="0.5" width="${diagramWidth - 1}" height="${diagramHeight - 1}" fill="none" stroke="${canvasBorderColor}" stroke-width="1" />\n`;
  }

  // Layer 1: Relationship Lines
  svg += `  <!-- Foreign Key Relationship Lines -->\n`;
  svg += `  <g id="relationships-layer">\n`;

  computedRels.forEach(rel => {
    if (!rel || !rel.pathD) return;

    // Transform path coordinates by (offsetX, offsetY)
    const shiftedPathD = rel.pathD.replace(/([MLCQ])\s*([-\d.]+)\s+([-\d.]+)/g, (match, cmd, x, y) => {
      const nx = (parseFloat(x) + offsetX).toFixed(1);
      const ny = (parseFloat(y) + offsetY).toFixed(1);
      return `${cmd} ${nx} ${ny}`;
    }).replace(/,\s*([-\d.]+)\s+([-\d.]+)/g, (match, x, y) => {
      const nx = (parseFloat(x) + offsetX).toFixed(1);
      const ny = (parseFloat(y) + offsetY).toFixed(1);
      return `, ${nx} ${ny}`;
    });

    const isOpt = rel.isOptional;
    const strokeColor = isOpt
      ? (isDark ? '#818cf8' : '#6366f1')
      : (isDark ? '#64748b' : '#94a3b8');
    const strokeWidth = isOpt ? 2.0 : 1.8;
    const dashArray = isOpt ? 'stroke-dasharray="6,4"' : '';

    svg += `    <!-- Ref ${escapeXml(rel.fromTable)}.${escapeXml(rel.fromColumn)} -> ${escapeXml(rel.toTable)}.${escapeXml(rel.toColumn)} -->\n`;
    svg += `    <path d="${shiftedPathD}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" ${dashArray} stroke-linecap="round" stroke-linejoin="round" />\n`;

    // Anchor Endpoints
    const fromX = (rel.x1 + offsetX).toFixed(1);
    const fromY = (rel.y1 + offsetY).toFixed(1);
    const toX = (rel.x2 + offsetX).toFixed(1);
    const toY = (rel.y2 + offsetY).toFixed(1);

    // From (FK) dot
    svg += `    <circle cx="${fromX}" cy="${fromY}" r="${isOpt ? '4' : '3.5'}" fill="${isOpt ? (isDark ? '#090d16' : '#ffffff') : strokeColor}" stroke="${strokeColor}" stroke-width="2" />\n`;
    // To (PK) dot
    svg += `    <circle cx="${toX}" cy="${toY}" r="3.5" fill="${strokeColor}" stroke="${isDark ? '#090d16' : '#ffffff'}" stroke-width="1.5" />\n`;

    // Endpoint Badges
    const fbX = (rel.fromBadgeX + offsetX).toFixed(1);
    const fbY = (rel.fromBadgeY + offsetY).toFixed(1);
    const tbX = (rel.toBadgeX + offsetX).toFixed(1);
    const tbY = (rel.toBadgeY + offsetY).toFixed(1);

    svg += `    <g transform="translate(${fbX}, ${fbY})">\n`;
    svg += `      <rect x="-11" y="-8" width="22" height="16" rx="4" fill="${isDark ? '#111827' : '#ffffff'}" stroke="${strokeColor}" stroke-width="1" />\n`;
    svg += `      <text x="0" y="3" font-size="9" font-weight="800" font-family="ui-monospace, monospace" fill="${strokeColor}" text-anchor="middle">${escapeXml(rel.fromLabel || 'N')}</text>\n`;
    svg += `    </g>\n`;

    svg += `    <g transform="translate(${tbX}, ${tbY})">\n`;
    svg += `      <rect x="-11" y="-8" width="22" height="16" rx="4" fill="${isDark ? '#111827' : '#ffffff'}" stroke="${strokeColor}" stroke-width="1" />\n`;
    svg += `      <text x="0" y="3" font-size="9" font-weight="800" font-family="ui-monospace, monospace" fill="${strokeColor}" text-anchor="middle">${escapeXml(rel.toLabel || '1')}</text>\n`;
    svg += `    </g>\n`;

    // Midpoint Cardinality Pill
    const mX = (rel.midX + offsetX).toFixed(1);
    const mY = (rel.midY + offsetY).toFixed(1);
    const pillW = rel.pillWidth || 54;
    const cardText = rel.displayCardinality || '1 : N';

    svg += `    <g transform="translate(${mX}, ${mY})">\n`;
    svg += `      <rect x="${-(pillW / 2)}" y="-11" width="${pillW}" height="22" rx="11" fill="${isDark ? '#111827' : '#ffffff'}" stroke="${strokeColor}" stroke-width="1.5" filter="url(#badge-shadow)" />\n`;
    svg += `      <text x="0" y="3.5" font-size="9.5" font-weight="800" font-family="ui-monospace, monospace" fill="${isDark ? '#f8fafc' : '#0f172a'}" text-anchor="middle">${escapeXml(cardText)}</text>\n`;
    svg += `    </g>\n`;
  });

  svg += `  </g>\n`;

  // Layer 2: Table Cards
  svg += `  <!-- Table Entity Cards -->\n`;
  svg += `  <g id="tables-layer">\n`;

  computedTables.forEach(t => {
    const tx = Math.round(t.x + offsetX);
    const ty = Math.round(t.y + offsetY);
    const tw = t.width;
    const th = t.height;
    const headerH = t.headerHeight;
    const headerColor = t.headerColor || '#3b82f6';

    svg += `    <g id="table-${escapeXml(t.name)}" transform="translate(${tx}, ${ty})">\n`;
    // Outer Card Body
    svg += `      <rect width="${tw}" height="${th}" rx="12" fill="${tableCardBg}" stroke="${tableCardBorder}" stroke-width="1.5" filter="url(#card-shadow)" />\n`;

    // Header Background with Rounded Top
    svg += `      <path d="M 0 12 Q 0 0 12 0 L ${tw - 12} 0 Q ${tw} 0 ${tw} 12 L ${tw} ${headerH} L 0 ${headerH} Z" fill="${headerColor}" />\n`;

    // Header Table Icon (Grid symbol)
    const iconY = Math.round(headerH / 2 - 7);
    svg += `      <g transform="translate(14, ${iconY})">\n`;
    svg += `        <rect width="14" height="14" rx="3" fill="none" stroke="#ffffff" stroke-width="1.6" opacity="0.9" />\n`;
    svg += `        <line x1="0" y1="5" x2="14" y2="5" stroke="#ffffff" stroke-width="1.2" opacity="0.9" />\n`;
    svg += `        <line x1="6" y1="5" x2="6" y2="14" stroke="#ffffff" stroke-width="1.2" opacity="0.9" />\n`;
    svg += `      </g>\n`;

    // Table Name
    const textY = Math.round(headerH / 2 + 5);
    svg += `      <text x="36" y="${textY}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="13" font-weight="700" fill="#ffffff">${escapeXml(t.name)}</text>\n`;

    // Column Rows
    let curY = headerH;
    (t.visibleColumns || []).forEach((col, idx) => {
      const isAlt = idx % 2 === 1;
      if (isAlt) {
        svg += `      <rect x="1" y="${curY}" width="${tw - 2}" height="${rowHeight}" fill="${rowAltBg}" />\n`;
      }
      svg += `      <line x1="0" y1="${curY}" x2="${tw}" y2="${curY}" stroke="${subtleBorder}" stroke-width="1" />\n`;

      let colX = 14;

      // PK or FK Key Badge
      if (col.isPk || col.pk) {
        svg += `      <rect x="${colX}" y="${curY + 7}" width="24" height="18" rx="4" fill="${isDark ? '#78350f' : '#fef3c7'}" stroke="${isDark ? '#b45309' : '#f59e0b'}" stroke-width="1" />\n`;
        svg += `      <text x="${colX + 12}" y="${curY + 19.5}" font-size="9" font-weight="800" font-family="ui-monospace, monospace" fill="${isDark ? '#fef3c7' : '#92400e'}" text-anchor="middle">PK</text>\n`;
        colX += 30;
      } else if (col.isFk || col.fk) {
        svg += `      <rect x="${colX}" y="${curY + 7}" width="24" height="18" rx="4" fill="${isDark ? '#1e3a8a' : '#dbeafe'}" stroke="${isDark ? '#2563eb' : '#3b82f6'}" stroke-width="1" />\n`;
        svg += `      <text x="${colX + 12}" y="${curY + 19.5}" font-size="9" font-weight="800" font-family="ui-monospace, monospace" fill="${isDark ? '#dbeafe' : '#1e40af'}" text-anchor="middle">FK</text>\n`;
        colX += 30;
      }

      // Column Name
      const colName = col.name || 'field';
      svg += `      <text x="${colX}" y="${curY + 20.5}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11.5" font-weight="600" fill="${textColor}">${escapeXml(colName)}</text>\n`;

      // Column Type & Constraint Tags (Right side)
      let rightX = tw - 14;
      if (col.notNull || col.isNull === false || col.isPk || col.pk) {
        // NOT NULL pill
        const nnText = 'NN';
        svg += `      <text x="${rightX}" y="${curY + 20}" font-family="ui-monospace, monospace" font-size="9" font-weight="700" fill="${mutedTextColor}" text-anchor="end">${nnText}</text>\n`;
        rightX -= 24;
      }

      const colType = (col.type || 'varchar').toLowerCase();
      svg += `      <text x="${rightX}" y="${curY + 20.5}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11" font-weight="500" fill="${mutedTextColor}" text-anchor="end">${escapeXml(colType)}</text>\n`;

      curY += rowHeight;
    });

    // Card Footer Divider & Bottom border
    svg += `      <line x1="0" y1="${curY}" x2="${tw}" y2="${curY}" stroke="${subtleBorder}" stroke-width="1" />\n`;
    svg += `    </g>\n`;
  });

  svg += `  </g>\n`;

  svg += `</svg>`;
  return svg;
}

// Convert SVG string to offscreen HTML Canvas with high-DPI scaling
export function renderSvgToCanvas(svgString, width, height, scale = 2) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(10, Math.round(width * scale));
    canvas.height = Math.max(10, Math.round(height * scale));

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) {
      reject(new Error('Canvas 2D context not available'));
      return;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const img = new Image();
    img.crossOrigin = 'anonymous';

    // Build data URI
    const svgEncoded = encodeURIComponent(svgString)
      .replace(/'/g, '%27')
      .replace(/"/g, '%22');
    const dataUri = `data:image/svg+xml;charset=utf-8,${svgEncoded}`;

    let objectUrl = null;
    try {
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      objectUrl = URL.createObjectURL(blob);
    } catch (e) {
      // Fallback to dataUri directly
    }

    const primarySrc = objectUrl || dataUri;

    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      if (objectUrl) {
        try { URL.revokeObjectURL(objectUrl); } catch (e) {}
      }
      resolve({ canvas, ctx, width: canvas.width, height: canvas.height });
    };

    img.onerror = () => {
      // If blob URL failed, retry with data URI fallback
      if (primarySrc !== dataUri) {
        if (objectUrl) {
          try { URL.revokeObjectURL(objectUrl); } catch (e) {}
        }
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          ctx.drawImage(fallbackImg, 0, 0, canvas.width, canvas.height);
          resolve({ canvas, ctx, width: canvas.width, height: canvas.height });
        };
        fallbackImg.onerror = () => {
          reject(new Error('Failed to load diagram SVG onto image canvas'));
        };
        fallbackImg.src = dataUri;
      } else {
        reject(new Error('Failed to load diagram SVG onto image canvas'));
      }
    };

    img.src = primarySrc;
  });
}

// Generate pure Markdown tables of all database tables, columns, and data types
// Output strictly contains only the tables without introductory or concluding text
export function generateMarkdownTables(project, format = 'per_table') {
  const tables = project?.tables || [];
  if (tables.length === 0) return '| Table | Column | Type |\n| :--- | :--- | :--- |\n| - | - | - |';

  if (format === 'combined') {
    let md = '| Table | Column | Type | Nullable | Key | Notes |\n';
    md += '| :--- | :--- | :--- | :--- | :--- | :--- |\n';
    tables.forEach(t => {
      const cols = t.columns || [];
      if (cols.length === 0) {
        md += `| ${t.name} | (no columns) | - | - | - | - |\n`;
      } else {
        cols.forEach(c => {
          const keyLabel = (c.isPk || c.pk) ? 'PK' : ((c.isFk || c.fk) ? 'FK' : ((c.isUnique || c.unique) ? 'UNIQUE' : ''));
          const nullable = (c.notNull || c.isNull === false || c.isPk || c.pk) ? 'NO' : 'YES';
          const notes = c.comment || c.note || (c.defaultValue ? `default: ${c.defaultValue}` : '');
          md += `| ${t.name} | ${c.name} | ${c.type || 'varchar'} | ${nullable} | ${keyLabel} | ${notes} |\n`;
        });
      }
    });
    return md.trim();
  }

  // format === 'per_table'
  const sections = [];
  tables.forEach(t => {
    let tMd = `| Column | Type | Nullable | Key | Notes |\n`;
    tMd += `| :--- | :--- | :--- | :--- | :--- |\n`;
    const cols = t.columns || [];
    if (cols.length === 0) {
      tMd += `| (empty) | - | - | - | - |\n`;
    } else {
      cols.forEach(c => {
        const keyLabel = (c.isPk || c.pk) ? 'PK' : ((c.isFk || c.fk) ? 'FK' : ((c.isUnique || c.unique) ? 'UNIQUE' : ''));
        const nullable = (c.notNull || c.isNull === false || c.isPk || c.pk) ? 'NO' : 'YES';
        const notes = c.comment || c.note || (c.defaultValue ? `default: ${c.defaultValue}` : '');
        tMd += `| ${c.name} | ${c.type || 'varchar'} | ${nullable} | ${keyLabel} | ${notes} |\n`;
      });
    }
    sections.push(`### \`${t.name}\`\n\n${tMd.trim()}`);
  });

  return sections.join('\n\n');
}

// Helper to trigger browser file download
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// 1. Export as HD PNG
export async function exportDiagramAsPng(project, options = {}) {
  const scale = options.scale || 2; // 1x, 2x (300 DPI HD), 3x (4K Ultra-HD)
  const svgString = generateDiagramSvg(project, options);
  
  // Extract width & height from viewBox
  const vbMatch = svgString.match(/viewBox="0 0 (\d+) (\d+)"/);
  const w = vbMatch ? parseInt(vbMatch[1], 10) : 1200;
  const h = vbMatch ? parseInt(vbMatch[2], 10) : 800;

  const { canvas } = await renderSvgToCanvas(svgString, w, h, scale);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to generate PNG blob'));
        return;
      }
      const safeName = (project?.name || 'database_schema').toLowerCase().replace(/[^a-z0-9_-]+/g, '_');
      const filename = `${safeName}_erd_${scale}x_hd.png`;
      triggerDownload(blob, filename);
      resolve({ blob, filename, width: canvas.width, height: canvas.height });
    }, 'image/png');
  });
}

// 2. Export as HD JPG
export async function exportDiagramAsJpg(project, options = {}) {
  const scale = options.scale || 2;
  // If user selected transparent theme, default JPG to white background since JPG does not support alpha
  const effectiveTheme = options.theme === 'transparent' ? 'light' : (options.theme || 'light');
  const svgString = generateDiagramSvg(project, { ...options, theme: effectiveTheme });

  const vbMatch = svgString.match(/viewBox="0 0 (\d+) (\d+)"/);
  const w = vbMatch ? parseInt(vbMatch[1], 10) : 1200;
  const h = vbMatch ? parseInt(vbMatch[2], 10) : 800;

  const { canvas, ctx } = await renderSvgToCanvas(svgString, w, h, scale);

  // Fill solid background for JPEG
  const bg = effectiveTheme === 'dark' ? '#090d16' : '#ffffff';
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = canvas.width;
  finalCanvas.height = canvas.height;
  const fCtx = finalCanvas.getContext('2d');
  fCtx.fillStyle = bg;
  fCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
  fCtx.drawImage(canvas, 0, 0);

  return new Promise((resolve, reject) => {
    finalCanvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to generate JPG blob'));
        return;
      }
      const safeName = (project?.name || 'database_schema').toLowerCase().replace(/[^a-z0-9_-]+/g, '_');
      const filename = `${safeName}_erd_${scale}x_hd.jpg`;
      triggerDownload(blob, filename);
      resolve({ blob, filename, width: finalCanvas.width, height: finalCanvas.height });
    }, 'image/jpeg', 0.95);
  });
}

// 3. Export as Vector SVG
export function exportDiagramAsSvg(project, options = {}) {
  const svgString = generateDiagramSvg(project, options);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const safeName = (project?.name || 'database_schema').toLowerCase().replace(/[^a-z0-9_-]+/g, '_');
  const filename = `${safeName}_erd_vector.svg`;
  triggerDownload(blob, filename);
  return { blob, filename, svgString };
}

// 4. Export as Academic Report PDF (A4 / US Letter, Landscape / Portrait)
export async function exportDiagramAsPdf(project, options = {}) {
  const {
    pdfFormat = 'a4', // 'a4' | 'letter'
    pdfOrientation = 'landscape', // 'landscape' | 'portrait'
    theme = 'light' // Default to crisp white paper for academic print
  } = options;

  // Render at 2x scale for crisp 300 DPI print quality
  const svgString = generateDiagramSvg(project, { ...options, theme: theme === 'transparent' ? 'light' : theme });
  const vbMatch = svgString.match(/viewBox="0 0 (\d+) (\d+)"/);
  const imgW = vbMatch ? parseInt(vbMatch[1], 10) : 1200;
  const imgH = vbMatch ? parseInt(vbMatch[2], 10) : 800;

  const { canvas } = await renderSvgToCanvas(svgString, imgW, imgH, 2.0);
  const imgData = canvas.toDataURL('image/png');

  // Initialize jsPDF
  const doc = new jsPDF({
    orientation: pdfOrientation,
    unit: 'mm',
    format: pdfFormat
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const margin = 12; // 12mm page margin
  const availW = pageWidth - margin * 2;
  const availH = pageHeight - margin * 2;

  // Calculate proportional fit
  const imgAspect = imgW / imgH;
  let targetW = availW;
  let targetH = targetW / imgAspect;

  if (targetH > availH) {
    targetH = availH;
    targetW = targetH * imgAspect;
  }

  const posX = margin + (availW - targetW) / 2;
  const posY = margin + (availH - targetH) / 2;

  // Add the high-res diagram
  doc.addImage(imgData, 'PNG', posX, posY, targetW, targetH, undefined, 'FAST');

  // Generate filename and trigger download
  const safeName = (project?.name || 'database_schema').toLowerCase().replace(/[^a-z0-9_-]+/g, '_');
  const filename = `${safeName}_academic_erd_${pdfFormat.toUpperCase()}.pdf`;
  doc.save(filename);

  return { doc, filename };
}

// 5. Copy PNG to Clipboard (Immediate Paste for Word, LaTeX, Google Docs)
export async function copyDiagramToClipboard(project, options = {}) {
  const scale = 2; // High-res 2x
  const svgString = generateDiagramSvg(project, options);
  const vbMatch = svgString.match(/viewBox="0 0 (\d+) (\d+)"/);
  const w = vbMatch ? parseInt(vbMatch[1], 10) : 1200;
  const h = vbMatch ? parseInt(vbMatch[2], 10) : 800;

  const { canvas } = await renderSvgToCanvas(svgString, w, h, scale);

  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('Failed to create PNG blob for clipboard'));
        return;
      }
      try {
        if (navigator?.clipboard?.write) {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          resolve({ success: true, blob });
        } else {
          reject(new Error('Clipboard API write not supported in this browser'));
        }
      } catch (err) {
        reject(err);
      }
    }, 'image/png');
  });
}
