import glob
import re

files = glob.glob('apps/web/src/Wired*.tsx')
types = []

imports = []
exports = []

for file in files:
    with open(file, 'r') as f:
        content = f.read()
        # Find static override props: RecordProps<WiredCardShape> = { ... }
        match = re.search(r'static override props: RecordProps<[^>]+>\s*=\s*(\{.*?\n    \})', content, re.DOTALL)
        if match:
            props_str = match.group(1)
            # find type name
            type_match = re.search(r"static override type = '([^']+)'", content)
            if type_match:
                type_name = type_match.group(1)
                
                # convert type name to camel case
                camel_name = ''.join(word.title() for word in type_name.split('-'))
                
                # remove "T." and change it to the actual object representation if needed, but we can just import T
                props_str = props_str.replace("T.", "T.")
                
                exports.append(f"""
export const {camel_name}Props = {props_str}

export const {camel_name}Migrations = createShapePropsMigrationSequence({{
    sequence: []
}})
""")
                types.append(type_name)

output = """import { T } from '@tldraw/validate'
import { createShapePropsMigrationSequence } from '@tldraw/tlschema'

""" + "\n".join(exports) + """

export const customShapeSchemas = {
"""

for t in types:
    camel_name = ''.join(word.title() for word in t.split('-'))
    output += f"    '{t}': {{ migrations: {camel_name}Migrations, props: {camel_name}Props }},\n"

output += "}\n"

with open('apps/sync-server/src/customShapes.ts', 'w') as f:
    f.write(output)

print("Generated customShapes.ts")
