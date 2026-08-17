import os

with open('apps/web/src/CustomMainMenu.tsx', 'r') as f:
    content = f.read()

# Replace the drawing curve logic
old_draw = """        // Draw emotion curve line connecting the dots
        journeyShapes.push({
            id: createShapeId(), type: 'draw', x: 425, y: emotions[0] + 10,
            props: {
                color: 'black', size: 'm',
                segments: [{ type: 'free', points: [
                    { x: 0, y: 0, z: 0.5 },
                    { x: 250, y: emotions[1] - emotions[0], z: 0.5 },
                    { x: 500, y: emotions[2] - emotions[0], z: 0.5 },
                    { x: 750, y: emotions[3] - emotions[0], z: 0.5 }
                ]}]
            }
        })"""

new_draw = """        // Draw lines connecting the emotion dots
        for (let i = 0; i < emotions.length - 1; i++) {
            const startX = 300 + i * 250 + 125
            const startY = emotions[i] + 10
            const endX = startX + 250
            const endY = emotions[i+1] + 10
            
            journeyShapes.push({
                id: createShapeId(), type: 'arrow', x: startX, y: startY,
                props: {
                    color: 'black', size: 'm',
                    start: { x: 0, y: 0 },
                    end: { x: endX - startX, y: endY - startY },
                    arrowheadStart: 'none', arrowheadEnd: 'none'
                }
            })
        }"""

content = content.replace(old_draw, new_draw)

with open('apps/web/src/CustomMainMenu.tsx', 'w') as f:
    f.write(content)
