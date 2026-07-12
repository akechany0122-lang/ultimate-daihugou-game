import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

old_lobby_ui = """              {multiplayerMode === 'lobby' && (
                <div className="selection-overlay-ui" style={{ zIndex: 6000, background: 'rgba(10,10,10,0.95)', padding: '40px', borderRadius: '15px', border: '2px solid var(--color-gold)', boxShadow: '0 0 50px rgba(0,0,0,1)' }}>
                  <div className="selection-guide" style={{color: 'var(--color-gold)', textShadow: '0 0 15px rgba(212, 175, 55, 0.5)', fontSize: '1.8rem', marginBottom: '10px', letterSpacing: '2px'}}>待機中</div>"""

new_lobby_ui = """              {multiplayerMode === 'lobby' && (
                <div className="selection-overlay-ui" style={{ zIndex: 6000, background: 'transparent', padding: '40px', marginTop: '4vh' }}>
                  <div className="selection-guide" style={{color: 'var(--color-gold)', textShadow: '0 0 15px rgba(212, 175, 55, 0.5)', fontSize: '1.8rem', marginBottom: '10px', letterSpacing: '2px'}}>待機中</div>"""

content = content.replace(old_lobby_ui, new_lobby_ui)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully removed lobby border and background, and moved it slightly down")
