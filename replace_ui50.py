import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

old_room_num = """<div style={{fontFamily: "'Courier New', monospace", fontSize: '1.4rem', color: '#fff', marginBottom: '20px', padding: '10px 20px', background: '#000', borderRadius: '8px', border: '1px solid #333'}}>ルーム番号: <span style={{color: 'var(--color-blood)', fontWeight: 'bold'}}>{passphrase}</span></div>"""
new_room_num = """<div style={{fontFamily: "'Courier New', monospace", fontSize: '1.4rem', color: '#fff', marginBottom: '20px', padding: '10px 20px', background: '#000', borderRadius: '8px', border: '1px solid #333'}}>ルーム番号: <span style={{color: 'var(--color-gold)', fontWeight: 'bold'}}>{passphrase}</span></div>"""

old_player_list = """<div className="player-lobby-list" style={{ margin: '10px 0 30px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto', width: '300px' }}>"""
new_player_list = """<div className="player-lobby-list" style={{ margin: '10px 0 30px', display: 'flex', flexDirection: 'column', gap: '10px', width: '300px' }}>"""

content = content.replace(old_room_num, new_room_num)
content = content.replace(old_player_list, new_player_list)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated room number color and removed player list scroll limits")
