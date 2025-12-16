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

// --- 【MP4対応 変更箇所 1/5】 変数をMP4用に変更 ---
const videoOverlay = document.getElementById('video-overlay');
const mp4Player = document.getElementById('mp4-player'); // HTMLでIDを 'mp4-player' に変更している必要があります

// 当たり動画のファイルパス (仮設定: 実際のものに置き換えてください)
const MP4_WIN_PATH = 'images/(2) [SFM] ナワバリバトル - YouTube - Google Chrome 2025-12-16 13-21-31.mp4';
// ハズレ動画のファイルパス (仮設定: 実際のものに置き換えてください)
const MP4_LOSE_PATH = 'images/(2) Splash _ Splatoon Animation - YouTube - Google Chrome 2025-12-16 13-23-14.mp4';
// ------------------------------------------------------------------
const MP4_FIXED_DURATION_MS = 20000; // 20秒に設定


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

        // imgのsrc更新
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

/* WIN時のアナウンス処理を分離 */
function announceWin(resultValue) {
    slotContainer.style.display = 'none';
    startStopButton.style.display = 'none';
    if (resultValue === '7') {
        messageDisplay.textContent = '🎉🎉 777 MEGA JACKPOT!! 🎉🎉';
    } else {
        messageDisplay.textContent = `🎯 WIN! ゾロ目です (${resultValue}${resultValue}${resultValue}) 🎯`;
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

// --- 【MP4対応 変更箇所 2/5】 動画再生/停止関数に置き換え ---

// 動画再生を停止・リセットする関数 (MP4用)
function stopAndResetVideo() {
    mp4Player.pause();
    mp4Player.currentTime = 0; // 再生時間を先頭に戻す
    mp4Player.src = ''; // srcを空にして動画をリセット
    videoOverlay.style.display = 'none';
}

// 動画を再生する関数 (MP4用)
function playVideo(path) {
    mp4Player.src = path;
    mp4Player.muted = false; // 音を出す (※ブラウザポリシーに注意)
    videoOverlay.style.display = 'block';

    // 古いイベントリスナーをクリア
    mp4Player.onended = null;
    mp4Player.oncanplay = null;

    mp4Player.load();

    // 動画のロードが完了し、再生可能になったら再生
    mp4Player.oncanplay = () => {
        mp4Player.play().catch(error => {
            console.error("動画の自動再生に失敗しました。", error);
            // 自動再生がブロックされた場合の代替処理（ミュートにするなど）
            mp4Player.muted = true;
            mp4Player.play();
            // ユーザーにミュート解除を促すUIを表示することを推奨
        });
    };
}

// 動画再生終了時の後処理を分離
function handleLoseResult() {
    messageDisplay.textContent = '残念！昇格失敗...';

    slotContainer.style.display = 'none';
    startStopButton.style.display = 'none';

    const MESSAGE_DISPLAY_DURATION = 2000;
    setTimeout(() => {
        slotContainer.style.display = 'flex';
        startStopButton.style.display = 'block';
        startStopButton.textContent = '再スタート';
        enableControls();
    }, MESSAGE_DISPLAY_DURATION);
}


// 昇格成功時のリール揃えとWINアナウンスを実行する関数
function performPromotion() {
    // リール値を取得 (checkResult関数内で定義されているresult変数はスコープ外のため、再取得が必要です)
    const result1 = reels[0].getAttribute('data-value');
    const result2 = reels[1].getAttribute('data-value');
    const result3 = reels[2].getAttribute('data-value');

    let targetResult = '';

    // 昇格処理のロジックを再構築
    const conditionA = (result1 === result2) && (result2 !== result3); // 1, 2が揃っている -> 3を揃える
    const conditionB = (result1 === result3) && (result3 !== result2); // 1, 3が揃っている -> 2を揃える

    if (conditionA) {
        targetResult = result1;
        reels[2].setAttribute('data-value', targetResult);
        reels[2].querySelector('img').src = symbols[Number(targetResult)];
    } else if (conditionB) {
        targetResult = result1;
        reels[1].setAttribute('data-value', targetResult);
        reels[1].querySelector('img').src = symbols[Number(targetResult)];
    } else { // 2, 3が揃っている -> 1を揃える
        targetResult = result2;
        reels[0].setAttribute('data-value', targetResult);
        reels[0].querySelector('img').src = symbols[Number(targetResult)];
    }

    messageDisplay.textContent = '🔥 昇格成功！RUSH突入！ 🔥';
    announceWin(targetResult);
}

// ------------------------------------------------------------------


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
    const conditionA = (result1 === result2) && (result2 !== result3);
    const conditionB = (result1 === result3) && (result3 !== result2);
    const conditionC = (result2 === result3) && (result3 !== result1);

    // 2つ揃い（3つ揃いは除く）の昇格チャンス開始
    if (conditionA || conditionB || conditionC) {

        messageDisplay.textContent = 'CHANCE! 昇格を祈れ...';

        disableControls();

        // 0.5秒待って動画再生を開始
        setTimeout(() => {

            // 昇格チャンス判定
            if (Math.random() < PROMOTION_CHANCE) {
                // *** 【MP4対応 変更箇所 3/5】 当たり動画の再生 ***
                playVideo(MP4_WIN_PATH, true);

                // MP4はonendedイベントで結果表示を行うため、
                // ここにあった setTimeout による時間制御は削除します。
                // ★【修正点4: 30秒タイマーで結果処理を呼び出す】
                setTimeout(() => {
                    stopAndResetVideo();
                    performPromotion(); // 昇格成功時の後処理へ
                }, MP4_FIXED_DURATION_MS);
            } else {
                // *** ハズレ動画の再生 ***
                playVideo(MP4_LOSE_PATH);

                // ★【修正点5: 30秒タイマーでハズレ処理を呼び出す】
                setTimeout(() => {
                    stopAndResetVideo();
                    handleLoseResult(); // 昇格失敗時の後処理へ
                }, MP4_FIXED_DURATION_MS);
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
    // ... (スタート/ストップのロジックは変更なし) ...
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