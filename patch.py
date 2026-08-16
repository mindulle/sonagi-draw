import re

with open('apps/web/src/App.tsx', 'r') as f:
    content = f.read()

# 1. Add imports
content = content.replace(
    "import { WiredCheckboxShapeUtil } from './WiredCheckboxShape'",
    "import { WiredCheckboxShapeUtil } from './WiredCheckboxShape'\nimport { WiredBarChartShapeUtil } from './WiredBarChartShape'\nimport { WiredDonutChartShapeUtil } from './WiredDonutChartShape'"
)

# 2. Add to customShapeUtils
content = content.replace(
    "WiredCheckboxShapeUtil as unknown as TLAnyShapeUtilConstructor]",
    "WiredCheckboxShapeUtil as unknown as TLAnyShapeUtilConstructor, WiredBarChartShapeUtil as unknown as TLAnyShapeUtilConstructor, WiredDonutChartShapeUtil as unknown as TLAnyShapeUtilConstructor]"
)

# 3. Add to insertDefaultComponent
insert_code = """        } else if (type === 'wired-bar-chart') {
            editor.createShapes([
                { id: bgId, type: 'wired-bar-chart', x: center.x, y: center.y, props: { w: 300, h: 200, color: '#3b82f6', values: "40, 80, 55, 90, 30" } }
            ] as any)
            editor.select(bgId)
        } else if (type === 'wired-donut-chart') {
            editor.createShapes([
                { id: bgId, type: 'wired-donut-chart', x: center.x, y: center.y, props: { w: 200, h: 200, color: '#10b981', values: "30, 40, 20, 10" } }
            ] as any)
            editor.select(bgId)
        } else if (type === 'wired-data-table') {"""
content = content.replace("        } else if (type === 'wired-data-table') {", insert_code)

# 4. Add category to BUILTIN_CATEGORIES
category_code = """        {
            category: "데이터 시각화",
            items: [
                { label: "Wired Bar Chart (Smart)", type: "wired-bar-chart", insert: insertDefaultComponent },
                { label: "Wired Donut Chart (Smart)", type: "wired-donut-chart", insert: insertDefaultComponent }
            ]
        },
        {
            category: "레이아웃 & 디바이스","""
content = content.replace('        {\n            category: "레이아웃 & 디바이스",', category_code)

with open('apps/web/src/App.tsx', 'w') as f:
    f.write(content)
