import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Update Search UI buttons
old_search_btns = """                  <div style={{ display: 'flex', gap: '30px' }}>
                    <button className="action-btn btn-confirm" style={{width: '160px'}} onClick={() => initMultiplayer(passphrase)}>入室</button>
                    <button className="action-btn btn-pass" style={{width: '160px'}} onClick={() => setMultiplayerMode('select')}>戻る</button>
                  </div>"""

new_search_btns = """                  <div style={{ display: 'flex', gap: '30px' }}>
                    <button className="action-btn btn-confirm mystic-btn" onClick={() => initMultiplayer(passphrase)}>
                      <span className="mystic-btn-text">入室</span>
                    </button>
                    <button className="action-btn btn-pass mystic-btn" onClick={() => setMultiplayerMode('select')}>
                      <span className="mystic-btn-text">戻る</span>
                    </button>
                  </div>"""
content = content.replace(old_search_btns, new_search_btns)


# Update Lobby UI buttons
old_lobby_btns = """                  <div style={{ display: 'flex', gap: '30px', justifyContent: 'center' }}>
                    {isHost ? (
                      <button className="action-btn btn-confirm" style={{width: '180px'}} onClick={startMultiplayerGame}>ゲームを開始</button>
                    ) : (
                      <div style={{ color: 'var(--color-gold)', animation: 'pulse-gold 1s infinite alternate', display: 'flex', alignItems: 'center' }}>ホストの開始を待機しています...</div>
                    )}
                    <button className="action-btn btn-pass" style={{width: '120px'}} onClick={() => { peer?.destroy(); setMultiplayerMode(null); }}>解散</button>
                  </div>"""

new_lobby_btns = """                  <div style={{ display: 'flex', gap: '30px', justifyContent: 'center' }}>
                    {isHost ? (
                      <button className="action-btn btn-confirm mystic-btn" onClick={startMultiplayerGame}>
                        <span className="mystic-btn-text">ゲームを開始</span>
                      </button>
                    ) : (
                      <div style={{ color: 'var(--color-gold)', animation: 'pulse-gold 1s infinite alternate', display: 'flex', alignItems: 'center' }}>ホストの開始を待機しています...</div>
                    )}
                    <button className="action-btn btn-pass mystic-btn" onClick={() => { peer?.destroy(); setMultiplayerMode(null); }}>
                      <span className="mystic-btn-text">解散</span>
                    </button>
                  </div>"""
content = content.replace(old_lobby_btns, new_lobby_btns)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully applied mystic-btn styling to search and lobby buttons")
