import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Increase card size
content = content.replace('width: clamp(15px, 2.5vw, 40px);', 'width: clamp(40px, 5vw, 70px);')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully increased card size")
