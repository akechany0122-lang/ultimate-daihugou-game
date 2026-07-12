import sys
import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Reduce card size even further
css_target = """    .scattered-card {
      position: absolute;
      width: clamp(10px, 2vw, 30px);"""
css_new = """    .scattered-card {
      position: absolute;
      width: clamp(8px, 1.5vw, 20px);"""
content = content.replace(css_target, css_new)

# 2. Reposition cards 3 and 5 to the right of the logo and overlap them
jsx_target = """<div className="scattered-cards-container animate-fade-in">
                    <img src="3image.webp" className="scattered-card" style={{top: '42%', left: '40%', transform: 'rotate(-10deg)'}} alt="" />
                    <img src="5image.webp" className="scattered-card" style={{top: '38%', right: '35%', transform: 'rotate(35deg)'}} alt="" />"""
                    
jsx_new = """<div className="scattered-cards-container animate-fade-in">
                    <img src="5image.webp" className="scattered-card" style={{top: '12vh', right: '22%', transform: 'rotate(15deg)', zIndex: 11}} alt="" />
                    <img src="3image.webp" className="scattered-card" style={{top: '14vh', right: '20%', transform: 'rotate(-10deg)', zIndex: 12}} alt="" />"""

# Let's ensure we find the exact block and replace it correctly
# I'll just use simple replace for the specific lines to be safe
content = content.replace("""<img src="3image.webp" className="scattered-card" style={{top: '42%', left: '40%', transform: 'rotate(-10deg)'}} alt="" />""",
                          """<img src="3image.webp" className="scattered-card" style={{top: '14vh', right: '20%', transform: 'rotate(-10deg)', zIndex: 12}} alt="" />""")
                          
content = content.replace("""<img src="5image.webp" className="scattered-card" style={{top: '38%', right: '35%', transform: 'rotate(35deg)'}} alt="" />""",
                          """<img src="5image.webp" className="scattered-card" style={{top: '12vh', right: '22%', transform: 'rotate(15deg)', zIndex: 11}} alt="" />""")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully reduced card size and moved 3 and 5 to the right of the logo")
