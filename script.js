const symbols = [
    'images/susi.png',
    'images/supuraro-ra-.png',
    'images/ritta-4k.png',
    'images/bakesuro.png',
    'images/supuramanyu-ba-.png',
    'images/paburo.png',
    'images/haidoranto.png',
    'images/Sburasuta-.png',
    'images/torasuto.png',
    'images/dentaru.png'
];
const reels = [
    document.getElementById('slot1'),
    document.getElementById('slot2'),
    document.getElementById('slot3')
];
const slotContainer = document.querySelector('.slot-container');
const startStopButton = document.getElementById('startStopButton');
const messageDisplay = document.getElementById('message');
const PROMOTION_CHANCE = 0.3;
// ... 既存の変数定義の下に追加 ...

const videoOverlay = document.getElementById('video-overlay');
const youtubePlayer = document.getElementById('youtube-player');

// 当たり動画のYouTube ID (元: .../embed/Z3L3exgHDeQ?si=...)
const YOUTUBE_WIN_ID = 'Z3L3exgHDeQ';

// ハズレ動画のYouTube ID (元: .../embed/aoB5OROYHOg?si=...)
const YOUTUBE_LOSE_ID = 'J7fkUFhpRoU';

// 動画の再生時間 (YouTubeプレイヤー側で再生が終わるのを検知できないため、時間で制御します)
const YOUTUBE_DURATION_MS = 26000; // 26秒に設定 (動画の長さに合わせて調整)


let isSpinning = false;
let stopCount = 0;
let intervals = [];

/*回転 */
function spinReel(reel, index) {
    const reelImage = reel.querySelector('img');

    const interval = setInterval(() => {
        // symbols配列からランダムに数字を選び、表示を更新
        const randomIndex = Math.floor(Math.random() * symbols.length);
        const selectedPath = symbols[randomIndex];

        // ★imgのsrc更新ではなく、textContentを更新
        reelImage.src = selectedPath;

        // data-valueには数字そのものを設定
        const selectedDigit = String(randomIndex); // '0'から'9'
        reel.setAttribute('data-value', selectedDigit);

    }, 100);

    intervals[index] = interval;
}


/**
 * スロット操作ボタンを一時的に無効化する
 */
function disableControls() {
    startStopButton.disabled = true;
}

/**
 * スロット操作ボタンを有効化する
 */
function enableControls() {
    startStopButton.disabled = false;
}

// 【新しい関数の追加】
/* WIN時のアナウンス処理を分離 */
function announceWin(resultValue) {
    slotContainer.style.display = 'none';
    startStopButton.style.display = 'none';
    if (resultValue === '7') {
        messageDisplay.textContent = '🎉🎉 777 MEGA JACKPOT!! 🎉🎉';
    } else {
        messageDisplay.textContent = `おめでとう! ゾロ目です!`;
    }
    triggerSpecialEffect();

    // 演出終了後、スロットとボタンを再表示し、ボタンのテキストをリセット
    setTimeout(() => {
        slotContainer.style.display = 'flex'; // スロットを再表示
        startStopButton.style.display = 'block'; // ボタンを再表示
        startStopButton.textContent = '再スタート';
        // WIN演出が終了し、再スタート可能になったらボタンを有効化
        enableControls();
    }, 3000); // 演出時間 (3000ms) 後に再表示
}

