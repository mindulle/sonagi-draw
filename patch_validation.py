import os
import re

# Fix CustomMainMenu.tsx
with open('apps/web/src/CustomMainMenu.tsx', 'r') as f:
    content = f.read()

# Add toRichText helper
to_rich_text_fn = """
const toRichText = (text: string) => {
    return {
        type: 'doc',
        content: text.split('\\n').map(line => line ? { type: 'paragraph', content: [{ type: 'text', text: line }] } : { type: 'paragraph', content: [] })
    }
}
"""

if "const toRichText" not in content:
    content = content.replace('const apply4TabsTemplate = () => {', to_rich_text_fn + '\n    const apply4TabsTemplate = () => {')

content = content.replace("props: { text: '1. 앱 실행'", "props: { richText: toRichText('1. 앱 실행')")
content = content.replace("props: { text: '2. 로그인'", "props: { richText: toRichText('2. 로그인')")
content = content.replace("props: { text: '긍정적 감정 😄'", "props: { richText: toRichText('긍정적 감정 😄')")
content = content.replace("props: { text: '1. Clean & Minimal UI\\n2. Bold Typography\\n3. High Contrast'", "props: { richText: toRichText('1. Clean & Minimal UI\\n2. Bold Typography\\n3. High Contrast')")

with open('apps/web/src/CustomMainMenu.tsx', 'w') as f:
    f.write(content)


# Fix libraryTemplates.ts
with open('apps/web/src/libraryTemplates.ts', 'r') as f:
    content = f.read()

content = content.replace("props: { text: '로그인 / 회원가입'", "props: { richText: toRichText('로그인 / 회원가입')")
content = content.replace("props: { text: '비밀번호를 잊으셨나요?'", "props: { richText: toRichText('비밀번호를 잊으셨나요?')")
content = content.replace("props: { text: 'Idea 1'", "props: { richText: toRichText('Idea 1')")
content = content.replace("props: { text: 'Idea 2'", "props: { richText: toRichText('Idea 2')")
content = content.replace("props: { text: 'Idea 3'", "props: { richText: toRichText('Idea 3')")
content = content.replace("props: { text: 'Idea 4'", "props: { richText: toRichText('Idea 4')")
content = content.replace("props: { text: 'Idea 5'", "props: { richText: toRichText('Idea 5')")

# Remove color from text props which might also be unsupported for plain text
content = content.replace("props: { color: 'yellow', richText: toRichText('Idea 1') }", "props: { color: 'yellow', richText: toRichText('Idea 1') }")

with open('apps/web/src/libraryTemplates.ts', 'w') as f:
    f.write(content)
