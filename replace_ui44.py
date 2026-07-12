import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update the Search UI buttons
old_search_ui = """              {multiplayerMode === 'search' && (
                <div className="selection-overlay-ui" style={{width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'transparent'}}>
                  <div className="selection-guide">ルーム番号を入力</div>
                  <input type="text" className="passphrase-input" placeholder="4桁の数字..." 
                    value={passphrase} onChange={(e) => setPassphrase(e.target.value)} />
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <button className="action-btn" onClick={() => initMultiplayer(passphrase)}>入室</button>
                    <button className="action-btn btn-pass" onClick={() => setMultiplayerMode('select')}>戻る</button>
                  </div>
                </div>
              )}"""

new_search_ui = """              {multiplayerMode === 'search' && (
                <div className="selection-overlay-ui" style={{width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'transparent'}}>
                  <div className="selection-guide" style={{color: 'var(--color-gold)', textShadow: '0 0 15px rgba(212, 175, 55, 0.5)', fontSize: '1.8rem', marginBottom: '30px', letterSpacing: '2px'}}>ルーム番号を入力</div>
                  <input type="text" className="passphrase-input" placeholder="4桁の数字..." 
                    value={passphrase} onChange={(e) => setPassphrase(e.target.value)} style={{fontSize: '1.5rem', padding: '15px 20px', width: '280px', borderRadius: '10px', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8), 0 0 15px rgba(212, 175, 55, 0.3)', marginBottom: '40px'}} />
                  <div style={{ display: 'flex', gap: '30px' }}>
                    <button className="action-btn btn-confirm" style={{width: '160px'}} onClick={() => initMultiplayer(passphrase)}>入室</button>
                    <button className="action-btn btn-pass" style={{width: '160px'}} onClick={() => setMultiplayerMode('select')}>戻る</button>
                  </div>
                </div>
              )}"""
content = content.replace(old_search_ui, new_search_ui)


# 2. Update the Lobby UI buttons
# Note: The Lobby UI is located inside the game-root, not in title-screen. Let's find it.
old_lobby_ui = """              {multiplayerMode === 'lobby' && (
                <div className="selection-overlay-ui" style={{ zIndex: 6000 }}>
                  <div className="selection-guide">待機中 (ルーム番号: {passphrase})</div>
                  <div className="player-lobby-list" style={{ margin: '20px 0', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto', width: '300px' }}>
                    {remotePlayers.map((p, idx) => (
                      <div key={idx} style={{ padding: '8px', background: 'rgba(255,255,255,0.1)', borderLeft: '3px solid var(--color-gold)', textAlign: 'left' }}>
                        {idx === 0 ? "👑 " : "💀 "} {p.name} {p.id === 'local' ? "(あなた)" : ""}
                      </div>
                    ))}
                    {Array.from({ length: 4 - remotePlayers.length }).map((_, i) => (
                      <div key={`empty-${i}`} style={{ padding: '8px', background: 'rgba(0,0,0,0.3)', color: '#555', borderLeft: '3px solid #333', textAlign: 'left' }}>
                        待機中 (CPU)
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    {isHost ? (
                      <button className="action-btn" onClick={startMultiplayerGame}>ゲームを開始</button>
                    ) : (
                      <div style={{ color: 'var(--color-gold)', animation: 'pulse-gold 1s infinite alternate' }}>ホストの開始を待機しています</div>
                    )}
                    <button className="action-btn btn-pass" onClick={() => { peer?.destroy(); setMultiplayerMode(null); }}>解散</button>
                  </div>
                </div>
              )}"""

new_lobby_ui = """              {multiplayerMode === 'lobby' && (
                <div className="selection-overlay-ui" style={{ zIndex: 6000, background: 'rgba(10,10,10,0.95)', padding: '40px', borderRadius: '15px', border: '2px solid var(--color-gold)', boxShadow: '0 0 50px rgba(0,0,0,1)' }}>
                  <div className="selection-guide" style={{color: 'var(--color-gold)', textShadow: '0 0 15px rgba(212, 175, 55, 0.5)', fontSize: '1.8rem', marginBottom: '10px', letterSpacing: '2px'}}>待機中</div>
                  <div style={{fontFamily: "'Courier New', monospace", fontSize: '1.4rem', color: '#fff', marginBottom: '20px', padding: '10px 20px', background: '#000', borderRadius: '8px', border: '1px solid #333'}}>ルーム番号: <span style={{color: 'var(--color-blood)', fontWeight: 'bold'}}>{passphrase}</span></div>
                  <div className="player-lobby-list" style={{ margin: '10px 0 30px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto', width: '300px' }}>
                    {remotePlayers.map((p, idx) => (
                      <div key={idx} style={{ padding: '12px 15px', background: 'rgba(255,255,255,0.05)', borderLeft: '4px solid var(--color-gold)', textAlign: 'left', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{fontSize: '1.2rem'}}>{idx === 0 ? "👑" : "💀"}</span> <span style={{fontWeight: 'bold', fontSize: '1.1rem'}}>{p.name}</span> <span style={{color: '#888', fontSize: '0.9rem'}}>{p.id === 'local' ? "(あなた)" : ""}</span>
                      </div>
                    ))}
                    {Array.from({ length: 4 - remotePlayers.length }).map((_, i) => (
                      <div key={`empty-${i}`} style={{ padding: '12px 15px', background: 'rgba(0,0,0,0.4)', color: '#666', borderLeft: '4px solid #333', textAlign: 'left', borderRadius: '4px' }}>
                        待機中... (CPU枠)
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '30px', justifyContent: 'center' }}>
                    {isHost ? (
                      <button className="action-btn btn-confirm" style={{width: '180px'}} onClick={startMultiplayerGame}>ゲームを開始</button>
                    ) : (
                      <div style={{ color: 'var(--color-gold)', animation: 'pulse-gold 1s infinite alternate', display: 'flex', alignItems: 'center' }}>ホストの開始を待機しています...</div>
                    )}
                    <button className="action-btn btn-pass" style={{width: '120px'}} onClick={() => { peer?.destroy(); setMultiplayerMode(null); }}>解散</button>
                  </div>
                </div>
              )}"""
content = content.replace(old_lobby_ui, new_lobby_ui)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully redesigned search and lobby UIs to match game buttons")
