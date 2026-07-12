import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update background to simple solid/gradient
css_target = "background: url('casino_table.jpg') no-repeat center center;\n      background-size: cover;\n      z-index: -1;\n      filter: brightness(0.65) contrast(1.1);"
css_new = "background: radial-gradient(circle at center, #4A0E1B 0%, #1A050A 100%);\n      z-index: -1;"
content = content.replace(css_target, css_new)

# 2. Remove scattered cards JSX
# Find the start and end of the scattered cards block
start_marker = "{/* Scattered Cards on Table */}"
end_marker = "</div>\n\n                  <div className=\"mode-select-container"

start_idx = content.find(start_marker)
# Find the closing div of the scattered-cards-container
if start_idx != -1:
    # Look for the start of the next div
    end_idx = content.find('<div className="mode-select-container', start_idx)
    if end_idx != -1:
        # We want to delete from start_idx up to end_idx (leaving the end_idx content)
        content = content[:start_idx] + content[end_idx:]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully removed scattered cards and simplified background")
