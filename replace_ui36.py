import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Increase card size slightly
content = content.replace('width: clamp(40px, 5vw, 70px);', 'width: clamp(55px, 7vw, 90px);')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully increased card size slightly")
