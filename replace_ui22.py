import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Zoom background out slightly
content = content.replace('transform: scale(1.6);', 'transform: scale(1.35);')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully zoomed out background to scale(1.35)")
