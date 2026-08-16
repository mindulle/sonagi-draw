import glob

files = glob.glob('apps/web/src/Wired*.tsx')

for file in files:
    with open(file, 'r') as f:
        content = f.read()

    # remove " T," or "T," or ", T" or ",T"
    content = content.replace(' T, ', ' ').replace(', T ', ' ').replace(', T,', ',').replace(' T }', ' }')
    
    with open(file, 'w') as f:
        f.write(content)
