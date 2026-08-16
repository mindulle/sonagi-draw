import re

with open('apps/web/src/App.tsx', 'r') as f:
    content = f.read()

# Add imports
content = content.replace(
    "import { WiredModalShapeUtil } from './WiredModalShape'",
    "import { WiredModalShapeUtil } from './WiredModalShape'\nimport { WiredContainerShapeUtil } from './WiredContainerShape'\nimport { WiredInputShapeUtil } from './WiredInputShape'"
)

# Add to customShapeUtils
content = content.replace(
    "WiredModalShapeUtil as unknown as TLAnyShapeUtilConstructor,",
    "WiredModalShapeUtil as unknown as TLAnyShapeUtilConstructor, WiredContainerShapeUtil as unknown as TLAnyShapeUtilConstructor, WiredInputShapeUtil as unknown as TLAnyShapeUtilConstructor,"
)

with open('apps/web/src/App.tsx', 'w') as f:
    f.write(content)
