import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Zoom background more
content = content.replace('transform: scale(1.3);', 'transform: scale(1.5);')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully zoomed background to scale(1.5)")
