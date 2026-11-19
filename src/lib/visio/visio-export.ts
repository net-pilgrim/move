import type { Node, Edge } from '@xyflow/svelte';
import type { VxmlDocSettings } from '../../types/vxml';

/**
 * Escape XML special characters for safe inclusion in Visio XML (DatadiagramML).
 */
function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

interface ShapeStyle {
  fillColor: string;
  borderColor: string;
  titleColor: string;
  subtitleColor: string;
  isDiamond?: boolean;
  isPill?: boolean;
}

/**
 * Returns professional, high-contrast, light corporate color schemes
 * for Microsoft Visio white-canvas diagrams.
 */
function getNodeStyle(type: string): ShapeStyle {
  switch (type) {
    case 'vxml-menu':
      return {
        fillColor: '#EEF2FF', // Very soft indigo tint
        borderColor: '#4F46E5', // Vibrant indigo border
        titleColor: '#1E1B4B',
        subtitleColor: '#4338CA'
      };
    case 'vxml-field':
      return {
        fillColor: '#ECFDF5', // Soft emerald mint
        borderColor: '#059669', // Emerald green border
        titleColor: '#064E3B',
        subtitleColor: '#047857'
      };
    case 'vxml-block':
      return {
        fillColor: '#F0F9FF', // Soft sky blue tint
        borderColor: '#0284C7', // Ocean sky blue border
        titleColor: '#082F49',
        subtitleColor: '#0369A1'
      };
    case 'vxml-condition':
      return {
        fillColor: '#FFFBEB', // Soft amber gold tint
        borderColor: '#D97706', // Warm amber border
        titleColor: '#78350F',
        subtitleColor: '#92400E',
        isDiamond: true
      };
    case 'vxml-data':
      return {
        fillColor: '#FAF5FF', // Soft purple tint
        borderColor: '#7E22CE', // Deep purple border
        titleColor: '#3B0764',
        subtitleColor: '#6B21A8'
      };
    case 'vxml-transfer':
      return {
        fillColor: '#FFF1F2', // Soft rose pink tint
        borderColor: '#E11D48', // Crimson rose border
        titleColor: '#4C0519',
        subtitleColor: '#9F1239'
      };
    case 'vxml-record':
      return {
        fillColor: '#FEF2F2', // Soft coral red tint
        borderColor: '#DC2626', // Red border
        titleColor: '#450A0A',
        subtitleColor: '#991B1B'
      };
    case 'vxml-subdialog':
      return {
        fillColor: '#F5F3FF', // Soft violet tint
        borderColor: '#6D28D9', // Deep violet border
        titleColor: '#2E1065',
        subtitleColor: '#5B21B6'
      };
    case 'vxml-disconnect':
      return {
        fillColor: '#F1F5F9', // Crisp light slate
        borderColor: '#475569', // Charcoal slate border
        titleColor: '#0F172A',
        subtitleColor: '#334155',
        isPill: true
      };
    case 'vxml-exit':
      return {
        fillColor: '#F8FAFC', // Clean off-white
        borderColor: '#334155', // Dark slate border
        titleColor: '#020617',
        subtitleColor: '#1E293B',
        isPill: true
      };
    default:
      return {
        fillColor: '#F8FAFC',
        borderColor: '#475569',
        titleColor: '#0F172A',
        subtitleColor: '#334155'
      };
  }
}

/**
 * Extracts human-readable title and subtitle from node data.
 */
