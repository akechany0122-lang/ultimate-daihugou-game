import sys
import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Reduce card size
css_target = """    .scattered-card {
      position: absolute;
      width: clamp(60px, 10vw, 120px);"""
css_new = """    .scattered-card {
      position: absolute;
      width: clamp(40px, 6vw, 80px);"""
content = content.replace(css_target, css_new)

# 2. Reposition cards to extreme edges
jsx_target = """<div className="scattered-cards-container animate-fade-in">
                    <img src="3image.webp" className="scattered-card" style={{top: '15%', left: '10%', transform: 'rotate(-20deg)'}} alt="" />
                    <img src="5image.webp" className="scattered-card" style={{top: '5%', left: '30%', transform: 'rotate(15deg)'}} alt="" />
                    <img src="7image.webp" className="scattered-card" style={{bottom: '15%', left: '15%', transform: 'rotate(45deg)'}} alt="" />
                    <img src="9image.webp" className="scattered-card" style={{bottom: '25%', left: '35%', transform: 'rotate(-10deg)'}} alt="" />
                    <img src="Jimage.webp" className="scattered-card" style={{top: '10%', right: '20%', transform: 'rotate(-35deg)'}} alt="" />
                    <img src="Kimage.webp" className="scattered-card" style={{top: '30%', right: '10%', transform: 'rotate(25deg)'}} alt="" />
                    <img src="Aimage.webp" className="scattered-card" style={{bottom: '10%', right: '30%', transform: 'rotate(10deg)'}} alt="" />
                    <img src="2image.webp" className="scattered-card" style={{bottom: '20%', right: '10%', transform: 'rotate(-55deg)'}} alt="" />
                    <img src="joker.webp" className="scattered-card" style={{top: '40%', left: '5%', transform: 'rotate(80deg)'}} alt="" />
                  </div>"""

jsx_new = """<div className="scattered-cards-container animate-fade-in">
                    <img src="3image.webp" className="scattered-card" style={{top: '10%', left: '5%', transform: 'rotate(-20deg)'}} alt="" />
                    <img src="5image.webp" className="scattered-card" style={{top: '25%', left: '2%', transform: 'rotate(15deg)'}} alt="" />
                    <img src="7image.webp" className="scattered-card" style={{bottom: '15%', left: '5%', transform: 'rotate(45deg)'}} alt="" />
                    <img src="9image.webp" className="scattered-card" style={{bottom: '5%', left: '20%', transform: 'rotate(-10deg)'}} alt="" />
                    <img src="Jimage.webp" className="scattered-card" style={{top: '10%', right: '8%', transform: 'rotate(-35deg)'}} alt="" />
                    <img src="Kimage.webp" className="scattered-card" style={{top: '35%', right: '3%', transform: 'rotate(25deg)'}} alt="" />
                    <img src="Aimage.webp" className="scattered-card" style={{bottom: '15%', right: '5%', transform: 'rotate(10deg)'}} alt="" />
                    <img src="2image.webp" className="scattered-card" style={{bottom: '5%', right: '25%', transform: 'rotate(-55deg)'}} alt="" />
                    <img src="joker.webp" className="scattered-card" style={{top: '5%', left: '20%', transform: 'rotate(80deg)'}} alt="" />
                  </div>"""
content = content.replace(jsx_target, jsx_new)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully reduced card size and moved to edges")
