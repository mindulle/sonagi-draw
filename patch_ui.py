import re

with open('apps/web/src/App.tsx', 'r') as f:
    content = f.read()

# 1. Add import
if "getLibraryIcon" not in content:
    content = content.replace(
        "import { insertLayoutComponent",
        "import { getLibraryIcon } from './libraryIcons'\nimport { insertLayoutComponent"
    )

# 2. Update rendering logic
old_render = """                            {openCategories[category] && items.map((item, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => {
                                        item.insert(editor, item.type)
                                        if (isMobile) setIsOpen(false)
                                    }} 
                                    style={{ padding: '8px', background: 'white', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '12px', fontWeight: 500, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                                >
                                    {item.label}
                                </button>
                            ))}"""

new_render = """                            {openCategories[category] && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '4px' }}>
                                    {items.map((item, idx) => (
                                        <button 
                                            key={idx}
                                            onClick={() => {
                                                item.insert(editor, item.type)
                                                if (isMobile) setIsOpen(false)
                                            }} 
                                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 8px', background: 'white', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', gap: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', transition: 'all 0.1s' }}
                                            onMouseOver={e => Object.assign(e.currentTarget.style, { background: '#f9fafb', borderColor: '#9ca3af', transform: 'translateY(-1px)' })}
                                            onMouseOut={e => Object.assign(e.currentTarget.style, { background: 'white', borderColor: '#d1d5db', transform: 'none' })}
                                            title={item.label}
                                        >
                                            <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {getLibraryIcon(item.type)}
                                            </div>
                                            <span style={{ fontSize: '11px', textAlign: 'center', lineHeight: '1.2', color: '#4b5563', fontWeight: 500, fontFamily: 'inherit' }}>{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}"""

content = content.replace(old_render, new_render)

with open('apps/web/src/App.tsx', 'w') as f:
    f.write(content)
