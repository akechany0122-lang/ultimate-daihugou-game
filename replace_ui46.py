import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

old_select_ui = """                  <div style={{ display: 'flex', gap: '30px' }}>
                    <div className="private-match-card-btn" style={{backgroundImage: "url('room home.png')"}} onClick={createRoom}>
                    </div>
                    <div className="private-match-card-btn" style={{backgroundImage: "url('room2.png')"}} onClick={() => setMultiplayerMode('search')}>
                    </div>
                  </div>"""

new_select_ui = """                  <div style={{ display: 'flex', gap: '30px' }}>
                    <div className="mode-btn-wrapper"
                         onMouseEnter={() => setHoveredMode('create_room')} onMouseLeave={() => setHoveredMode(null)}
                         onTouchStart={() => setHoveredMode('create_room')} onTouchEnd={() => setHoveredMode(null)}>
                      <div className="private-match-card-btn" style={{backgroundImage: "url('room home.png')"}} onClick={createRoom}></div>
                      <div className={`mode-description-inline ${hoveredMode === 'create_room' ? 'visible' : ''}`} style={{opacity: hoveredMode === 'create_room' ? 1 : 0, marginTop: '20px'}}>
                        ルームを作成してホストになる
                      </div>
                    </div>

                    <div className="mode-btn-wrapper"
                         onMouseEnter={() => setHoveredMode('find_room')} onMouseLeave={() => setHoveredMode(null)}
                         onTouchStart={() => setHoveredMode('find_room')} onTouchEnd={() => setHoveredMode(null)}>
                      <div className="private-match-card-btn" style={{backgroundImage: "url('room2.png')"}} onClick={() => setMultiplayerMode('search')}></div>
                      <div className={`mode-description-inline ${hoveredMode === 'find_room' ? 'visible' : ''}`} style={{opacity: hoveredMode === 'find_room' ? 1 : 0, marginTop: '20px'}}>
                        ルーム番号を入力して入室する
                      </div>
                    </div>
                  </div>"""

content = content.replace(old_select_ui, new_select_ui)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully added hover descriptions to private match UI")
