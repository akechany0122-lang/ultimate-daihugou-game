import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update onClick handler for Multi Play button
content = content.replace("onClick={() => setMultiplayerMode('connecting')}", "onClick={() => setMultiplayerMode('select')}")

# 2. Update initMultiplayer and add createRoom
old_init = """const initMultiplayer = (pass) => {
        if (!pass) return alert("合言葉を入力してください");
        setPassphrase(pass);
        setMultiplayerMode('lobby'); // 待機画面へ即座に移動
        
        const hostId = "ultimate-daihugou-" + btoa(pass).replace(/=/g, "");
        const p = new Peer();
        setPeer(p);

        p.on('open', (id) => {
          console.log('Peer open:', id);
          // Try to connect to host
          const conn = p.connect(hostId);
          setGuestConn(conn);
          
          const timeout = setTimeout(() => {
            if (!conn.open) {
              console.log('Host not found, becoming host...');
              p.destroy();
              startAsHost(hostId);
            }
          }, 2000); // 待機時間を少し短縮

          conn.on('open', () => {
            clearTimeout(timeout);
            setIsHost(false);
            setMultiplayerMode('lobby');
            conn.send({ type: 'JOIN', name: 'Player' });
          });

          conn.on('data', (data) => handleMultiplayerData(data));
          conn.on('close', () => alert("ホストとの接続切断"));
        });
      };"""
      
new_init = """const createRoom = () => {
        const roomNum = Math.floor(1000 + Math.random() * 9000).toString();
        setPassphrase(roomNum);
        const hostId = "ultimate-daihugou-" + btoa(roomNum).replace(/=/g, "");
        startAsHost(hostId);
        setMultiplayerMode('lobby');
      };

      const initMultiplayer = (pass) => {
        if (!pass) return alert("ルーム番号を入力してください");
        setPassphrase(pass);
        
        const hostId = "ultimate-daihugou-" + btoa(pass).replace(/=/g, "");
        const p = new Peer();
        setPeer(p);

        p.on('open', (id) => {
          const conn = p.connect(hostId);
          setGuestConn(conn);
          
          const timeout = setTimeout(() => {
            if (!conn.open) {
              alert("ルームが見つかりません");
              p.destroy();
              setMultiplayerMode('search');
            }
          }, 3000);

          conn.on('open', () => {
            clearTimeout(timeout);
            setIsHost(false);
            setMultiplayerMode('lobby');
            conn.send({ type: 'JOIN', name: 'Player' });
          });

          conn.on('data', (data) => handleMultiplayerData(data));
          conn.on('close', () => { alert("ホストとの接続切断"); setMultiplayerMode(null); });
        });
      };"""
content = content.replace(old_init, new_init)

# 3. Update Connecting UI to Select and Search UI
old_ui = """{multiplayerMode === 'connecting' && (
                <div className="selection-overlay-ui">
                  <div className="selection-guide">合言葉を入力</div>
                  <input type="text" className="passphrase-input" placeholder="合言葉..." 
                    value={passphrase} onChange={(e) => setPassphrase(e.target.value)} />
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <button className="action-btn" onClick={() => initMultiplayer(passphrase)}>接続</button>
                    <button className="action-btn btn-pass" onClick={() => setMultiplayerMode(null)}>戻る</button>
                  </div>
                </div>
              )}"""
              
new_ui = """{multiplayerMode === 'select' && (
                <div className="selection-overlay-ui">
                  <div className="selection-guide">プライベートマッチ</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                    <button className="btn-start-game" style={{margin: '0 auto'}} onClick={createRoom}>ルームを作る</button>
                    <button className="btn-start-game" style={{margin: '0 auto'}} onClick={() => setMultiplayerMode('search')}>ルームを探す</button>
                    <button className="btn-start-game" style={{ background: 'rgba(0,0,0,0.5)', borderColor: '#555', margin: '0 auto', color: '#aaa', width: '200px' }} onClick={() => setMultiplayerMode(null)}>戻る</button>
                  </div>
                </div>
              )}

              {multiplayerMode === 'search' && (
                <div className="selection-overlay-ui">
                  <div className="selection-guide">ルーム番号を入力</div>
                  <input type="text" className="passphrase-input" placeholder="4桁の数字..." 
                    value={passphrase} onChange={(e) => setPassphrase(e.target.value)} />
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <button className="action-btn" onClick={() => initMultiplayer(passphrase)}>入室</button>
                    <button className="action-btn btn-pass" onClick={() => setMultiplayerMode('select')}>戻る</button>
                  </div>
                </div>
              )}"""
content = content.replace(old_ui, new_ui)

# 4. Update Lobby text
content = content.replace("待機中 (合言葉:", "待機中 (ルーム番号:")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully applied private match refactor")
