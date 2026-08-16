import re

with open('apps/web/src/App.tsx', 'r') as f:
    content = f.read()

# 1. Add imports for Button, Card, Modal
content = content.replace(
    "import { WiredDonutChartShapeUtil } from './WiredDonutChartShape'",
    "import { WiredDonutChartShapeUtil } from './WiredDonutChartShape'\nimport { WiredButtonShapeUtil } from './WiredButtonShape'\nimport { WiredCardShapeUtil } from './WiredCardShape'\nimport { WiredModalShapeUtil } from './WiredModalShape'"
)

# 2. Add to customShapeUtils
content = content.replace(
    "WiredDonutChartShapeUtil as unknown as TLAnyShapeUtilConstructor]",
    "WiredDonutChartShapeUtil as unknown as TLAnyShapeUtilConstructor, WiredButtonShapeUtil as unknown as TLAnyShapeUtilConstructor, WiredCardShapeUtil as unknown as TLAnyShapeUtilConstructor, WiredModalShapeUtil as unknown as TLAnyShapeUtilConstructor]"
)

# 3. Replace insertDefaultComponent logic for button, card, modal
old_insert_logic = """        if (type === 'button') {
            editor.createShapes([
                { id: bgId, type: 'geo', x: center.x, y: center.y, props: { geo: 'rectangle', color: 'blue', fill: 'semi', w: 140, h: 48, size: 'm', richText: toRichText('Button') } },
            ] as any)
            safeGroup([bgId])
        } else if (type === 'card') {
            const imgId = createShapeId()
            editor.createShapes([
                { id: bgId, type: 'geo', x: center.x, y: center.y, props: { geo: 'rectangle', color: 'black', fill: 'none', w: 300, h: 250 } },
                { id: imgId, type: 'geo', x: center.x + 10, y: center.y + 10, props: { geo: 'rectangle', color: 'grey', fill: 'solid', w: 280, h: 140 } },
            ] as any)
            safeGroup([bgId, imgId])
        } else if (type === 'modal') {
            const overlayId = createShapeId()
            editor.createShapes([
                { id: bgId, type: 'geo', x: center.x, y: center.y, props: { geo: 'rectangle', color: 'black', fill: 'none', w: 500, h: 300 } },
                { id: overlayId, type: 'geo', x: center.x + 20, y: center.y + 220, props: { geo: 'rectangle', color: 'blue', fill: 'semi', w: 460, h: 60 } },
            ] as any)
            safeGroup([bgId, overlayId])
        } else if (type === 'wired-progress') {"""

new_insert_logic = """        if (type === 'button') {
            editor.createShapes([
                { id: bgId, type: 'wired-button', x: center.x, y: center.y, props: { w: 120, h: 48, text: 'Button', color: '#3b82f6' } }
            ] as any)
            editor.select(bgId)
        } else if (type === 'card') {
            editor.createShapes([
                { id: bgId, type: 'wired-card', x: center.x, y: center.y, props: { w: 240, h: 300, title: 'Card Title' } }
            ] as any)
            editor.select(bgId)
        } else if (type === 'modal') {
            editor.createShapes([
                { id: bgId, type: 'wired-modal', x: center.x, y: center.y, props: { w: 400, h: 250, title: 'Modal Window' } }
            ] as any)
            editor.select(bgId)
        } else if (type === 'wired-progress') {"""

content = content.replace(old_insert_logic, new_insert_logic)

# 4. Rename the category and simplify labels in BUILTIN_CATEGORIES
old_categories = """        {
            category: "기본 UI 컴포넌트",
            items: [
                { label: "Primary Button", type: "button", insert: insertDefaultComponent },
                { label: "Content Card", type: "card", insert: insertDefaultComponent },
                { label: "Modal Window", type: "modal", insert: insertDefaultComponent },
                { label: "Wired Progress (Smart)", type: "wired-progress", insert: insertDefaultComponent },
                { label: "Wired Data Table (Smart)", type: "wired-data-table", insert: insertDefaultComponent },
                { label: "Wired Toggle (Smart)", type: "wired-toggle", insert: insertDefaultComponent },
                { label: "Wired Checkbox (Smart)", type: "wired-checkbox", insert: insertDefaultComponent }
            ]
        },
        {
            category: "데이터 시각화",
            items: [
                { label: "Wired Bar Chart (Smart)", type: "wired-bar-chart", insert: insertDefaultComponent },
                { label: "Wired Donut Chart (Smart)", type: "wired-donut-chart", insert: insertDefaultComponent }
            ]
        }"""

new_categories = """        {
            category: "Wired UI 키트 (손그림)",
            items: [
                { label: "Button", type: "button", insert: insertDefaultComponent },
                { label: "Card", type: "card", insert: insertDefaultComponent },
                { label: "Modal Window", type: "modal", insert: insertDefaultComponent },
                { label: "Progress Bar", type: "wired-progress", insert: insertDefaultComponent },
                { label: "Data Table", type: "wired-data-table", insert: insertDefaultComponent },
                { label: "Toggle", type: "wired-toggle", insert: insertDefaultComponent },
                { label: "Checkbox", type: "wired-checkbox", insert: insertDefaultComponent }
            ]
        },
        {
            category: "Wired Charts (손그림 데이터)",
            items: [
                { label: "Bar Chart", type: "wired-bar-chart", insert: insertDefaultComponent },
                { label: "Donut Chart", type: "wired-donut-chart", insert: insertDefaultComponent }
            ]
        }"""

content = content.replace(old_categories, new_categories)

with open('apps/web/src/App.tsx', 'w') as f:
    f.write(content)
