import os

def patch_file(filepath, class_name):
    with open(filepath, 'r') as f:
        content = f.read()

    insert_code = f"""
    override onResize(shape: any, info: any) {{
        return {{
            props: {{
                w: Math.max(50, info.initialBounds.w * info.scaleX),
                h: Math.max(50, info.initialBounds.h * info.scaleY),
            }}
        }} as any
    }}
"""
    if "override onResize" not in content:
        content = content.replace("override getGeometry", insert_code + "\n    override getGeometry")
        
        with open(filepath, 'w') as f:
            f.write(content)

patch_file('apps/web/src/WiredBarChartShape.tsx', 'WiredBarChartShape')
patch_file('apps/web/src/WiredDonutChartShape.tsx', 'WiredDonutChartShape')
