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
  if (subtitle.length > 50) {
    subtitle = subtitle.substring(0, 47) + '...';
  }

  return { title: label, subtitle };
}

/**
 * Generates an official Microsoft Visio XML Drawing (.vdx / DatadiagramML) file
 * from Svelte Flow nodes and edges.
 *
 * Uses light pastel cards, dark high-contrast typography, and explicit 1-D connectors
 * with high-visibility solid lines, arrowheads, and cardinal snap connection points.
 *
 * Fully compatible with Microsoft Visio 2003/2007/2010/2013/2016/2019/365,
 * draw.io / diagrams.net, and Lucidchart.
 */
export function generateVisioVdx(
  nodes: Node[],
  edges: Edge[],
  docSettings?: VxmlDocSettings
): string {
  // Scale factor: 96 pixels per inch
  const DPI = 96;
  const nodeWidthIn = 2.4;
  const nodeHeightIn = 1.1;
  const marginIn = 1.0;

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

  const contentWidthIn = Math.max((maxX - minX) / DPI + nodeWidthIn, 8);
  const contentHeightIn = Math.max((maxY - minY) / DPI + nodeHeightIn, 6);

  const pageWidthIn = Math.max(11.0, contentWidthIn + marginIn * 2);
  const pageHeightIn = Math.max(8.5, contentHeightIn + marginIn * 2);

  // Map node IDs to Visio 1-based shape IDs
  const nodeShapeIdMap = new Map<string, number>();
  let currentShapeId = 1;

  const shapeXmlLines: string[] = [];

  // Generate Visio shape for each node
  for (const node of nodes) {
    const shapeId = currentShapeId++;
    nodeShapeIdMap.set(node.id, shapeId);

    const style = getNodeStyle(node.type || 'vxml-block');
    const { title, subtitle } = getNodeText(node);

    // Coordinate conversion: Visio Y axis starts from bottom-left
    const xIn = (node.position.x - minX) / DPI + marginIn + nodeWidthIn / 2;
    const yIn = pageHeightIn - ((node.position.y - minY) / DPI + marginIn + nodeHeightIn / 2);

    const roundingIn = style.isPill ? 0.45 : 0.08;
    const combinedText = subtitle ? `${title}&#x0A;${subtitle}` : title;

    shapeXmlLines.push(`        <!-- Node: ${escapeXml(node.id)} -->`);
    shapeXmlLines.push(`        <Shape ID="${shapeId}" Type="Shape" LineStyle="3" FillStyle="3" TextStyle="3">`);
    shapeXmlLines.push('          <XForm>');
    shapeXmlLines.push(`            <PinX Unit="IN">${xIn.toFixed(4)}</PinX>`);
    shapeXmlLines.push(`            <PinY Unit="IN">${yIn.toFixed(4)}</PinY>`);
    shapeXmlLines.push(`            <Width Unit="IN">${nodeWidthIn.toFixed(4)}</Width>`);
    shapeXmlLines.push(`            <Height Unit="IN">${nodeHeightIn.toFixed(4)}</Height>`);
    shapeXmlLines.push('            <LocPinX F="Width*0.5">1.2</LocPinX>');
    shapeXmlLines.push('            <LocPinY F="Height*0.5">0.55</LocPinY>');
    shapeXmlLines.push('            <Angle>0</Angle>');
    shapeXmlLines.push('          </XForm>');
    shapeXmlLines.push('          <Line>');
    shapeXmlLines.push(`            <LineColor>${style.borderColor}</LineColor>`);
    shapeXmlLines.push('            <LineWeight Unit="PT">2.0</LineWeight>');
    shapeXmlLines.push('            <LinePattern>1</LinePattern>');
    shapeXmlLines.push(`            <Rounding Unit="IN">${roundingIn.toFixed(2)}</Rounding>`);
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
    shapeXmlLines.push('            <Size Unit="PT">9.5</Size>');
    shapeXmlLines.push('            <Style>1</Style>'); // Bold title text
    shapeXmlLines.push('          </Character>');

    // 4 Cardinal Connection Points for smart connector snapping
    shapeXmlLines.push('          <Connection IX="0">');
    shapeXmlLines.push('            <X F="Width*0.5">1.2</X>');
    shapeXmlLines.push('            <Y F="Height*1">1.1</Y>');
    shapeXmlLines.push('          </Connection>');
    shapeXmlLines.push('          <Connection IX="1">');
    shapeXmlLines.push('            <X F="Width*0.5">1.2</X>');
    shapeXmlLines.push('            <Y F="Height*0">0</Y>');
    shapeXmlLines.push('          </Connection>');
    shapeXmlLines.push('          <Connection IX="2">');
    shapeXmlLines.push('            <X F="Width*0">0</X>');
    shapeXmlLines.push('            <Y F="Height*0.5">0.55</Y>');
    shapeXmlLines.push('          </Connection>');
    shapeXmlLines.push('          <Connection IX="3">');
    shapeXmlLines.push('            <X F="Width*1">2.4</X>');
    shapeXmlLines.push('            <Y F="Height*0.5">0.55</Y>');
    shapeXmlLines.push('          </Connection>');

    if (style.isDiamond) {
      // Decision diamond path for conditional branching
      shapeXmlLines.push('          <Geom IX="0">');
      shapeXmlLines.push('            <NoFill>0</NoFill>');
      shapeXmlLines.push('            <NoLine>0</NoLine>');
      shapeXmlLines.push('            <MoveTo IX="1"><X F="Width*0.5">1.2</X><Y F="Height*1">1.1</Y></MoveTo>');
      shapeXmlLines.push('            <LineTo IX="2"><X F="Width*1">2.4</X><Y F="Height*0.5">0.55</Y></LineTo>');
      shapeXmlLines.push('            <LineTo IX="3"><X F="Width*0.5">1.2</X><Y F="Height*0">0</Y></LineTo>');
      shapeXmlLines.push('            <LineTo IX="4"><X F="Width*0">0</X><Y F="Height*0.5">0.55</Y></LineTo>');
      shapeXmlLines.push('            <LineTo IX="5"><X F="Geometry1.X1">1.2</X><Y F="Geometry1.Y1">1.1</Y></LineTo>');
      shapeXmlLines.push('          </Geom>');
    } else {
      // Standard rounded rectangular block path
      shapeXmlLines.push('          <Geom IX="0">');
      shapeXmlLines.push('            <NoFill>0</NoFill>');
      shapeXmlLines.push('            <NoLine>0</NoLine>');
      shapeXmlLines.push('            <MoveTo IX="1"><X F="Width*0">0</X><Y F="Height*0">0</Y></MoveTo>');
      shapeXmlLines.push('            <LineTo IX="2"><X F="Width*1">2.4</X><Y F="Height*0">0</Y></LineTo>');
      shapeXmlLines.push('            <LineTo IX="3"><X F="Width*1">2.4</X><Y F="Height*1">1.1</Y></LineTo>');
      shapeXmlLines.push('            <LineTo IX="4"><X F="Width*0">0</X><Y F="Height*1">1.1</Y></LineTo>');
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

    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);

    if (!sourceNode || !targetNode) continue;

    const shapeId = currentShapeId++;

    const x1 = (sourceNode.position.x - minX) / DPI + marginIn + nodeWidthIn / 2;
    const y1 = pageHeightIn - ((sourceNode.position.y - minY) / DPI + marginIn + nodeHeightIn / 2);
    const x2 = (targetNode.position.x - minX) / DPI + marginIn + nodeWidthIn / 2;
    const y2 = pageHeightIn - ((targetNode.position.y - minY) / DPI + marginIn + nodeHeightIn / 2);

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angleRad = Math.atan2(dy, dx);

    const edgeLabel = edge.label ? String(edge.label) : (edge.sourceHandle || '');

    shapeXmlLines.push(`        <!-- 1-D Dynamic Connector: ${escapeXml(edge.id)} (${edge.source} -> ${edge.target}) -->`);
    shapeXmlLines.push(`        <Shape ID="${shapeId}" Type="Shape" LineStyle="3" TextStyle="3">`);
    shapeXmlLines.push('          <XForm>');
    shapeXmlLines.push(`            <PinX F="(BeginX+EndX)/2">${midX.toFixed(4)}</PinX>`);
    shapeXmlLines.push(`            <PinY F="(BeginY+EndY)/2">${midY.toFixed(4)}</PinY>`);
    shapeXmlLines.push(`            <Width F="SQRT((EndX-BeginX)^2+(EndY-BeginY)^2)">${length.toFixed(4)}</Width>`);
    shapeXmlLines.push('            <Height Unit="IN">0</Height>');
    shapeXmlLines.push(`            <LocPinX F="Width*0.5">${(length / 2).toFixed(4)}</LocPinX>`);
    shapeXmlLines.push('            <LocPinY F="Height*0.5">0</LocPinY>');
    shapeXmlLines.push(`            <Angle F="ATAN2(EndY-BeginY,EndX-BeginX)">${angleRad.toFixed(4)}</Angle>`);
    shapeXmlLines.push('          </XForm>');
    shapeXmlLines.push('          <XForm1D>');
    shapeXmlLines.push(`            <BeginX Unit="IN">${x1.toFixed(4)}</BeginX>`);
    shapeXmlLines.push(`            <BeginY Unit="IN">${y1.toFixed(4)}</BeginY>`);
    shapeXmlLines.push(`            <EndX Unit="IN">${x2.toFixed(4)}</EndX>`);
    shapeXmlLines.push(`            <EndY Unit="IN">${y2.toFixed(4)}</EndY>`);
    shapeXmlLines.push('          </XForm1D>');
    shapeXmlLines.push('          <Line>');
    shapeXmlLines.push('            <LineColor>#334155</LineColor>'); // High-contrast dark slate (Slate-700)
    shapeXmlLines.push('            <LineWeight Unit="PT">2.0</LineWeight>'); // Crisp 2pt thickness
    shapeXmlLines.push('            <LinePattern>1</LinePattern>'); // Solid line
    shapeXmlLines.push('            <EndArrow>4</EndArrow>'); // 4 = Standard filled arrowhead in Visio
    shapeXmlLines.push('            <EndArrowSize>2</EndArrowSize>');
    shapeXmlLines.push('          </Line>');
    if (edgeLabel) {
      shapeXmlLines.push(`          <Text><cp IX="0"/><pp IX="0"/>${escapeXml(edgeLabel)}</Text>`);
      shapeXmlLines.push('          <Paragraph IX="0">');
      shapeXmlLines.push('            <HorzAlign>1</HorzAlign>');
      shapeXmlLines.push('          </Paragraph>');
      shapeXmlLines.push('          <Character IX="0">');
      shapeXmlLines.push('            <Font>1</Font>');
      shapeXmlLines.push('            <Color>#0F172A</Color>'); // Dark, readable text
      shapeXmlLines.push('            <Size Unit="PT">8.5</Size>');
      shapeXmlLines.push('            <Style>1</Style>'); // Bold
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

    // Glue connections to source and target shape pins
    edgeConnectLines.push(`        <Connect FromSheet="${shapeId}" FromCell="BeginX" FromPart="9" ToSheet="${sourceShapeId}" ToCell="PinX" ToPart="3"/>`);
    edgeConnectLines.push(`        <Connect FromSheet="${shapeId}" FromCell="EndX" FromPart="9" ToSheet="${targetShapeId}" ToCell="PinX" ToPart="3"/>`);
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
