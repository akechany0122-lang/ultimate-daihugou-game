window.addEventListener('requestInterstitialAd', function(e) {
    var onComplete = e.detail && e.detail.onComplete;
    var hasCompleted = false;

    // 二重発火を防止するためのラップ関数
    var complete = function() {
        if (!hasCompleted) {
            hasCompleted = true;
            if (onComplete) onComplete();
        }
    };

    // Google AdSense H5 Games Ads の adBreak が存在するか確認
    if (typeof adBreak !== 'undefined') {
        adBreak({
            type: 'next',
            name: 'game_result_interstitial',
            beforeAd: function() {
                // 広告表示直前（必要ならゲームの音をミュートするなどの処理をここに追加）
            },
            afterAd: function() {
                // 広告視聴完了、またはスキップされた場合
                complete();
            },
            adBreakDone: function(placementInfo) {
                // 広告表示プロセス自体が終了した時（広告が表示されなかった場合も含むため必須）
                complete();
            }
        });
    } else {
        // H5 Games Ads のタグが未ロード、またはAdBlock等でブロックされている場合はすぐに進行
        complete();
    }
});
