import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix card size
css_target = """    .scattered-card {
      position: absolute;
      width: clamp(80px, 12vw, 150px);
      height: auto;
      border-radius: 8px;
      box-shadow: 5px 10px 25px rgba(0,0,0,0.8);
      z-index: 5;
      pointer-events: none;
      filter: brightness(0.7) contrast(1.2);
    }"""
css_new = """    .scattered-card {
      position: absolute;
      width: clamp(20px, 3.5vw, 55px);
      height: auto;
      border-radius: 4px;
      box-shadow: 2px 4px 10px rgba(0,0,0,0.8);
      z-index: 5;
      pointer-events: none;
      filter: brightness(0.7) contrast(1.2);
    }"""
    
# Wait, let's just do a simpler replace in case the other properties differ slightly
import re
content = re.sub(r'width: clamp\([^\)]+\);', 'width: clamp(20px, 3.5vw, 55px);', content)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully forced card size reduction")