function getNodeText(node: Node): { title: string; subtitle: string } {
  const d = (node.data || {}) as Record<string, any>;
  const type = node.type || 'node';
  const label = d.label || d.dialogId || node.id;

  let subtitle = '';
  switch (type) {
    case 'vxml-menu':
      subtitle = d.prompt?.text ? `"${d.prompt.text}"` : (d.choices ? `${d.choices.length} choices` : '');
      break;
    case 'vxml-field':
      subtitle = d.prompt?.text ? `"${d.prompt.text}"` : (d.type ? `Type: ${d.type}` : '');
      break;
    case 'vxml-condition':
      subtitle = d.condition ? `if (${d.condition})` : '';
      break;
    case 'vxml-data':
      subtitle = d.src ? `${(d.method || 'GET').toUpperCase()} ${d.src}` : '';
      break;
    case 'vxml-block':
      subtitle = d.prompt?.text ? `"${d.prompt.text}"` : (d.assigns?.length ? `${d.assigns.length} assigns` : '');
      break;
    case 'vxml-transfer':
      subtitle = d.dest ? `Dest: ${d.dest}` : '';
      break;
    case 'vxml-record':
      subtitle = d.maxtime ? `Max: ${d.maxtime}` : '';
      break;
    case 'vxml-subdialog':
      subtitle = d.src ? `Src: ${d.src}` : '';
      break;
    case 'vxml-disconnect':
      subtitle = 'Hangup Call';
      break;
    case 'vxml-exit':
      subtitle = 'Terminate Flow';
      break;
  }

  // Truncate long subtitles for clean Visio diagram display
  if (subtitle.length > 40) {
    subtitle = subtitle.substring(0, 37) + '...';
  }

  return { title: label, subtitle };
}

interface PortInfo {
  x: number;
  y: number;
  connIdx: number; // 0: Top, 1: Bottom, 2: Left, 3: Right
}

/**
 * Calculates the exact boundary exit or entry port for a shape based on the relative
 * direction to the other shape, ensuring connectors start and end cleanly on the shape perimeter.
 */
function getBestConnectionPort(
  cx: number,
  cy: number,
  w: number,
  h: number,
  otherCx: number,
  otherCy: number,
  isSource: boolean
): PortInfo {
  const dx = otherCx - cx;
  const dy = otherCy - cy; // Visio Y coordinates (upwards)

  if (Math.abs(dx) >= Math.abs(dy) * 0.5) {
    if (dx >= 0) {
      // Other shape is to the right
      return isSource
        ? { x: cx + w / 2, y: cy, connIdx: 3 } // Exit Right
        : { x: cx - w / 2, y: cy, connIdx: 2 }; // Enter Left
    } else {
      // Other shape is to the left
      return isSource
        ? { x: cx - w / 2, y: cy, connIdx: 2 } // Exit Left
        : { x: cx + w / 2, y: cy, connIdx: 3 }; // Enter Right
    }
  } else {
    if (dy >= 0) {
      // Other shape is above
      return isSource
        ? { x: cx, y: cy + h / 2, connIdx: 0 } // Exit Top
        : { x: cx, y: cy - h / 2, connIdx: 1 }; // Enter Bottom
    } else {
      // Other shape is below
      return isSource
        ? { x: cx, y: cy - h / 2, connIdx: 1 } // Exit Bottom
        : { x: cx, y: cy + h / 2, connIdx: 0 }; // Enter Top
    }
  }
}

/**
 * Generates an official Microsoft Visio XML Drawing (.vdx / DatadiagramML) file
 * from Svelte Flow nodes and edges.
 *
 * Connectors start and end cleanly on the shape perimeter (never at the center),
 * with standard 1pt stroke weights, fine arrowheads, and non-overlapping layout.
 *
 * Fully compatible with Microsoft Visio 2003/2007/2010/2013/2016/2019/365,
 * draw.io / diagrams.net, and Lucidchart.
 */
