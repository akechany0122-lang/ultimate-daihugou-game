import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Swap background images
content = content.replace("url('online.png')", "url('room home.png')")
content = content.replace("url('mulch.png')", "url('room2.png')")

# Update gap to be a bit tighter if they want them neatly side-by-side
content = content.replace("gap: '5vw'", "gap: '30px'")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully swapped UI images for private match")
