import os

def patch_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    insert_code = """
    override onResize(shape: any, info: any) {
        return {
            props: {
                w: Math.max(50, info.initialBounds.w * info.scaleX),
                h: Math.max(50, info.initialBounds.h * info.scaleY),
            }
        } as any
    }
"""
    if "override onResize" not in content and "override getGeometry" in content:
        content = content.replace("override getGeometry", insert_code + "\n    override getGeometry")
        with open(filepath, 'w') as f:
            f.write(content)

patch_file('apps/web/src/WiredProgressShape.tsx')
patch_file('apps/web/src/WiredDataTableShape.tsx')
patch_file('apps/web/src/WiredToggleShape.tsx')
patch_file('apps/web/src/WiredCheckboxShape.tsx')
