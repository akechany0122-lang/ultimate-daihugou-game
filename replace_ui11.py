import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update .stage2-background CSS
css_old = """    .stage2-background {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: radial-gradient(circle at center, #4A0E1B 0%, #1A050A 100%);
      z-index: -1;
    }"""
css_new = """    .stage2-background {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background-image: url('casino_table.jpg');
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center center;
      background-color: #0a0505;
      z-index: -1;
      filter: brightness(0.85) contrast(1.1);
    }"""
content = content.replace(css_old, css_new)

# 2. Extract top-right-icon-buttons from Stage 2 and move it to be common
# We need to find the top-right-icon-buttons block
icons_start = content.find('<div className="top-right-icon-buttons animate-fade-in">')
icons_end = content.find('</div>\n\n                  <div className="mode-select-container', icons_start)

if icons_start != -1 and icons_end != -1:
    icons_block = content[icons_start:icons_end+6] # +6 for </div>
    
    # Remove from Stage 2
    content = content[:icons_start] + content[icons_end+6:]
    
    # Remove the old btn-card-guide block
    card_guide_start = content.find('{/* Stage共通: 右側のカード説明ボタン (Stage 1のみ表示) */}')
    card_guide_end = content.find('</button>\n              )}', card_guide_start)
    
    if card_guide_start != -1 and card_guide_end != -1:
        # We replace the old card guide block with our new icons_block (so it's common)
        content = content[:card_guide_start] + "{/* 右上の共通アイコン */}\n              " + icons_block + "\n" + content[card_guide_end+18:]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated background to contained casino table and made icons common")
