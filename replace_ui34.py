import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Only replace the specific old size
content = content.replace('width: clamp(80px, 12vw, 150px);', 'width: clamp(15px, 2.5vw, 40px);')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully reduced card size safely")