export function generateVisioVdx(
  nodes: Node[],
  edges: Edge[],
  docSettings?: VxmlDocSettings
): string {
  // Proportional flowchart dimensions (in inches)
  const defaultNodeWidth = 1.7; // Compact width
  const defaultNodeHeight = 0.72; // Compact height
  const diamondWidth = 1.45;
  const diamondHeight = 0.85;
  const marginIn = 0.8;

  // Standard line weights in inches:
  // In Visio DatadiagramML, raw numbers are interpreted as INCHES.
  // 1 pt = 1/72 inch ≈ 0.0138889 inches.
  const BORDER_WEIGHT_IN = '0.0138889'; // 1 pt border
  const CONNECTOR_WEIGHT_IN = '0.0125000'; // ~0.9 pt connector stroke

  // Compute bounding box
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  if (nodes.length === 0) {
    minX = 0;
    maxX = 800;
    minY = 0;
    maxY = 600;
  } else {
    for (const node of nodes) {
      if (node.position.x < minX) minX = node.position.x;
      if (node.position.x > maxX) maxX = node.position.x;
      if (node.position.y < minY) minY = node.position.y;
      if (node.position.y > maxY) maxY = node.position.y;
    }
  }

  // Scale factor: 120 canvas pixels = 1.0 inch in Visio
  const DPI = 120;

  const contentWidthIn = Math.max((maxX - minX) / DPI + defaultNodeWidth, 8.5);
  const contentHeightIn = Math.max((maxY - minY) / DPI + defaultNodeHeight, 6.0);

  const pageWidthIn = Math.max(11.0, contentWidthIn + marginIn * 2);
  const pageHeightIn = Math.max(8.5, contentHeightIn + marginIn * 2);

  // Map node IDs to Visio 1-based shape IDs and computed centers
  const nodeShapeIdMap = new Map<string, number>();
  const nodeCenterMap = new Map<string, { cx: number; cy: number; w: number; h: number }>();
  let currentShapeId = 1;

  const shapeXmlLines: string[] = [];

  // Generate Visio shape for each node
  for (const node of nodes) {
    const shapeId = currentShapeId++;
    nodeShapeIdMap.set(node.id, shapeId);

    const style = getNodeStyle(node.type || 'vxml-block');
    const { title, subtitle } = getNodeText(node);

    const wIn = style.isDiamond ? diamondWidth : defaultNodeWidth;
    const hIn = style.isDiamond ? diamondHeight : defaultNodeHeight;

    // Coordinate conversion: Visio Y axis starts from bottom-left
    const cx = (node.position.x - minX) / DPI + marginIn + wIn / 2;
    const cy = pageHeightIn - ((node.position.y - minY) / DPI + marginIn + hIn / 2);

    nodeCenterMap.set(node.id, { cx, cy, w: wIn, h: hIn });

    const roundingIn = style.isPill ? 0.35 : 0.04;
    const combinedText = subtitle ? `${title}&#x0A;${subtitle}` : title;

    shapeXmlLines.push(`        <!-- Node: ${escapeXml(node.id)} -->`);
    shapeXmlLines.push(`        <Shape ID="${shapeId}" Type="Shape" LineStyle="3" FillStyle="3" TextStyle="3">`);
    shapeXmlLines.push('          <XForm>');
    shapeXmlLines.push(`            <PinX>${cx.toFixed(4)}</PinX>`);
    shapeXmlLines.push(`            <PinY>${cy.toFixed(4)}</PinY>`);
    shapeXmlLines.push(`            <Width>${wIn.toFixed(4)}</Width>`);
    shapeXmlLines.push(`            <Height>${hIn.toFixed(4)}</Height>`);
    shapeXmlLines.push(`            <LocPinX F="Width*0.5">${(wIn / 2).toFixed(4)}</LocPinX>`);
    shapeXmlLines.push(`            <LocPinY F="Height*0.5">${(hIn / 2).toFixed(4)}</LocPinY>`);
    shapeXmlLines.push('            <Angle>0</Angle>');
    shapeXmlLines.push('          </XForm>');
    shapeXmlLines.push('          <Line>');
    shapeXmlLines.push(`            <LineColor>${style.borderColor}</LineColor>`);
    shapeXmlLines.push(`            <LineWeight>${BORDER_WEIGHT_IN}</LineWeight>`);
    shapeXmlLines.push('            <LinePattern>1</LinePattern>');
    shapeXmlLines.push(`            <Rounding>${roundingIn.toFixed(2)}</Rounding>`);
    shapeXmlLines.push('          </Line>');
    shapeXmlLines.push('          <Fill>');
    shapeXmlLines.push(`            <FillForegnd>${style.fillColor}</FillForegnd>`);
    shapeXmlLines.push('            <FillPattern>1</FillPattern>');
    shapeXmlLines.push('          </Fill>');
    shapeXmlLines.push(`          <Text><cp IX="0"/><pp IX="0"/>${escapeXml(combinedText)}</Text>`);
    shapeXmlLines.push('          <Paragraph IX="0">');
    shapeXmlLines.push('            <HorzAlign>1</HorzAlign>');
    shapeXmlLines.push('          </Paragraph>');
    shapeXmlLines.push('          <Character IX="0">');
    shapeXmlLines.push('            <Font>1</Font>');
    shapeXmlLines.push(`            <Color>${style.titleColor}</Color>`);
    shapeXmlLines.push('            <Size Unit="PT">8.5</Size>');
    shapeXmlLines.push('            <Style>1</Style>'); // Bold title text
    shapeXmlLines.push('          </Character>');

    // 4 Cardinal Connection Points for smart connector snapping
    // Index 0: Top, Index 1: Bottom, Index 2: Left, Index 3: Right
    shapeXmlLines.push('          <Connection IX="0">');
    shapeXmlLines.push(`            <X F="Width*0.5">${(wIn / 2).toFixed(4)}</X>`);
    shapeXmlLines.push(`            <Y F="Height*1">${hIn.toFixed(4)}</Y>`);
    shapeXmlLines.push('          </Connection>');
    shapeXmlLines.push('          <Connection IX="1">');
    shapeXmlLines.push(`            <X F="Width*0.5">${(wIn / 2).toFixed(4)}</X>`);
    shapeXmlLines.push('            <Y F="Height*0">0</Y>');
    shapeXmlLines.push('          </Connection>');
    shapeXmlLines.push('          <Connection IX="2">');
    shapeXmlLines.push('            <X F="Width*0">0</X>');
    shapeXmlLines.push(`            <Y F="Height*0.5">${(hIn / 2).toFixed(4)}</Y>`);
    shapeXmlLines.push('          </Connection>');
    shapeXmlLines.push('          <Connection IX="3">');
    shapeXmlLines.push(`            <X F="Width*1">${wIn.toFixed(4)}</X>`);
    shapeXmlLines.push(`            <Y F="Height*0.5">${(hIn / 2).toFixed(4)}</Y>`);
    shapeXmlLines.push('          </Connection>');

    if (style.isDiamond) {
      // Decision diamond path for conditional branching
      const halfW = (wIn / 2).toFixed(4);
      const halfH = (hIn / 2).toFixed(4);
      shapeXmlLines.push('          <Geom IX="0">');
      shapeXmlLines.push('            <NoFill>0</NoFill>');
      shapeXmlLines.push('            <NoLine>0</NoLine>');
      shapeXmlLines.push(`            <MoveTo IX="1"><X F="Width*0.5">${halfW}</X><Y F="Height*1">${hIn.toFixed(4)}</Y></MoveTo>`);
      shapeXmlLines.push(`            <LineTo IX="2"><X F="Width*1">${wIn.toFixed(4)}</X><Y F="Height*0.5">${halfH}</Y></LineTo>`);
      shapeXmlLines.push(`            <LineTo IX="3"><X F="Width*0.5">${halfW}</X><Y F="Height*0">0</Y></LineTo>`);
      shapeXmlLines.push(`            <LineTo IX="4"><X F="Width*0">0</X><Y F="Height*0.5">${halfH}</Y></LineTo>`);
      shapeXmlLines.push(`            <LineTo IX="5"><X F="Geometry1.X1">${halfW}</X><Y F="Geometry1.Y1">${hIn.toFixed(4)}</Y></LineTo>`);
      shapeXmlLines.push('          </Geom>');
    } else {
      // Standard rounded rectangular block path
      shapeXmlLines.push('          <Geom IX="0">');
      shapeXmlLines.push('            <NoFill>0</NoFill>');
      shapeXmlLines.push('            <NoLine>0</NoLine>');
      shapeXmlLines.push('            <MoveTo IX="1"><X F="Width*0">0</X><Y F="Height*0">0</Y></MoveTo>');
      shapeXmlLines.push(`            <LineTo IX="2"><X F="Width*1">${wIn.toFixed(4)}</X><Y F="Height*0">0</Y></LineTo>`);
      shapeXmlLines.push(`            <LineTo IX="3"><X F="Width*1">${wIn.toFixed(4)}</X><Y F="Height*1">${hIn.toFixed(4)}</Y></LineTo>`);
      shapeXmlLines.push(`            <LineTo IX="4"><X F="Width*0">0</X><Y F="Height*1">${hIn.toFixed(4)}</Y></LineTo>`);
      shapeXmlLines.push('            <LineTo IX="5"><X F="Geometry1.X1">0</X><Y F="Geometry1.Y1">0</Y></LineTo>');
      shapeXmlLines.push('          </Geom>');
    }
    shapeXmlLines.push('        </Shape>');
  }

  // 1-D Dynamic Connectors / Directional Edges
  const edgeConnectLines: string[] = [];

  for (const edge of edges) {
    const sourceShapeId = nodeShapeIdMap.get(edge.source);
    const targetShapeId = nodeShapeIdMap.get(edge.target);

    if (!sourceShapeId || !targetShapeId) continue;

    const sourceCenter = nodeCenterMap.get(edge.source);
    const targetCenter = nodeCenterMap.get(edge.target);

    if (!sourceCenter || !targetCenter) continue;

    const shapeId = currentShapeId++;

    // Calculate boundary exit port on source and boundary entry port on target
    // Connectors start and end on the shape PERIMETER, never at the center!
    const sourcePort = getBestConnectionPort(
      sourceCenter.cx,
      sourceCenter.cy,
      sourceCenter.w,
      sourceCenter.h,
      targetCenter.cx,
      targetCenter.cy,
      true
    );

    const targetPort = getBestConnectionPort(
      targetCenter.cx,
      targetCenter.cy,
      targetCenter.w,
      targetCenter.h,
      sourceCenter.cx,
      sourceCenter.cy,
      false
    );

    const x1 = sourcePort.x;
    const y1 = sourcePort.y;
    const x2 = targetPort.x;
    const y2 = targetPort.y;

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.max(Math.sqrt(dx * dx + dy * dy), 0.05);
    const angleRad = Math.atan2(dy, dx);

    const edgeLabel = edge.label ? String(edge.label) : (edge.sourceHandle || '');

    shapeXmlLines.push(`        <!-- 1-D Connector: ${escapeXml(edge.id)} (${edge.source} -> ${edge.target}) -->`);
    shapeXmlLines.push(`        <Shape ID="${shapeId}" Type="Shape" LineStyle="3" TextStyle="3">`);
    shapeXmlLines.push('          <XForm>');
    shapeXmlLines.push(`            <PinX F="(BeginX+EndX)/2">${midX.toFixed(4)}</PinX>`);
    shapeXmlLines.push(`            <PinY F="(BeginY+EndY)/2">${midY.toFixed(4)}</PinY>`);
    shapeXmlLines.push(`            <Width F="SQRT((EndX-BeginX)^2+(EndY-BeginY)^2)">${length.toFixed(4)}</Width>`);
    shapeXmlLines.push('            <Height>0</Height>');
    shapeXmlLines.push(`            <LocPinX F="Width*0.5">${(length / 2).toFixed(4)}</LocPinX>`);
    shapeXmlLines.push('            <LocPinY F="Height*0.5">0</LocPinY>');
    shapeXmlLines.push(`            <Angle Unit="RAD" F="ATAN2(EndY-BeginY,EndX-BeginX)">${angleRad.toFixed(4)}</Angle>`);
    shapeXmlLines.push('          </XForm>');
    shapeXmlLines.push('          <XForm1D>');
    shapeXmlLines.push(`            <BeginX>${x1.toFixed(4)}</BeginX>`);
    shapeXmlLines.push(`            <BeginY>${y1.toFixed(4)}</BeginY>`);
    shapeXmlLines.push(`            <EndX>${x2.toFixed(4)}</EndX>`);
    shapeXmlLines.push(`            <EndY>${y2.toFixed(4)}</EndY>`);
    shapeXmlLines.push('          </XForm1D>');
    shapeXmlLines.push('          <ShapeLayout>');
    shapeXmlLines.push('            <ShapeRouteStyle>1</ShapeRouteStyle>'); // 1 = Right-angle / orthogonal routing
    shapeXmlLines.push('          </ShapeLayout>');
    shapeXmlLines.push('          <Line>');
    shapeXmlLines.push('            <LineColor>#334155</LineColor>'); // Slate-700
    shapeXmlLines.push(`            <LineWeight>${CONNECTOR_WEIGHT_IN}</LineWeight>`); // Clean ~0.9pt stroke
    shapeXmlLines.push('            <LinePattern>1</LinePattern>');
    shapeXmlLines.push('            <EndArrow>4</EndArrow>'); // Standard clean arrowhead
    shapeXmlLines.push('            <EndArrowSize>1</EndArrowSize>'); // 1 = Small neat arrow
    shapeXmlLines.push('          </Line>');
    if (edgeLabel) {
      shapeXmlLines.push('          <TextBlock>');
      shapeXmlLines.push('            <VerticalAlign>1</VerticalAlign>');
      shapeXmlLines.push('            <TextBkgnd>1</TextBkgnd>'); // Solid background so line doesn't cut through text
      shapeXmlLines.push('          </TextBlock>');
      shapeXmlLines.push('          <TxtXForm>');
      shapeXmlLines.push(`            <TxtPinX F="Width*0.5">${(length / 2).toFixed(4)}</TxtPinX>`);
      shapeXmlLines.push('            <TxtPinY F="Height*0.5">0.1</TxtPinY>');
      shapeXmlLines.push('            <TxtAngle Unit="DEG">0</TxtAngle>'); // Always horizontal text
      shapeXmlLines.push('          </TxtXForm>');
      shapeXmlLines.push(`          <Text><cp IX="0"/><pp IX="0"/>${escapeXml(edgeLabel)}</Text>`);
      shapeXmlLines.push('          <Paragraph IX="0">');
      shapeXmlLines.push('            <HorzAlign>1</HorzAlign>');
      shapeXmlLines.push('          </Paragraph>');
      shapeXmlLines.push('          <Character IX="0">');
      shapeXmlLines.push('            <Font>1</Font>');
      shapeXmlLines.push('            <Color>#0F172A</Color>');
      shapeXmlLines.push('            <Size Unit="PT">7.5</Size>');
      shapeXmlLines.push('            <Style>1</Style>');
      shapeXmlLines.push('          </Character>');
    }
    shapeXmlLines.push('          <Geom IX="0">');
    shapeXmlLines.push('            <NoFill>1</NoFill>');
    shapeXmlLines.push('            <NoLine>0</NoLine>');
    shapeXmlLines.push('            <NoShow>0</NoShow>');
    shapeXmlLines.push('            <MoveTo IX="1"><X>0</X><Y>0</Y></MoveTo>');
    shapeXmlLines.push(`            <LineTo IX="2"><X F="Width*1">${length.toFixed(4)}</X><Y>0</Y></LineTo>`);
    shapeXmlLines.push('          </Geom>');
    shapeXmlLines.push('        </Shape>');

    // Glue connections to boundary connection points (Connections.X1 to Connections.X4)
    // NEVER to PinX (shape center)!
    edgeConnectLines.push(`        <Connect FromSheet="${shapeId}" FromCell="BeginX" FromPart="9" ToSheet="${sourceShapeId}" ToCell="Connections.X${sourcePort.connIdx + 1}" ToPart="3"/>`);
    edgeConnectLines.push(`        <Connect FromSheet="${shapeId}" FromCell="EndX" FromPart="9" ToSheet="${targetShapeId}" ToCell="Connections.X${targetPort.connIdx + 1}" ToPart="3"/>`);
  }

  const docTitle = docSettings?.application || 'VoiceXML 2.1 Callflow';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<VisioDocument xmlns="http://schemas.microsoft.com/visio/2003/core" xmlns:vx="http://schemas.microsoft.com/visio/2006/extension">
  <DocumentProperties>
    <Title>${escapeXml(docTitle)}</Title>
    <Subject>VoiceXML 2.1 Interactive Callflow Diagram</Subject>
    <Creator>MOVE (VoiceXML 2.1 Studio)</Creator>
    <Unit>Inches</Unit>
  </DocumentProperties>
  <Pages>
    <Page ID="0" Name="VoiceXML Callflow" NameU="VoiceXML Callflow">
      <PageSheet>
        <PageProps>
          <PageWidth Unit="IN">${pageWidthIn.toFixed(4)}</PageWidth>
          <PageHeight Unit="IN">${pageHeightIn.toFixed(4)}</PageHeight>
          <DrawingScale Unit="IN">1</DrawingScale>
          <PageScale Unit="IN">1</PageScale>
        </PageProps>
      </PageSheet>
      <Shapes>
${shapeXmlLines.join('\n')}
      </Shapes>
      <Connects>
${edgeConnectLines.join('\n')}
      </Connects>
    </Page>
  </Pages>
</VisioDocument>
`;
}