// YouTube埋め込みURLを生成する関数
function generateYoutubeUrl(videoId) {

    // 'mute=1' を削除しました。
    // 'playsinline=1' を追加して、モバイル環境でのインライン再生を助けます。
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&modestbranding=1&rel=0&playsinline=1`;
}

// 動画再生を停止・リセットする関数
function stopAndResetVideo() {
    // iframeのsrcを空にして動画を停止させ、オーバーレイを非表示にする
    youtubePlayer.src = '';
    videoOverlay.style.display = 'none';
}

/*結果判定 (昇格チャンスの条件を「任意の2つ揃い」に変更)*/
function checkResult() {
    const result1 = reels[0].getAttribute('data-value');
    const result2 = reels[1].getAttribute('data-value');
    const result3 = reels[2].getAttribute('data-value');

    // 1. 大当たり確定 (3つ揃い)の場合、即座にWIN処理へ
    if (result1 === result2 && result2 === result3) {
        announceWin(result1);
        return;
    }

    // 2. 昇格チャンスの判定: 3つのうち2つだけが揃っているか？
    //    (A AND NOT B) OR (B AND NOT A) OR (C AND NOT A) の論理で判定

    // 💡 組み合わせA: 1と2が揃っていて、3が違う (例: 7-7-3)
    const conditionA = (result1 === result2) && (result2 !== result3);

    // 💡 組み合わせB: 1と3が揃っていて、2が違う (例: 7-3-7)
    const conditionB = (result1 === result3) && (result3 !== result2);

    // 💡 組み合わせC: 2と3が揃っていて、1が違う (例: 3-7-7)
    const conditionC = (result2 === result3) && (result3 !== result1);

    // 2つ揃い（3つ揃いは除く）の昇格チャンス開始
    if (conditionA || conditionB || conditionC) {

        messageDisplay.textContent = 'CHANCE! 昇格を祈れ...';

        // 昇格演出が始まる0.5秒前にボタンを無効化する
        disableControls();

        // 0.5秒待って動画再生を開始
        setTimeout(() => {

            // 昇格チャンス判定
            if (Math.random() < PROMOTION_CHANCE) {
                // *** 当たり動画の再生 ***
                youtubePlayer.src = generateYoutubeUrl(YOUTUBE_WIN_ID);
                videoOverlay.style.display = 'block';

                // 動画再生時間後に結果表示
                setTimeout(() => {
                    stopAndResetVideo();


                    // 💡 【昇格処理】揃えるリールを特定し、強制的に揃える
                    //    どのリールがハズレかによって揃えるリールが変わります。
                    let targetResult = '';
                    if (conditionA) { // 1, 2が揃っている -> 3を揃える
                        targetResult = result1;
                        reels[2].setAttribute('data-value', targetResult);
                        reels[2].querySelector('img').src = symbols[Number(targetResult)];
                    } else if (conditionB) { // 1, 3が揃っている -> 2を揃える
                        targetResult = result1;
                        reels[1].setAttribute('data-value', targetResult);
                        reels[1].querySelector('img').src = symbols[Number(targetResult)];
                    } else { // 2, 3が揃っている -> 1を揃える
                        targetResult = result2;
                        reels[0].setAttribute('data-value', targetResult);
                        reels[0].querySelector('img').src = symbols[Number(targetResult)];
                    }

                    messageDisplay.textContent = '昇格成功！';
                    announceWin(targetResult);

                }, YOUTUBE_DURATION_MS);

            } else {
                // *** ハズレ動画の再生 ***
                youtubePlayer.src = generateYoutubeUrl(YOUTUBE_LOSE_ID);
                videoOverlay.style.display = 'block';

                // 動画再生時間後にハズレ表示
                setTimeout(() => {
                    stopAndResetVideo();
                    messageDisplay.textContent = '残念！昇格失敗...';

                    slotContainer.style.display = 'none';
                    startStopButton.style.display = 'none';

                    const MESSAGE_DISPLAY_DURATION = 2000; // 2秒間メッセージを表示
                    setTimeout(() => {
                        // 💡 失敗後、スロットとボタンを再表示し、ボタンテキストをリセット
                        slotContainer.style.display = 'flex';
                        startStopButton.style.display = 'block';
                        startStopButton.textContent = '再スタート';
                        // 昇格失敗処理が終了し、再スタート可能になったらボタンを有効化
                        enableControls();
                    }, MESSAGE_DISPLAY_DURATION); // 2秒後に実行
                }, YOUTUBE_DURATION_MS);
            }
        }, 500);

        return; // 昇格チャンスに入った場合は、結果が出るまで他の判定をしない
    }


    // 3. 通常のハズレ処理 (2つも揃わなかった場合)
    messageDisplay.textContent = 'Try Again!';
    document.body.style.backgroundColor = '';
}

/*特殊演出 (背景を金色にする処理)*/
function triggerSpecialEffect() {
    document.body.style.backgroundColor = 'gold';
    setTimeout(() => {
        document.body.style.backgroundColor = '';
    }, 3000);
}



/*スタート・ストップ*/
startStopButton.onclick = function () {
    if (!isSpinning) {
        // --- スタート処理 ---
        isSpinning = true;
        stopCount = 0;
        messageDisplay.textContent = 'SPINNING...';
        document.body.style.backgroundColor = ''; // 特殊演出のリセット

        // 全てのスロットを回転させる
        reels.forEach((reel, index) => {
            spinReel(reel, index);
        });

        startStopButton.textContent = 'STOP (1/3)';
        startStopButton.disabled = false; // スタート時はボタンを押せるように
    } else {
        // --- ストップ処理 ---
        if (stopCount < 3) {
            // 現在ストップ対象のスロットの回転を停止
            clearInterval(intervals[stopCount]);
            stopCount++;

            if (stopCount < 3) {
                // 次のストップボタンのテキストを更新
                startStopButton.textContent = `STOP (${stopCount + 1}/3)`;
            } else {
                // 3つ全て止まった
                isSpinning = false;
                startStopButton.textContent = '再スタート';
                // 結果を判定
                checkResult();
            }
        }
    }


};