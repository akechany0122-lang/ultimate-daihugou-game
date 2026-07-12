import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the stage2-background CSS properly
target_css = """    .stage2-background {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background-image: url('oval_casino_table.jpg');
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center center;
      background-color: #0a0505;
      z-index: -1;
      filter: brightness(0.85) contrast(1.1);
    }"""

new_css = """    .stage2-background {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background-image: url('oval_casino_table.jpg');
      background-size: cover;
      background-repeat: no-repeat;
      background-position: center center;
      background-color: #0a0505;
      z-index: -1;
      transform: scale(1.6);
      filter: brightness(0.85) contrast(1.1);
    }"""

content = content.replace(target_css, new_css)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully applied correct background-size and transform zoom")
