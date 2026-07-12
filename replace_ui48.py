import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Hide the spinning circles and indicators during lobby
old_indicators = """              {/* 強さの逆転と順序逆転の永続的インジケーター表示 */}
              <div className={`bg-reverse-indicator ${playDirection === 1 ? 'spin-clockwise' : 'spin-counter-clockwise'}`}></div>
              <div className={`bg-jback-indicator ${is11Back ? 'active' : ''}`}></div>
              <div className={`bg-revolution-indicator ${isRevolution ? 'active' : ''}`}></div>"""

new_indicators = """              {/* 強さの逆転と順序逆転の永続的インジケーター表示 */}
              {multiplayerMode !== 'lobby' && (
                <>
                  <div className={`bg-reverse-indicator ${playDirection === 1 ? 'spin-clockwise' : 'spin-counter-clockwise'}`}></div>
                  <div className={`bg-jback-indicator ${is11Back ? 'active' : ''}`}></div>
                  <div className={`bg-revolution-indicator ${isRevolution ? 'active' : ''}`}></div>
                </>
              )}"""

content = content.replace(old_indicators, new_indicators)

# 2. Move lobby UI further down and ensure NO drop shadow
old_lobby_ui = """              {multiplayerMode === 'lobby' && (
                <div className="selection-overlay-ui" style={{ zIndex: 6000, background: 'transparent', padding: '40px', marginTop: '4vh' }}>"""

new_lobby_ui = """              {multiplayerMode === 'lobby' && (
                <div className="selection-overlay-ui" style={{ zIndex: 6000, background: 'transparent', padding: '40px', marginTop: '22vh', boxShadow: 'none', border: 'none' }}>"""

content = content.replace(old_lobby_ui, new_lobby_ui)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully moved lobby down and hid rotating circles")
