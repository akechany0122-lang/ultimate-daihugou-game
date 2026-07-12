import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the stage2-background CSS to use the new image with full coverage
css_target = """    .stage2-background {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: radial-gradient(circle at center, #4A0E1B 0%, #1A050A 100%);
      z-index: -1;
    }"""
css_new = """    .stage2-background {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background-image: url('casino_table.jpg');
      background-size: 100% 100%; /* Force the wooden frame to fit the exact screen edges */
      background-position: center;
      background-repeat: no-repeat;
      z-index: -1;
      filter: brightness(0.85) contrast(1.1);
    }"""
content = content.replace(css_target, css_new)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated background to wooden table")
