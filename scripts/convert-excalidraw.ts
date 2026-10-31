import fs from "node:fs";
import path from "node:path";

interface ExcalidrawElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle?: number;
  strokeColor?: string;
  backgroundColor?: string;
  fillStyle?: string;
  strokeWidth?: number;
  strokeStyle?: string;
  roughness?: number;
  opacity?: number;
  groupIds?: string[];
  roundness?: any;
  seed?: number;
  version?: number;
  versionNonce?: number;
  isDeleted?: boolean;
  boundElements?: any[];
  updated?: number;
  link?: string | null;
  locked?: boolean;
  text?: string;
  fontSize?: number;
  fontFamily?: number;
  textAlign?: string;
  verticalAlign?: string;
  baseline?: number;
  containerId?: string | null;
  originalText?: string;
  points?: [number, number][];
  startBinding?: any;
  endBinding?: any;
  startArrowhead?: string | null;
  endArrowhead?: string | null;
}

// Fractional indexing generator
function getIndex(i: number): string {
  return "a" + (i + 1).toString().padStart(4, "0");
}

function mapColor(hex: string | undefined): string {
  if (!hex || hex === "transparent") return "black";
  const h = hex.toLowerCase();
  if (h.includes("1e1e1e") || h.includes("000000") || h.includes("2b2b2b")) return "black";
  if (h.includes("red") || h.includes("e03131") || h.includes("ff6b6b")) return "red";
  if (h.includes("green") || h.includes("2f9e44") || h.includes("51cf66")) return "green";
  if (h.includes("blue") || h.includes("1971c2") || h.includes("339af0")) return "blue";
  if (h.includes("yellow") || h.includes("f08c00") || h.includes("fab005")) return "yellow";
  if (h.includes("violet") || h.includes("9c36b5") || h.includes("845ef7")) return "violet";
  if (h.includes("orange") || h.includes("e8590c") || h.includes("ff922b")) return "orange";
  if (h.includes("grey") || h.includes("gray") || h.includes("868e96")) return "grey";
  return "black";
}

export function convertExcalidrawToTldraw(elements: ExcalidrawElement[]): any {
  const shapes: any[] = [];
  const validElements = elements.filter((e) => !e.isDeleted);

  validElements.forEach((el, idx) => {
    const shapeId = `shape:${el.id.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    const index = getIndex(idx);
    const opacity = (el.opacity ?? 100) / 100;
    const color = mapColor(el.strokeColor);

    if (el.type === "rectangle" || el.type === "ellipse" || el.type === "diamond") {
      const geoType = el.type === "diamond" ? "rhombus" : el.type;
      shapes.push({
        id: shapeId,
        typeName: "shape",
        type: "geo",
        x: el.x,
        y: el.y,
        rotation: el.angle || 0,
        index,
        parentId: "page:page",
        isLocked: el.locked || false,
        opacity,
        props: {
          w: Math.max(10, el.width),
          h: Math.max(10, el.height),
          geo: geoType,
          color,
          labelColor: "black",
          fill: el.backgroundColor && el.backgroundColor !== "transparent" ? "semi" : "none",
          dash: el.strokeStyle === "dashed" ? "dashed" : el.strokeStyle === "dotted" ? "dotted" : "draw",
          size: el.strokeWidth && el.strokeWidth > 2 ? "l" : "m",
          font: "draw",
          text: "",
          align: "middle",
          verticalAlign: "middle",
          growY: 0,
          url: el.link || ""
        }
      });
    } else if (el.type === "text") {
      shapes.push({
        id: shapeId,
        typeName: "shape",
        type: "text",
        x: el.x,
        y: el.y,
        rotation: el.angle || 0,
        index,
        parentId: "page:page",
        isLocked: el.locked || false,
        opacity,
        props: {
          color,
          size: (el.fontSize || 16) > 24 ? "l" : (el.fontSize || 16) > 18 ? "m" : "s",
          font: "draw",
          textAlign: el.textAlign || "start",
          w: Math.max(20, el.width),
          text: el.text || "",
          scale: 1,
          autoSize: false
        }
      });
    } else if (el.type === "arrow" || el.type === "line") {
      const pts = el.points || [[0, 0], [el.width, el.height]];
      const startPt = pts[0] || [0, 0];
      const endPt = pts[pts.length - 1] || [el.width, el.height];

      shapes.push({
        id: shapeId,
        typeName: "shape",
        type: "arrow",
        x: el.x + startPt[0],
        y: el.y + startPt[1],
        rotation: el.angle || 0,
        index,
        parentId: "page:page",
        isLocked: el.locked || false,
        opacity,
        props: {
          color,
          fill: "none",
          dash: el.strokeStyle === "dashed" ? "dashed" : "draw",
          size: "m",
          start: { type: "point", x: 0, y: 0 },
          end: { type: "point", x: endPt[0] - startPt[0], y: endPt[1] - startPt[1] },
          arrowheadStart: el.startArrowhead ? "arrow" : "none",
          arrowheadEnd: el.endArrowhead ? "arrow" : el.type === "arrow" ? "arrow" : "none",
          text: el.text || "",
          labelPosition: 0.5,
          font: "draw"
        }
      });
    }
  });

  return {
    tldrawFileFormatVersion: 1,
    schema: {
      schemaVersion: 2,
      sequences: {
        "com.tldraw.store": 4,
        "com.tldraw.asset": 1,
        "com.tldraw.camera": 1,
        "com.tldraw.document": 2,
        "com.tldraw.instance": 25,
        "com.tldraw.instance_page_state": 5,
        "com.tldraw.page": 1,
        "com.tldraw.shape": 4,
        "com.tldraw.shape.geo": 9,
        "com.tldraw.shape.text": 2,
        "com.tldraw.shape.arrow": 5,
        "com.tldraw.shape.line": 1
      }
    },
    records: [
      {
        gridSize: 10,
        name: "",
        meta: {},
        id: "document:document",
        typeName: "document"
      },
      {
        id: "page:page",
        name: "Page 1",
        index: "a1",
        meta: {},
        typeName: "page"
      },
      ...shapes
    ]
  };
}
