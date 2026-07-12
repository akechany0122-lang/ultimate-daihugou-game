import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Zoom background to exactly 1.15
content = content.replace('transform: scale(1.35);', 'transform: scale(1.15);')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully zoomed background to scale(1.15)")
