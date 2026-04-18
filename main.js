console.log("Hello! from Video Speed Controller");
let speedIndicatorTimerId;
let targetVideos = []; // 複数のvideo要素を管理するための配列
let isApplyingRate = false;

const DEFAULT_PLAYBACK_SPEED = 1.0;
const SPEED_STEP = 0.1;
const MIN_PLAYBACK_SPEED = 0.1;
const MAX_PLAYBACK_SPEED = 10.0;
const RATE_EPSILON = 0.001;
const TIMER_DURATION = 1000;
const INDICATOR_Z_INDEX = 9999;
const INDICATOR_WIDTH = 100;
const INDICATOR_HEIGHT = 50;

// 各videoごとにキャンバスを管理するオブジェクト
let videoCanvasMap = new Map();

let sites = {
  "www.youtube.com": {
    init: function () {
      let targetNode = document.getElementById("content");
      if (!targetNode) {
        // Fallback to another node or use the body
        targetNode = document.querySelector("ytd-app") || document.body;
      }
      const config = {
        attributes: false,
        childList: true,
        subtree: true,
        characterData: false,
      };
      const observer = new MutationObserver(callback);

      if (document.querySelector("video")) {
        findAndInitAllVideos();
      } else if (targetNode) {
        observer.observe(targetNode, config); // Start MutationObserver
      } else {
        console.error("No valid target node found for MutationObserver");
      }
    },
  },

  "www.amazon.co.jp": {
    init: function () {
      console.log("amazon");
      // amazonのビデオプレーヤーを検出するためのセレクタを複数用意
      const videoSelectors = [
        "#dv-web-player video",
        ".webPlayerContainer video",
        ".webPlayerSDKContainer video",
        ".rendererContainer video",
        "#av-player video",
        "video",
      ];

      // document.bodyを監視対象に
      const targetNode = document.body;
      const config = {
        attributes: false,
        childList: true,
        subtree: true,
        characterData: false,
      };
      const observer = new MutationObserver(callback);

      // セレクタを順番に試してビデオ要素を探す
      let videoFound = false;
      for (const selector of videoSelectors) {
        const videos = document.querySelectorAll(selector);
        if (videos.length > 0) {
          videos.forEach((video) => addVideoToTargets(video));
          videoFound = true;
          break;
        }
      }

      if (!videoFound) {
        observer.observe(targetNode, config); // Start MutationObserver
      }
    },
  },

  "www.primevideo.com": {
    init: function () {
      console.log("amazon prime video");
      // Prime Videoのビデオプレーヤーを検出するためのセレクタを複数用意
      const videoSelectors = [
        ".webPlayerContainer video",
        ".rendererContainer video",
        "#dv-web-player video",
        "#av-player video",
        "video",
      ];

      // document.bodyを監視対象に
      const targetNode = document.body;
      const config = {
        attributes: false,
        childList: true,
        subtree: true,
        characterData: false,
      };
      const observer = new MutationObserver(callback);

      // セレクタを順番に試してビデオ要素を探す
      let videoFound = false;
      for (const selector of videoSelectors) {
        const videos = document.querySelectorAll(selector);
        if (videos.length > 0) {
          videos.forEach((video) => addVideoToTargets(video));
          videoFound = true;
          break;
        }
      }

      if (!videoFound) {
        observer.observe(targetNode, config); // Start MutationObserver
      }
    },
  },

  "www.netflix.com": {
    init: function () {
      console.log("netflix");
      const targetNode = document.getElementById("appMountPoint");
      const config = {
        attributes: false,
        childList: true,
        subtree: true,
        characterData: false,
      };
      const observer = new MutationObserver(callback);

      if (document.querySelector("video")) {
        findAndInitAllVideos();
      } else {
        observer.observe(targetNode, config); // MutationObserverを開始
      }
    },
  },
};

function callback(mutationsList, observer) {
  for (let mutation of mutationsList) {
    if (mutation.type === "childList") {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeName === "VIDEO") {
          addVideoToTargets(node);
        } else if (node.querySelectorAll) {
          // ノードが子要素を持つ可能性がある場合、その中のvideo要素を探す
          const videos = node.querySelectorAll("video");
          videos.forEach((video) => addVideoToTargets(video));
        }
      });
    }
  }

  // DOM変更時に切断済みvideoを除外し、新規videoを取りこぼさないようにする
  cleanupDisconnectedVideos();
  findAndInitAllVideos();
}

// 新しいvideo要素をtargetVideos配列に追加する関数
function addVideoToTargets(video) {
  if (!targetVideos.includes(video)) {
    targetVideos.push(video);
    // この動画要素用の新しいキャンバスを作成
    const canvas = createCanvasForVideo(video);
    videoCanvasMap.set(video, canvas);
    initializeEvents(video);
    applyStoredSpeed(video);
    console.log("Video element added to targets", targetVideos.length);
  }
}

