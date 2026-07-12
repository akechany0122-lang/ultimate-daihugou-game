import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

jsx_start = content.find('{/* Stage 2: モード選択状態 */}')
jsx_end = content.find("{multiplayerMode === 'connecting' && (", jsx_start)

if jsx_start == -1 or jsx_end == -1:
    print("Markers not found!")
    sys.exit(1)

new_jsx = """              {/* Stage 2: モード選択状態 */}
              {titleStage === 2 && (
                <>
                  <div className="mode-select-container three-columns animate-fade-in" style={{gap: '20px', alignItems: 'center'}}>
                    {/* Online Play Image Button */}
                    <img 
                      src="online.png" 
                      alt="Online Play"
                      className="mode-image-button"
                      onClick={() => alert('Online Playは準備中です')}
                    />

                    {/* Multi Play Image Button */}
                    <img 
                      src="mulch.png" 
                      alt="Multi Play"
                      className="mode-image-button"
                      onClick={() => setMultiplayerMode('connecting')}
                    />

                    {/* CPU Play Image Button */}
                    <img 
                      src="CPU.png" 
                      alt="CPU Play"
                      className="mode-image-button"
                      onClick={startDealAnimation}
                    />
                  </div>

                  <div className="mode-aux-buttons left-aligned animate-fade-in">
                    <button className="btn-back" onClick={() => setTitleStage(1)}>
                      <span>◀ 戻る</span>
                    </button>
                  </div>
                </>
              )}
"""

content = content[:jsx_start] + new_jsx + "\n" + content[jsx_end:]

# Add CSS for mode-image-button if not present
css_to_add = """
    .mode-image-button {
      flex: 1;
      width: 100%;
      height: auto;
      max-width: 300px;
      cursor: pointer;
      border-radius: 12px;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .mode-image-button:hover {
      transform: translateY(-8px) scale(1.03);
      filter: drop-shadow(0 15px 25px rgba(212, 175, 55, 0.4));
    }
"""

css_idx = content.find("</style>")
content = content[:css_idx] + css_to_add + "\n  " + content[css_idx:]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully replaced SVG buttons with image buttons")
