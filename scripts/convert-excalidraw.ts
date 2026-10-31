import { defaultShapeUtils, createTLStore, getIndexBetween } from "tldraw";

const storeInstance = createTLStore({ shapeUtils: defaultShapeUtils });
const Geo = defaultShapeUtils.find(u => u.type === "geo")!;
const defaultGeoProps = new Geo(storeInstance.schema).getDefaultProps();
const Text = defaultShapeUtils.find(u => u.type === "text")!;
const defaultTextProps = new Text(storeInstance.schema).getDefaultProps();
const Arrow = defaultShapeUtils.find(u => u.type === "arrow")!;
const defaultArrowProps = new Arrow(storeInstance.schema).getDefaultProps();

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
  opacity?: number;
  locked?: boolean;
  text?: string;
  fontSize?: number;
  textAlign?: string;
  points?: [number, number][];
  startArrowhead?: string | null;
  endArrowhead?: string | null;
  link?: string | null;
  isDeleted?: boolean;
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

function makeRichText(rawText: string) {
  if (!rawText) {
    return {
      type: "doc",
      content: [{ type: "paragraph" }]
    };
  }
  const lines = rawText.split("\n");
  const paragraphs = lines.map(line => ({
    type: "paragraph",
    content: line ? [{ type: "text", text: line }] : []
  }));
  return {
    type: "doc",
    content: paragraphs
  };
}

function sanitizeUrl(link: string | null | undefined): string {
  if (!link) return "";
  if (link.startsWith("http://") || link.startsWith("https://")) return link;
  return "";
}

export function convertExcalidrawToTldraw(elements: ExcalidrawElement[]): any {
  const pageIndex = getIndexBetween(null, null);
  let currentIndex = pageIndex;

  const storeDict: Record<string, any> = {
    "document:document": {
      id: "document:document",
      typeName: "document",
      gridSize: 10,
      name: "",
      meta: {}
    },
    "page:page": {
      id: "page:page",
      typeName: "page",
      name: "Page 1",
      index: pageIndex,
      meta: {}
    }
  };

  const validElements = elements.filter((e) => !e.isDeleted);

  validElements.forEach((el) => {
    const shapeId = `shape:${el.id.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    currentIndex = getIndexBetween(currentIndex, null);
    const index = currentIndex;
    const opacity = (el.opacity ?? 100) / 100;
    const color = mapColor(el.strokeColor);

    if (el.type === "rectangle" || el.type === "ellipse" || el.type === "diamond") {
      const geoType = el.type === "diamond" ? "rhombus" : el.type;
      storeDict[shapeId] = {
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
        meta: {},
        props: {
          ...defaultGeoProps,
          w: Math.max(20, el.width),
          h: Math.max(20, el.height),
          geo: geoType,
          color,
          fill: el.backgroundColor && el.backgroundColor !== "transparent" ? "semi" : "none",
          dash: el.strokeStyle === "dashed" ? "dashed" : "draw",
          url: sanitizeUrl(el.link)
        }
      };
    } else if (el.type === "text") {
      let textAlign: "start" | "middle" | "end" = "start";
      if (el.textAlign === "center") textAlign = "middle";
      else if (el.textAlign === "right") textAlign = "end";

      storeDict[shapeId] = {
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
        meta: {},
        props: {
          ...defaultTextProps,
          color,
          size: (el.fontSize || 16) > 24 ? "l" : (el.fontSize || 16) > 18 ? "m" : "s",
          textAlign,
          w: Math.max(30, el.width),
          autoSize: false,
          richText: makeRichText(el.text || "")
        }
      };
    } else if (el.type === "arrow" || el.type === "line") {
      const pts = el.points || [[0, 0], [el.width, el.height]];
      const startPt = pts[0] || [0, 0];
      const endPt = pts[pts.length - 1] || [el.width, el.height];

      storeDict[shapeId] = {
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
        meta: {},
        props: {
          ...defaultArrowProps,
          color,
          dash: el.strokeStyle === "dashed" ? "dashed" : "draw",
          start: { x: 0, y: 0 },
          end: { x: endPt[0] - startPt[0], y: endPt[1] - startPt[1] },
          arrowheadStart: el.startArrowhead ? "arrow" : "none",
          arrowheadEnd: el.endArrowhead ? "arrow" : el.type === "arrow" ? "arrow" : "none",
          richText: makeRichText(el.text || "")
        }
      };
    }
  });

  return {
    schema: storeInstance.schema.serialize(),
    store: storeDict
  };
}
