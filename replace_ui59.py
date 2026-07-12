import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

old_touch_logic = """      const isSwipingRef = React.useRef(false); // スワイプ中判定
      const touchStartPos = React.useRef({ x: 0, y: 0 });
      const hasFlickedPlay = React.useRef(false);

      const handleTouchStart = (e) => {
        isSwipingRef.current = false;
        hasFlickedPlay.current = false;
        if (e && e.touches && e.touches.length > 0) {
          touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
      };

      const handleTouchMove = (e, playerIdx) => {
        if (!isMobile || playerIdx !== 0 || turn !== 0 || selectionMode || exchangePhase || hasFlickedPlay.current) return;
        isSwipingRef.current = true;
        const touch = e.touches[0];

        // フリック（上方向へのスライド）判定
        const deltaY = touchStartPos.current.y - touch.clientY; // 上にスワイプすると正
        const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);

        // Y方向へ50px以上、かつX方向の1.5倍以上の移動で「上フリック」とみなす
        if (deltaY > 50 && deltaY > deltaX * 1.5) {
          if (selectedCards.length > 0 && !isActionLoading && isValidPlay(selectedCards)) {
            handlePlay();
            hasFlickedPlay.current = true; // 1回のフリックで複数回発火しないようにする
          }
          return; // フリックと判定された場合はカード選択処理をスキップ
        }

        // Y方向の移動が大きい場合（フリックの途中）は横スワイプ選択をスキップ
        if (deltaY > 15 || deltaY < -15 || Math.abs(touchStartPos.current.y - touch.clientY) > deltaX) {
          return;
        }

        const elem = document.elementFromPoint(touch.clientX, touch.clientY);
        const cardElem = elem?.closest('.card.selectable');
        if (cardElem) {
          const cardId = cardElem.getAttribute('data-card-id');
          if (cardId && cardId !== lastTouchedId.current) {
            const card = hands[0].find(c => c.id === cardId);
            if (card) {
              sm.playLightPaperSE();
              // ユーザー要望：スワイプ中は「触れている位置のみ」を選択
              setSelectedCards([card]); 
              lastTouchedId.current = cardId;
            }
          }
        }
      };
      
      const handleTouchEnd = () => {
        lastTouchedId.current = null;
        // スワイプ終了後、少し待って判定をリセット
        setTimeout(() => { isSwipingRef.current = false; }, 50);
      };"""

new_pointer_logic = """      const isSwipingRef = React.useRef(false); // スワイプ中判定
      const touchStartPos = React.useRef({ x: 0, y: 0 });
      const hasFlickedPlay = React.useRef(false);

      const handlePointerDown = (e) => {
        isSwipingRef.current = false;
        hasFlickedPlay.current = false;
        // PCとモバイル両対応のためポインタ位置を記録
        touchStartPos.current = { x: e.clientX, y: e.clientY };
        try { e.target.setPointerCapture(e.pointerId); } catch(err) {}
      };

      const handlePointerMove = (e, playerIdx) => {
        if (playerIdx !== 0 || turn !== 0 || selectionMode || exchangePhase || hasFlickedPlay.current) return;
        // ドラッグ（マウスボタン押しっぱなし or タッチ中）のみ処理
        if (e.pointerType === 'mouse' && e.buttons === 0) return;
        
        isSwipingRef.current = true;

        // フリック（上方向へのスライド）判定
        const deltaY = touchStartPos.current.y - e.clientY; // 上にスワイプすると正
        const deltaX = Math.abs(e.clientX - touchStartPos.current.x);

        // Y方向へ50px以上、かつX方向の1.5倍以上の移動で「上フリック」とみなす
        if (deltaY > 50 && deltaY > deltaX * 1.5) {
          if (selectedCards.length > 0 && !isActionLoading && isValidPlay(selectedCards)) {
            handlePlay();
            hasFlickedPlay.current = true; // 1回のフリックで複数回発火しないようにする
          }
          return; // フリックと判定された場合はカード選択処理をスキップ
        }

        // Y方向の移動が大きい場合（フリックの途中）は横スワイプ選択をスキップ
        if (deltaY > 15 || deltaY < -15 || Math.abs(touchStartPos.current.y - e.clientY) > deltaX) {
          return;
        }

        const elem = document.elementFromPoint(e.clientX, e.clientY);
        const cardElem = elem?.closest('.card.selectable');
        if (cardElem) {
          const cardId = cardElem.getAttribute('data-card-id');
          if (cardId && cardId !== lastTouchedId.current) {
            const card = hands[0].find(c => c.id === cardId);
            if (card) {
              sm.playLightPaperSE();
              // ユーザー要望：スワイプ中は「触れている位置のみ」を選択
              setSelectedCards([card]); 
              lastTouchedId.current = cardId;
            }
          }
        }
      };
      
      const handlePointerUp = (e) => {
        try { e.target.releasePointerCapture(e.pointerId); } catch(err) {}
        lastTouchedId.current = null;
        // スワイプ終了後、少し待って判定をリセット
        setTimeout(() => { isSwipingRef.current = false; }, 50);
      };"""

if old_touch_logic in content:
    content = content.replace(old_touch_logic, new_pointer_logic)
else:
    print("Error: Could not find old_touch_logic")
    sys.exit(1)

old_jsx = """            onTouchStart={handleTouchStart}
            onTouchMove={(e) => handleTouchMove(e, playerIdx)}
            onTouchEnd={handleTouchEnd}"""

new_jsx = """            onPointerDown={handlePointerDown}
            onPointerMove={(e) => handlePointerMove(e, playerIdx)}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ touchAction: 'none' }}"""

if old_jsx in content:
    content = content.replace(old_jsx, new_jsx)
else:
    print("Error: Could not find old_jsx")
    sys.exit(1)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully replaced touch events with pointer events")
