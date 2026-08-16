import glob
import re

files = glob.glob('apps/web/src/Wired*.tsx')

for file in files:
    with open(file, 'r') as f:
        content = f.read()

    type_match = re.search(r"static override type = '([^']+)'", content)
    if not type_match:
        continue
    
    type_name = type_match.group(1)
    camel_name = ''.join(word.title() for word in type_name.split('-'))
    
    import_stmt = f"import {{ {camel_name}Props, {camel_name}Migrations }} from '@sonagi-draw/schema'\n"
    content = import_stmt + content
    
    props_regex = r"static override props:\s*RecordProps<[^>]+>\s*=\s*\{.*?\n    \}"
    replacement = f"static override props: RecordProps<any> = {camel_name}Props as any\n    static override migrations = {camel_name}Migrations"
    content = re.sub(props_regex, replacement, content, flags=re.DOTALL)
    
    with open(file, 'w') as f:
        f.write(content)
