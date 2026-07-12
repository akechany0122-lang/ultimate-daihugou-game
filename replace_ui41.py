import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Change private-match-card-btn size to match the square mode-image-button
old_css = """    .private-match-card-btn {
      position: relative;
      width: clamp(200px, 25vw, 280px);
      height: clamp(280px, 35vw, 400px);"""
new_css = """    .private-match-card-btn {
      position: relative;
      width: clamp(210px, 30vw, 260px);
      height: clamp(210px, 30vw, 260px);"""
content = content.replace(old_css, new_css)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated private match button sizes to square")