function normalizeSpeed(speed) {
  return Number(speed.toFixed(1));
}

async function getStoredPlaybackSpeed() {
  if (!chrome.storage || !chrome.storage.local) {
    return DEFAULT_PLAYBACK_SPEED;
  }

  const result = await chrome.storage.local.get({
    playbackSpeed: DEFAULT_PLAYBACK_SPEED,
  });
  return normalizeSpeed(result.playbackSpeed);
}

function saveStoredPlaybackSpeed(speed) {
  if (!chrome.storage || !chrome.storage.local) {
    return Promise.resolve();
  }

  return chrome.storage.local.set({ playbackSpeed: normalizeSpeed(speed) });
}

function applyStoredSpeed(videoElement) {
  if (!videoElement || !chrome.storage || !chrome.storage.local) {
    return;
  }

  getStoredPlaybackSpeed().then((storedSpeed) => {
    setPlaybackSpeed(videoElement, storedSpeed, TIMER_DURATION);
  });
}

function initializeEvents(videoElement) {
  if (!videoElement) {
    console.error("Video element not found");
    return;
  }

  // この特定のvideo要素に対してイベントを設定
  videoElement.addEventListener("canplay", () => {
    if (!chrome.storage || !chrome.storage.local) {
      console.error("chrome.storage.local is not available");
      return;
    }

    getStoredPlaybackSpeed().then((storedSpeed) => {
      console.log("Get playbackSpeed from local storage : " + storedSpeed);
      setPlaybackSpeed(videoElement, storedSpeed, TIMER_DURATION);
    });
  });

  // YouTube/Primeが再生速度を戻すケースに対応して保存値を再適用
  ["loadedmetadata", "play", "ratechange"].forEach((eventName) => {
    videoElement.addEventListener(eventName, () => {
      if (isApplyingRate) {
        return;
      }

      if (!chrome.storage || !chrome.storage.local) {
        return;
      }

      getStoredPlaybackSpeed().then((desiredRate) => {
        if (Math.abs(videoElement.playbackRate - desiredRate) > RATE_EPSILON) {
          isApplyingRate = true;
          videoElement.playbackRate = desiredRate;
          isApplyingRate = false;
        }
      });
    });
  });
}

// ページロード時に既存のvideo要素を検索して追加
function findAndInitAllVideos() {
  const videos = document.querySelectorAll("video");
  if (videos.length > 0) {
    videos.forEach((video) => addVideoToTargets(video));
  }
}

function cleanupDisconnectedVideos() {
  targetVideos = targetVideos.filter((video) => {
    if (video && video.isConnected) {
      return true;
    }

    const canvas = videoCanvasMap.get(video);
    if (canvas) {
      canvas.remove();
      videoCanvasMap.delete(video);
    }
    return false;
  });
}

function getActiveVideo() {
  cleanupDisconnectedVideos();

  if (targetVideos.length === 0) {
    findAndInitAllVideos();
  }

  const playingVideo = targetVideos.find(
    (video) => video && video.isConnected && !video.paused && !video.ended,
  );
  if (playingVideo) {
    return playingVideo;
  }

  const visibleVideo = targetVideos.find((video) => {
    if (!video || !video.isConnected) {
      return false;
    }
    const rect = video.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });

  return visibleVideo || (targetVideos.length > 0 ? targetVideos[0] : null);
}

// グローバルキーイベントは一度だけ設定
window.addEventListener("keydown", (event) => {
  // 最後にフォーカスされたか、最後に操作されたvideo要素を取得
  // フォーカス情報がない場合は、最初のvideo要素を使用
  let activeVideo = getActiveVideo();

  if (!activeVideo) {
    console.error("No video elements found");
    return;
  }

  const keyActions = {
    d: increaseSpeed,
    a: decreaseSpeed,
    s: resetSpeed,
  };
  const action = keyActions[event.key];

  if (action) {
    action(activeVideo, TIMER_DURATION);
  } else {
    clearTimeout(speedIndicatorTimerId);
    clearAllSpeedIndicators();
  }
});

// 全てのvideo要素に同じ再生速度を適用する関数
function applySpeedToAllVideos(speed) {
  cleanupDisconnectedVideos();
  const normalizedSpeed = normalizeSpeed(speed);

  targetVideos.forEach((video) => {
    isApplyingRate = true;
    video.playbackRate = normalizedSpeed;
    isApplyingRate = false;
    // 各ビデオごとの速度表示を更新
    updateSpeedIndicator(video, normalizedSpeed);
  });
}

