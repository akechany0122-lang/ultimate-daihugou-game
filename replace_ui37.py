import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Original lines
k_old = """<img src="Kimage.webp" className="scattered-card" style={{top: '55%', right: '5%', transform: 'rotate(-30deg)'}} alt="" />"""
a_old = """<img src="Aimage.webp" className="scattered-card" style={{bottom: '12%', left: '20%', transform: 'rotate(60deg)'}} alt="" />"""
two_old = """<img src="2image.webp" className="scattered-card" style={{bottom: '8%', right: '18%', transform: 'rotate(-75deg)'}} alt="" />"""

# New lines
k_new = """<img src="Kimage.webp" className="scattered-card" style={{top: '55%', right: '5%', transform: 'rotate(-30deg)', zIndex: 11}} alt="" />"""
a_new = """<img src="Aimage.webp" className="scattered-card" style={{bottom: '15%', left: '6%', transform: 'rotate(40deg)'}} alt="" />"""
two_new = """<img src="2image.webp" className="scattered-card" style={{top: '58%', right: '7%', transform: 'rotate(-15deg)', zIndex: 12}} alt="" />"""

# Replace
content = content.replace(k_old, k_new)
content = content.replace(a_old, a_new)
content = content.replace(two_old, two_new)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated positions for K, A, and 2 cards")
