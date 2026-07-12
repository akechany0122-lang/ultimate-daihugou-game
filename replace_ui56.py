import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

block_to_move = """              {/* 右上の共通アイコン */}
              {!gameStarted && (<div className="top-right-icon-buttons animate-fade-in" style={{zIndex: 10000}}>
                <button className="icon-btn" onClick={fetchLeaderboard} title="ランキング">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 20h20"></path>
                    <path d="M19 17L22 7l-5 3-5-6-5 6-5-3 3 10"></path>
                  </svg>
                </button>
                <button className="icon-btn" onClick={() => { setTempProfileName(myProfile?.display_name || 'YOU'); setShowProfileSettings(true); }} title="プロフィール設定">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </button>
                <button className="icon-btn" onClick={() => setShowExplanation(true)} title="ルール説明">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
                  </svg>
                </button>
              </div>)}
"""

# 1. Remove the block from its current location
content = content.replace(block_to_move, "")

# 2. Insert it back right before {showProfileSettings && (
target = "{showProfileSettings && ("
new_target = block_to_move + "\n" + target

content = content.replace(target, new_target)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully moved top-right-icon-buttons to the root level of game-container")