// 各ビデオ要素に対応するキャンバスを作成する関数
function createCanvasForVideo(video) {
  const canvas = document.createElement("canvas");
  canvas.id = "speedIndicatorCanvas_" + Math.random().toString(36).substr(2, 9); // ユニークなID
  canvas.style.position = "absolute";
  canvas.style.zIndex = INDICATOR_Z_INDEX;
  canvas.style.display = "none";
  canvas.style.pointerEvents = "none";
  document.body.appendChild(canvas);
  return canvas;
}

// 全てのキャンバスをクリアする関数
function clearAllSpeedIndicators() {
  videoCanvasMap.forEach((canvas, video) => {
    clearSpeedIndicator(canvas);
  });
}

// 特定のビデオの速度表示を更新する関数
function updateSpeedIndicator(video, speed) {
  const canvas = videoCanvasMap.get(video);
  if (canvas) {
    updateCanvasPosition(video, canvas);
    drawSpeedIndicator(canvas, speed);

    // 既存のタイマーをクリア
    if (canvas.timerId) {
      clearTimeout(canvas.timerId);
    }

    // 新しいタイマーを設定
    canvas.timerId = setTimeout(() => {
      clearSpeedIndicator(canvas);
    }, timerDuration);
  }
}

// キャンバスの位置をビデオに合わせて更新
function updateCanvasPosition(video, canvas) {
  canvas.width = video.clientWidth;
  canvas.height = video.clientHeight;
  var clientRect = video.getBoundingClientRect();
  canvas.style.top = clientRect.top + window.scrollY + "px";
  canvas.style.left = clientRect.left + window.scrollX + "px";
}

function setPlaybackSpeed(video, speed, duration) {
  const canvas = videoCanvasMap.get(video);
  const normalizedSpeed = normalizeSpeed(speed);

  if (canvas) {
    updateCanvasPosition(video, canvas);
    isApplyingRate = true;
    video.playbackRate = normalizedSpeed;
    isApplyingRate = false;

    // 既存のタイマーをクリア
    if (canvas.timerId) {
      clearTimeout(canvas.timerId);
    }

    clearSpeedIndicator(canvas);
    drawSpeedIndicator(canvas, normalizedSpeed);

    // 新しいタイマーを設定
    canvas.timerId = setTimeout(() => {
      clearSpeedIndicator(canvas);
    }, duration);
  }

  saveStoredPlaybackSpeed(normalizedSpeed).then(() => {
    console.log("playbackSpeed is set to " + normalizedSpeed);
  });
}

function clampSpeed(speed) {
  return Math.max(MIN_PLAYBACK_SPEED, Math.min(MAX_PLAYBACK_SPEED, speed));
}

async function adjustSpeed(video, duration, delta) {
  const currentSpeed = await getStoredPlaybackSpeed();
  const nextSpeed = clampSpeed(currentSpeed + delta);
  setPlaybackSpeed(video, nextSpeed, duration);
  applySpeedToAllVideos(nextSpeed);
}

function increaseSpeed(video, duration) {
  return adjustSpeed(video, duration, SPEED_STEP);
}

function decreaseSpeed(video, duration) {
  return adjustSpeed(video, duration, -SPEED_STEP);
}

function resetSpeed(video, duration) {
  setPlaybackSpeed(video, DEFAULT_PLAYBACK_SPEED, duration);
  applySpeedToAllVideos(DEFAULT_PLAYBACK_SPEED);
}

function drawSpeedIndicator(canvas, speed) {
  canvas.style.display = "block";
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.rect(
    canvas.width - INDICATOR_WIDTH,
    canvas.height - INDICATOR_HEIGHT,
    INDICATOR_WIDTH,
    INDICATOR_HEIGHT,
  );
  ctx.fill();

  ctx.fillStyle = "rgba(133, 133, 133, 0.7)";
  ctx.font = `${parseInt(canvas.width / 5)}px Sans-Serif`;
  ctx.textBaseline = "bottom";
  ctx.textAlign = "right";
  const speedText = `${speed.toFixed(1)} x`;
  ctx.fillText(speedText, canvas.width - 10, canvas.height - 10);
}

function clearSpeedIndicator(canvas) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.style.display = "none";
}

// MutationObserverの設定とイベントの初期化
let hostname = window.location.hostname;

if (sites[hostname]) {
  sites[hostname].init();
  findAndInitAllVideos(); // 既存のvideo要素を初期化
} else {
  try {
    findAndInitAllVideos(); // 既存のvideo要素を初期化

    // ページ全体を監視して新しいvideo要素を検出
    const observer = new MutationObserver(callback);
    observer.observe(document.body, {
      attributes: false,
      childList: true,
      subtree: true,
      characterData: false,
    });
  } catch (e) {
    console.log(e.message);
  }
}
