import sys
import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update .mode-image-button size
content = content.replace('max-width: 300px;', 'max-width: 210px;')

# 2. Make sure top-right icons are placed right after title-screen
icons_block = """
              {/* 右上の共通アイコン */}
              <div className="top-right-icon-buttons animate-fade-in" style={{zIndex: 1000}}>
                <button className="icon-btn" onClick={() => alert('設定は準備中です')} title="設定">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                </button>
                <button className="icon-btn" onClick={() => setShowExplanation(true)} title="ルール説明">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
                  </svg>
                </button>
              </div>
"""

# Try to remove the old top-right-icon-buttons block if it's there
old_icons_start = content.find('<div className="top-right-icon-buttons')
if old_icons_start != -1:
    # Find the next two </div> closing tags
    end_div_1 = content.find('</div>', old_icons_start)
    end_div_2 = content.find('</div>', end_div_1 + 6)
    end_div_3 = content.find('</div>', end_div_2 + 6) # one for main div, two for buttons inside? Wait.
    # Actually, <div class..><button><svg.../></button><button><svg.../></button></div>
    # The end of the block is the next </div> that matches the outer div.
    # Since there are no divs inside the buttons, the first </div> after old_icons_start is the closing tag.
    old_icons_end = content.find('</div>', old_icons_start) + 6
    content = content[:old_icons_start] + content[old_icons_end:]

# Also try to remove the common comment if it's there
content = content.replace('{/* 右上の共通アイコン */}\n              ', '')

# Insert the new block right after <div className="title-screen">
title_screen_idx = content.find('<div className="title-screen">')
if title_screen_idx != -1:
    insert_pos = title_screen_idx + len('<div className="title-screen">')
    content = content[:insert_pos] + icons_block + content[insert_pos:]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated icons and button sizes")
