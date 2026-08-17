import re

with open('apps/web/src/App.tsx', 'r') as f:
    content = f.read()

# 1. Add imports
content = content.replace(
    "import { WiredModalShapeUtil } from './WiredModalShape'",
    "import { WiredModalShapeUtil } from './WiredModalShape'\nimport { WiredMobileFrameShapeUtil } from './WiredMobileFrameShape'\nimport { WiredBrowserFrameShapeUtil } from './WiredBrowserFrameShape'\nimport { WiredUserFlowNodeShapeUtil } from './WiredUserFlowNodeShape'\nimport { WiredAnnotationPinShapeUtil } from './WiredAnnotationPinShape'"
)

# 2. Add to customShapeUtils
content = content.replace(
    "WiredModalShapeUtil as unknown as TLAnyShapeUtilConstructor]",
    "WiredModalShapeUtil as unknown as TLAnyShapeUtilConstructor, WiredMobileFrameShapeUtil as unknown as TLAnyShapeUtilConstructor, WiredBrowserFrameShapeUtil as unknown as TLAnyShapeUtilConstructor, WiredUserFlowNodeShapeUtil as unknown as TLAnyShapeUtilConstructor, WiredAnnotationPinShapeUtil as unknown as TLAnyShapeUtilConstructor]"
)

with open('apps/web/src/App.tsx', 'w') as f:
    f.write(content)
