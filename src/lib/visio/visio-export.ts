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
        fillColor: '#EEF2FF', // Soft indigo tint
        borderColor: '#4F46E5', // Indigo border
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
 * The full prompt or text is strictly preserved without truncation.
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

  // Full prompt text is preserved without truncation
  return { title: label, subtitle };
}

/**
 * Calculates responsive box dimensions (in inches) based on title and subtitle content,
 * ensuring prompts wrap properly without clipping or overflowing.
 */
function calculateNodeDimensions(
  title: string,
  subtitle: string,
  isDiamond?: boolean
): { wIn: number; hIn: number } {
  if (isDiamond) {
    // Condition decision diamond
    const textLen = Math.max(title.length, subtitle.length);
    const w = Math.max(1.8, Math.min(3.0, 1.6 + textLen * 0.04));
    const h = Math.max(1.0, Math.min(1.6, 0.9 + textLen * 0.025));
    return { wIn: w, hIn: h };
  }

  // Width: default 2.2 inches, expand up to 3.2 inches for long prompts
  const maxLineLen = Math.max(title.length, subtitle.length);
  const wIn = maxLineLen > 35 ? Math.min(3.2, 2.2 + (maxLineLen - 35) * 0.02) : 2.2;

  // Height: compute based on estimated wrapped lines (~32 chars per line at 8.5/7.5pt)
  const estSubtitleLines = subtitle ? Math.max(1, Math.ceil(subtitle.length / 30)) : 0;
  // Header is ~0.45 in, each subtitle line adds ~0.2 in, with minimum 0.75 in
  const hIn = subtitle ? Math.max(0.75, 0.45 + estSubtitleLines * 0.22) : 0.65;

  return { wIn, hIn };
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
 * from Svelte Flow nodes and edges conforming to the Microsoft Visio 2003 XML schema.
 *
 * Implements:
 * 1. Single-escaped linebreaks: &#x0A; inside <Text> for proper multiline parsing.
 * 2. Full prompt preservation: Prompts and subtitles are never truncated.
 * 3. Complete Visio schema sections: FaceNames, StyleSheets (0-4), and Masters (Dynamic connector).
 * 4. True Dynamic Connectors: Backed by Master ID="1" and ShapeRouteStyle=1 (orthogonal routing).
 * 5. Clean perimeter connection points: Connectors start and end on perimeter ports, rendered in background.
 * 6. Connection point glue: ToPart="100 + connIdx" and FromPart 9/12 to anchor to shape boundary.
 * 7. Upright horizontal edge labels: TxtAngle F="-Angle" counteracts rotation on diagonal links.
 * 8. Responsive box layout & TextBlock margins: Height uses TEXTHEIGHT(TheText, Width) with proper margins.
 */
export function generateVisioVdx(
  nodes: Node[],
  edges: Edge[],
  docSettings?: VxmlDocSettings
): string {
  const marginIn = 1.0;

  // Standard line weights in inches:
  // 1 pt = 1/72 inch ≈ 0.0138889 inches.
  const BORDER_WEIGHT_IN = '0.0138889'; // 1 pt border
  const CONNECTOR_WEIGHT_IN = '0.0125000'; // ~0.9 pt connector stroke

  // First pass: extract text and calculate responsive dimensions for each node
  const nodeDimensions = new Map<string, { wIn: number; hIn: number; title: string; subtitle: string; style: ShapeStyle }>();

  for (const node of nodes) {
    const style = getNodeStyle(node.type || 'vxml-block');
    const { title, subtitle } = getNodeText(node);
    const { wIn, hIn } = calculateNodeDimensions(title, subtitle, style.isDiamond);
    nodeDimensions.set(node.id, { wIn, hIn, title, subtitle, style });
  }

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

  const contentWidthIn = Math.max((maxX - minX) / DPI + 3.0, 8.5);
  const contentHeightIn = Math.max((maxY - minY) / DPI + 2.5, 6.0);

  const pageWidthIn = Math.max(11.0, contentWidthIn + marginIn * 2);
  const pageHeightIn = Math.max(8.5, contentHeightIn + marginIn * 2);

  // Shape IDs:
  // We reserve ID=1 for the Dynamic connector Master in <Masters>.
  // Page shapes start at ID=2.
  let currentShapeId = 2;

  // Map node IDs to Visio shape IDs and computed centers
  const nodeShapeIdMap = new Map<string, number>();
  const nodeCenterMap = new Map<string, { cx: number; cy: number; w: number; h: number }>();

  // Assign shape IDs and compute centers for all nodes
  for (const node of nodes) {
    const shapeId = currentShapeId++;
    nodeShapeIdMap.set(node.id, shapeId);

    const dim = nodeDimensions.get(node.id)!;
    // Coordinate conversion: Visio Y axis starts from bottom-left
    const cx = (node.position.x - minX) / DPI + marginIn + dim.wIn / 2;
    const cy = pageHeightIn - ((node.position.y - minY) / DPI + marginIn + dim.hIn / 2);

    nodeCenterMap.set(node.id, { cx, cy, w: dim.wIn, h: dim.hIn });
  }

  // Generate Connector XML lines first (so connectors render behind nodes in drawing order)
  const connectorXmlLines: string[] = [];
  const edgeConnectLines: string[] = [];

  for (const edge of edges) {
    const sourceShapeId = nodeShapeIdMap.get(edge.source);
    const targetShapeId = nodeShapeIdMap.get(edge.target);

    if (!sourceShapeId || !targetShapeId) continue;

    const sourceCenter = nodeCenterMap.get(edge.source);
    const targetCenter = nodeCenterMap.get(edge.target);

    if (!sourceCenter || !targetCenter) continue;

    const shapeId = currentShapeId++;

    // Calculate exact boundary exit and entry ports
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
    const labelWidthIn = Math.max(0.6, edgeLabel.length * 0.075);
    const labelHeightIn = 0.25;

    connectorXmlLines.push(`        <!-- 1-D Dynamic Connector: ${escapeXml(edge.id)} (${edge.source} -> ${edge.target}) -->`);
    connectorXmlLines.push(`        <Shape ID="${shapeId}" Type="Shape" Master="1" LineStyle="4" TextStyle="4">`);
    connectorXmlLines.push('          <XForm>');
    connectorXmlLines.push(`            <PinX F="(BeginX+EndX)/2">${midX.toFixed(4)}</PinX>`);
    connectorXmlLines.push(`            <PinY F="(BeginY+EndY)/2">${midY.toFixed(4)}</PinY>`);
    connectorXmlLines.push(`            <Width F="SQRT((EndX-BeginX)^2+(EndY-BeginY)^2)">${length.toFixed(4)}</Width>`);
    connectorXmlLines.push('            <Height>0</Height>');
    connectorXmlLines.push(`            <LocPinX F="Width*0.5">${(length / 2).toFixed(4)}</LocPinX>`);
    connectorXmlLines.push('            <LocPinY F="Height*0.5">0</LocPinY>');
    connectorXmlLines.push(`            <Angle Unit="RAD" F="ATAN2(EndY-BeginY,EndX-BeginX)">${angleRad.toFixed(4)}</Angle>`);
    connectorXmlLines.push('          </XForm>');
    connectorXmlLines.push('          <XForm1D>');
    connectorXmlLines.push(`            <BeginX>${x1.toFixed(4)}</BeginX>`);
    connectorXmlLines.push(`            <BeginY>${y1.toFixed(4)}</BeginY>`);
    connectorXmlLines.push(`            <EndX>${x2.toFixed(4)}</EndX>`);
    connectorXmlLines.push(`            <EndY>${y2.toFixed(4)}</EndY>`);
    connectorXmlLines.push('          </XForm1D>');
    connectorXmlLines.push('          <ShapeLayout>');
    connectorXmlLines.push('            <ShapeRouteStyle>1</ShapeRouteStyle>'); // 1 = Orthogonal / right-angle routing
    connectorXmlLines.push('          </ShapeLayout>');
    connectorXmlLines.push('          <Line>');
    connectorXmlLines.push('            <LineColor>#334155</LineColor>');
    connectorXmlLines.push(`            <LineWeight>${CONNECTOR_WEIGHT_IN}</LineWeight>`);
    connectorXmlLines.push('            <LinePattern>1</LinePattern>');
    connectorXmlLines.push('            <EndArrow>4</EndArrow>');
    connectorXmlLines.push('            <EndArrowSize>1</EndArrowSize>');
    connectorXmlLines.push('          </Line>');
    if (edgeLabel) {
      connectorXmlLines.push('          <TextBlock>');
      connectorXmlLines.push('            <LeftMargin Unit="PT">2</LeftMargin>');
      connectorXmlLines.push('            <RightMargin Unit="PT">2</RightMargin>');
      connectorXmlLines.push('            <TopMargin Unit="PT">2</TopMargin>');
      connectorXmlLines.push('            <BottomMargin Unit="PT">2</BottomMargin>');
      connectorXmlLines.push('            <VerticalAlign>1</VerticalAlign>');
      connectorXmlLines.push('            <TextBkgnd>1</TextBkgnd>'); // Solid background so connector doesn't strike through text
      connectorXmlLines.push('          </TextBlock>');
      connectorXmlLines.push('          <TxtXForm>');
      connectorXmlLines.push(`            <TxtPinX F="Width*0.5">${(length / 2).toFixed(4)}</TxtPinX>`);
      connectorXmlLines.push('            <TxtPinY F="Height*0.5">0.1</TxtPinY>');
      // TxtAngle counteracts connector angle to keep text strictly horizontal relative to page
      connectorXmlLines.push(`            <TxtAngle F="-Angle">${(-angleRad).toFixed(4)}</TxtAngle>`);
      connectorXmlLines.push(`            <TxtLocPinX F="TxtWidth*0.5">${(labelWidthIn / 2).toFixed(4)}</TxtLocPinX>`);
      connectorXmlLines.push(`            <TxtLocPinY F="TxtHeight*0.5">${(labelHeightIn / 2).toFixed(4)}</TxtLocPinY>`);
      connectorXmlLines.push(`            <TxtWidth>${labelWidthIn.toFixed(4)}</TxtWidth>`);
      connectorXmlLines.push(`            <TxtHeight>${labelHeightIn.toFixed(4)}</TxtHeight>`);
      connectorXmlLines.push('          </TxtXForm>');
      connectorXmlLines.push(`          <Text><cp IX="0"/><pp IX="0"/>${escapeXml(edgeLabel)}</Text>`);
      connectorXmlLines.push('          <Paragraph IX="0">');
      connectorXmlLines.push('            <HorzAlign>1</HorzAlign>');
      connectorXmlLines.push('          </Paragraph>');
      connectorXmlLines.push('          <Character IX="0">');
      connectorXmlLines.push('            <Font>1</Font>');
      connectorXmlLines.push('            <Color>#0F172A</Color>');
      connectorXmlLines.push('            <Size Unit="PT">7.5</Size>');
      connectorXmlLines.push('            <Style>1</Style>');
      connectorXmlLines.push('          </Character>');
    }
    connectorXmlLines.push('          <Geom IX="0">');
    connectorXmlLines.push('            <NoFill>1</NoFill>');
    connectorXmlLines.push('            <NoLine>0</NoLine>');
    connectorXmlLines.push('            <NoShow>0</NoShow>');
    connectorXmlLines.push('            <MoveTo IX="1"><X>0</X><Y>0</Y></MoveTo>');
    connectorXmlLines.push(`            <LineTo IX="2"><X F="Width*1">${length.toFixed(4)}</X><Y>0</Y></LineTo>`);
    connectorXmlLines.push('          </Geom>');
    connectorXmlLines.push('        </Shape>');

    // Glue connections to boundary connection points:
    // ToPart = 100 + connection_point_index (Row 0: 100, Row 1: 101, Row 2: 102, Row 3: 103)
    // FromPart = 9 for BeginX, 12 for EndX
    edgeConnectLines.push(`        <Connect FromSheet="${shapeId}" FromCell="BeginX" FromPart="9" ToSheet="${sourceShapeId}" ToCell="Connections.X${sourcePort.connIdx + 1}" ToPart="${100 + sourcePort.connIdx}"/>`);
    edgeConnectLines.push(`        <Connect FromSheet="${shapeId}" FromCell="EndX" FromPart="12" ToSheet="${targetShapeId}" ToCell="Connections.X${targetPort.connIdx + 1}" ToPart="${100 + targetPort.connIdx}"/>`);
  }

  // Generate Node XML lines
  const nodeXmlLines: string[] = [];

  for (const node of nodes) {
    const shapeId = nodeShapeIdMap.get(node.id)!;
    const center = nodeCenterMap.get(node.id)!;
    const dim = nodeDimensions.get(node.id)!;
    const { wIn, hIn, title, subtitle, style } = dim;
    const { cx, cy } = center;

    const roundingIn = style.isPill ? 0.35 : 0.04;
    const escapedTitle = escapeXml(title);
    const escapedSubtitle = escapeXml(subtitle);

    nodeXmlLines.push(`        <!-- Node: ${escapeXml(node.id)} -->`);
    nodeXmlLines.push(`        <Shape ID="${shapeId}" Type="Shape" LineStyle="3" FillStyle="3" TextStyle="3">`);
    nodeXmlLines.push('          <XForm>');
    nodeXmlLines.push(`            <PinX>${cx.toFixed(4)}</PinX>`);
    nodeXmlLines.push(`            <PinY>${cy.toFixed(4)}</PinY>`);
    nodeXmlLines.push(`            <Width>${wIn.toFixed(4)}</Width>`);
    // Dynamic height calculation in Visio ShapeSheet: TEXTHEIGHT(TheText, Width)
    nodeXmlLines.push(`            <Height F="MAX(${hIn.toFixed(4)},TEXTHEIGHT(TheText,Width))">${hIn.toFixed(4)}</Height>`);
    nodeXmlLines.push(`            <LocPinX F="Width*0.5">${(wIn / 2).toFixed(4)}</LocPinX>`);
    nodeXmlLines.push(`            <LocPinY F="Height*0.5">${(hIn / 2).toFixed(4)}</LocPinY>`);
    nodeXmlLines.push('            <Angle>0</Angle>');
    nodeXmlLines.push('          </XForm>');
    nodeXmlLines.push('          <TextBlock>');
    nodeXmlLines.push('            <LeftMargin Unit="PT">6</LeftMargin>');
    nodeXmlLines.push('            <RightMargin Unit="PT">6</RightMargin>');
    nodeXmlLines.push('            <TopMargin Unit="PT">6</TopMargin>');
    nodeXmlLines.push('            <BottomMargin Unit="PT">6</BottomMargin>');
    nodeXmlLines.push('            <VerticalAlign>1</VerticalAlign>');
    nodeXmlLines.push('            <TextBkgnd>0</TextBkgnd>');
    nodeXmlLines.push('          </TextBlock>');
    nodeXmlLines.push('          <Line>');
    nodeXmlLines.push(`            <LineColor>${style.borderColor}</LineColor>`);
    nodeXmlLines.push(`            <LineWeight>${BORDER_WEIGHT_IN}</LineWeight>`);
    nodeXmlLines.push('            <LinePattern>1</LinePattern>');
    nodeXmlLines.push(`            <Rounding>${roundingIn.toFixed(2)}</Rounding>`);
    nodeXmlLines.push('          </Line>');
    nodeXmlLines.push('          <Fill>');
    nodeXmlLines.push(`            <FillForegnd>${style.fillColor}</FillForegnd>`);
    nodeXmlLines.push('            <FillPattern>1</FillPattern>');
    nodeXmlLines.push('          </Fill>');

    // Single-escaped line break: &#x0A; is emitted directly in the XML text node
    // without running escapeXml on the entity itself, preventing &amp;#x0A;
    if (escapedSubtitle) {
      nodeXmlLines.push(`          <Text><cp IX="0"/><pp IX="0"/>${escapedTitle}&#x0A;<cp IX="1"/><pp IX="1"/>${escapedSubtitle}</Text>`);
      nodeXmlLines.push('          <Paragraph IX="0">');
      nodeXmlLines.push('            <HorzAlign>1</HorzAlign>');
      nodeXmlLines.push('            <SpAfter Unit="PT">2</SpAfter>');
      nodeXmlLines.push('          </Paragraph>');
      nodeXmlLines.push('          <Paragraph IX="1">');
      nodeXmlLines.push('            <HorzAlign>1</HorzAlign>');
      nodeXmlLines.push('            <SpLine Unit="PT">-9</SpLine>');
      nodeXmlLines.push('          </Paragraph>');
      nodeXmlLines.push('          <Character IX="0">');
      nodeXmlLines.push('            <Font>1</Font>');
      nodeXmlLines.push(`            <Color>${style.titleColor}</Color>`);
      nodeXmlLines.push('            <Size Unit="PT">8.5</Size>');
      nodeXmlLines.push('            <Style>1</Style>'); // Bold title
      nodeXmlLines.push('          </Character>');
      nodeXmlLines.push('          <Character IX="1">');
      nodeXmlLines.push('            <Font>1</Font>');
      nodeXmlLines.push(`            <Color>${style.subtitleColor}</Color>`);
      nodeXmlLines.push('            <Size Unit="PT">7.5</Size>');
      nodeXmlLines.push('            <Style>0</Style>'); // Regular subtitle
      nodeXmlLines.push('          </Character>');
    } else {
      nodeXmlLines.push(`          <Text><cp IX="0"/><pp IX="0"/>${escapedTitle}</Text>`);
      nodeXmlLines.push('          <Paragraph IX="0">');
      nodeXmlLines.push('            <HorzAlign>1</HorzAlign>');
      nodeXmlLines.push('          </Paragraph>');
      nodeXmlLines.push('          <Character IX="0">');
      nodeXmlLines.push('            <Font>1</Font>');
      nodeXmlLines.push(`            <Color>${style.titleColor}</Color>`);
      nodeXmlLines.push('            <Size Unit="PT">8.5</Size>');
      nodeXmlLines.push('            <Style>1</Style>');
      nodeXmlLines.push('          </Character>');
    }

    // 4 Cardinal Connection Points for smart connector snapping
    // Index 0: Top, Index 1: Bottom, Index 2: Left, Index 3: Right
    nodeXmlLines.push('          <Connection IX="0">');
    nodeXmlLines.push(`            <X F="Width*0.5">${(wIn / 2).toFixed(4)}</X>`);
    nodeXmlLines.push(`            <Y F="Height*1">${hIn.toFixed(4)}</Y>`);
    nodeXmlLines.push('          </Connection>');
    nodeXmlLines.push('          <Connection IX="1">');
    nodeXmlLines.push(`            <X F="Width*0.5">${(wIn / 2).toFixed(4)}</X>`);
    nodeXmlLines.push('            <Y F="Height*0">0</Y>');
    nodeXmlLines.push('          </Connection>');
    nodeXmlLines.push('          <Connection IX="2">');
    nodeXmlLines.push('            <X F="Width*0">0</X>');
    nodeXmlLines.push(`            <Y F="Height*0.5">${(hIn / 2).toFixed(4)}</Y>`);
    nodeXmlLines.push('          </Connection>');
    nodeXmlLines.push('          <Connection IX="3">');
    nodeXmlLines.push(`            <X F="Width*1">${wIn.toFixed(4)}</X>`);
    nodeXmlLines.push(`            <Y F="Height*0.5">${(hIn / 2).toFixed(4)}</Y>`);
    nodeXmlLines.push('          </Connection>');

    if (style.isDiamond) {
      // Decision diamond path for conditional branching
      const halfW = (wIn / 2).toFixed(4);
      const halfH = (hIn / 2).toFixed(4);
      nodeXmlLines.push('          <Geom IX="0">');
      nodeXmlLines.push('            <NoFill>0</NoFill>');
      nodeXmlLines.push('            <NoLine>0</NoLine>');
      nodeXmlLines.push(`            <MoveTo IX="1"><X F="Width*0.5">${halfW}</X><Y F="Height*1">${hIn.toFixed(4)}</Y></MoveTo>`);
      nodeXmlLines.push(`            <LineTo IX="2"><X F="Width*1">${wIn.toFixed(4)}</X><Y F="Height*0.5">${halfH}</Y></LineTo>`);
      nodeXmlLines.push(`            <LineTo IX="3"><X F="Width*0.5">${halfW}</X><Y F="Height*0">0</Y></LineTo>`);
      nodeXmlLines.push(`            <LineTo IX="4"><X F="Width*0">0</X><Y F="Height*0.5">${halfH}</Y></LineTo>`);
      nodeXmlLines.push(`            <LineTo IX="5"><X F="Geometry1.X1">${halfW}</X><Y F="Geometry1.Y1">${hIn.toFixed(4)}</Y></LineTo>`);
      nodeXmlLines.push('          </Geom>');
    } else {
      // Standard rounded rectangular block path
      nodeXmlLines.push('          <Geom IX="0">');
      nodeXmlLines.push('            <NoFill>0</NoFill>');
      nodeXmlLines.push('            <NoLine>0</NoLine>');
      nodeXmlLines.push('            <MoveTo IX="1"><X F="Width*0">0</X><Y F="Height*0">0</Y></MoveTo>');
      nodeXmlLines.push(`            <LineTo IX="2"><X F="Width*1">${wIn.toFixed(4)}</X><Y F="Height*0">0</Y></LineTo>`);
      nodeXmlLines.push(`            <LineTo IX="3"><X F="Width*1">${wIn.toFixed(4)}</X><Y F="Height*1">${hIn.toFixed(4)}</Y></LineTo>`);
      nodeXmlLines.push(`            <LineTo IX="4"><X F="Width*0">0</X><Y F="Height*1">${hIn.toFixed(4)}</Y></LineTo>`);
      nodeXmlLines.push('            <LineTo IX="5"><X F="Geometry1.X1">0</X><Y F="Geometry1.Y1">0</Y></LineTo>');
      nodeXmlLines.push('          </Geom>');
    }
    nodeXmlLines.push('        </Shape>');
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
  <FaceNames>
    <FaceName ID="1" Name="Segoe UI" NameU="Segoe UI"/>
    <FaceName ID="2" Name="Arial" NameU="Arial"/>
  </FaceNames>
  <StyleSheets>
    <StyleSheet ID="0" Name="No Style" NameU="No Style">
      <Line>
        <LineWeight>0.01</LineWeight>
        <LineColor>#000000</LineColor>
        <LinePattern>1</LinePattern>
        <Rounding>0</Rounding>
      </Line>
      <Fill>
        <FillForegnd>#FFFFFF</FillForegnd>
        <FillBkgnd>#FFFFFF</FillBkgnd>
        <FillPattern>1</FillPattern>
      </Fill>
      <TextBlock>
        <VerticalAlign>1</VerticalAlign>
      </TextBlock>
      <Character>
        <Font>1</Font>
        <Color>#000000</Color>
        <Size Unit="PT">8.5</Size>
      </Character>
      <Paragraph>
        <HorzAlign>1</HorzAlign>
      </Paragraph>
    </StyleSheet>
    <StyleSheet ID="1" Name="Text Only" NameU="Text Only" LineStyle="0" FillStyle="0" TextStyle="0">
      <Line>
        <LinePattern>0</LinePattern>
      </Line>
      <Fill>
        <FillPattern>0</FillPattern>
      </Fill>
    </StyleSheet>
    <StyleSheet ID="2" Name="None" NameU="None" LineStyle="0" FillStyle="0" TextStyle="0">
      <Line>
        <LinePattern>0</LinePattern>
      </Line>
      <Fill>
        <FillPattern>0</FillPattern>
      </Fill>
    </StyleSheet>
    <StyleSheet ID="3" Name="Normal" NameU="Normal" LineStyle="0" FillStyle="0" TextStyle="0">
      <Line>
        <LineWeight>0.0138889</LineWeight>
        <LineColor>#334155</LineColor>
        <LinePattern>1</LinePattern>
        <Rounding>0</Rounding>
      </Line>
      <Fill>
        <FillForegnd>#FFFFFF</FillForegnd>
        <FillBkgnd>#FFFFFF</FillBkgnd>
        <FillPattern>1</FillPattern>
      </Fill>
      <TextBlock>
        <VerticalAlign>1</VerticalAlign>
      </TextBlock>
      <Character>
        <Font>1</Font>
        <Color>#0F172A</Color>
        <Size Unit="PT">8.5</Size>
      </Character>
      <Paragraph>
        <HorzAlign>1</HorzAlign>
      </Paragraph>
    </StyleSheet>
    <StyleSheet ID="4" Name="Connector" NameU="Connector" LineStyle="3" FillStyle="3" TextStyle="3">
      <Line>
        <LineWeight>0.0125</LineWeight>
        <LineColor>#334155</LineColor>
        <LinePattern>1</LinePattern>
        <EndArrow>4</EndArrow>
        <EndArrowSize>1</EndArrowSize>
      </Line>
      <Fill>
        <FillPattern>0</FillPattern>
      </Fill>
      <TextBlock>
        <VerticalAlign>1</VerticalAlign>
        <TextBkgnd>1</TextBkgnd>
      </TextBlock>
      <Character>
        <Font>1</Font>
        <Color>#0F172A</Color>
        <Size Unit="PT">7.5</Size>
      </Character>
      <Paragraph>
        <HorzAlign>1</HorzAlign>
      </Paragraph>
    </StyleSheet>
  </StyleSheets>
  <Masters>
    <Master ID="1" NameU="Dynamic connector" Name="Dynamic connector" Prompt="Connects two shapes." MatchByName="0" IconSize="1" AlignName="2" PatternFlags="0">
      <Shapes>
        <Shape ID="5" Type="Shape" LineStyle="4" TextStyle="4">
          <XForm>
            <PinX>0</PinX>
            <PinY>0</PinY>
            <Width>1</Width>
            <Height>1</Height>
            <LocPinX>0</LocPinX>
            <LocPinY>0</LocPinY>
            <Angle>0</Angle>
          </XForm>
          <XForm1D>
            <BeginX>0</BeginX>
            <BeginY>0</BeginY>
            <EndX>1</EndX>
            <EndY>1</EndY>
          </XForm1D>
          <ShapeLayout>
            <ShapeRouteStyle>1</ShapeRouteStyle>
            <ShapeSplit>1</ShapeSplit>
          </ShapeLayout>
          <Layout>
            <ShapePermeableX>1</ShapePermeableX>
            <ShapePermeableY>1</ShapePermeableY>
          </Layout>
          <Line>
            <LineWeight>0.0125</LineWeight>
            <LineColor>#334155</LineColor>
            <LinePattern>1</LinePattern>
            <EndArrow>4</EndArrow>
            <EndArrowSize>1</EndArrowSize>
          </Line>
          <Geom IX="0">
            <NoFill>1</NoFill>
            <NoLine>0</NoLine>
            <NoShow>0</NoShow>
            <MoveTo IX="1"><X>0</X><Y>0</Y></MoveTo>
            <LineTo IX="2"><X F="Geometry1.X1">1</X><Y F="Geometry1.Y1">1</Y></LineTo>
          </Geom>
        </Shape>
      </Shapes>
    </Master>
  </Masters>
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
${connectorXmlLines.join('\n')}
${nodeXmlLines.join('\n')}
      </Shapes>
      <Connects>
${edgeConnectLines.join('\n')}
      </Connects>
    </Page>
  </Pages>
</VisioDocument>
`;
}
