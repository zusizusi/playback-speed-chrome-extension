console.log("Hello! from Video Speed Controller");
let targetVideos = []; // 複数のvideo要素を管理するための配列
let isApplyingRate = false;
let speedAdjustmentQueue = Promise.resolve();

const DEFAULT_PLAYBACK_SPEED = 1.0;
const SPEED_STEP = 0.1;
const MIN_PLAYBACK_SPEED = 0.1;
const MAX_PLAYBACK_SPEED = 10.0;
const RATE_EPSILON = 0.001;
const TIMER_DURATION = 1000;
const INDICATOR_Z_INDEX = 9999;
const INDICATOR_WIDTH = 100;
const INDICATOR_HEIGHT = 50;
const MUTATION_SCAN_DEBOUNCE_MS = 120;
const OBSERVER_CONFIG = {
  attributes: false,
  childList: true,
  subtree: true,
  characterData: false,
};
let mutationScanTimerId = null;

// 各videoごとにキャンバスを管理するオブジェクト
let videoCanvasMap = new Map();

class SpeedIndicatorManager {
  constructor(video) {
    this.video = video;
    this.timerId = null;
    this.canvas = document.createElement("canvas");
    this.canvas.id =
      "speedIndicatorCanvas_" + Math.random().toString(36).substr(2, 9);
    this.canvas.style.position = "absolute";
    this.canvas.style.zIndex = INDICATOR_Z_INDEX;
    this.canvas.style.display = "none";
    this.canvas.style.pointerEvents = "none";
    document.body.appendChild(this.canvas);
  }

  updatePosition() {
    this.canvas.width = this.video.clientWidth;
    this.canvas.height = this.video.clientHeight;
    const clientRect = this.video.getBoundingClientRect();
    this.canvas.style.top = clientRect.top + window.scrollY + "px";
    this.canvas.style.left = clientRect.left + window.scrollX + "px";
  }

  draw(speed) {
    this.canvas.style.display = "block";
    const ctx = this.canvas.getContext("2d");
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.beginPath();
    ctx.rect(
      this.canvas.width - INDICATOR_WIDTH,
      this.canvas.height - INDICATOR_HEIGHT,
      INDICATOR_WIDTH,
      INDICATOR_HEIGHT,
    );
    ctx.fill();

    ctx.fillStyle = "rgba(133, 133, 133, 0.7)";
    ctx.font = `${parseInt(this.canvas.width / 5)}px Sans-Serif`;
    ctx.textBaseline = "bottom";
    ctx.textAlign = "right";
    const speedText = `${speed.toFixed(1)} x`;
    ctx.fillText(speedText, this.canvas.width - 10, this.canvas.height - 10);
  }

  clear() {
    const ctx = this.canvas.getContext("2d");
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.canvas.style.display = "none";
  }

  show(speed, duration = TIMER_DURATION) {
    this.updatePosition();
    this.draw(speed);

    if (this.timerId) {
      clearTimeout(this.timerId);
    }

    this.timerId = setTimeout(() => {
      this.clear();
      this.timerId = null;
    }, duration);
  }

  dispose() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.canvas.remove();
  }
}

function observeForNewVideos(targetNode, errorMessage) {
  if (!targetNode) {
    if (errorMessage) {
      console.error(errorMessage);
    }
    return false;
  }

  const observer = new MutationObserver(callback);
  observer.observe(targetNode, OBSERVER_CONFIG);
  return true;
}

function withApplyingRate(applyRate) {
  if (isApplyingRate) {
    return;
  }

  isApplyingRate = true;
  try {
    applyRate();
  } finally {
    isApplyingRate = false;
  }
}

function scheduleFullVideoScan() {
  if (mutationScanTimerId) {
    clearTimeout(mutationScanTimerId);
  }

  mutationScanTimerId = setTimeout(() => {
    mutationScanTimerId = null;
    cleanupDisconnectedVideos();
    findAndInitAllVideos();
  }, MUTATION_SCAN_DEBOUNCE_MS);
}

function addVideosFromSelectors(videoSelectors) {
  for (const selector of videoSelectors) {
    const videos = document.querySelectorAll(selector);
    if (videos.length > 0) {
      videos.forEach((video) => addVideoToTargets(video));
      return true;
    }
  }

  return false;
}

function initSiteWithSelectors(siteLabel, videoSelectors, targetNode) {
  if (siteLabel) {
    console.log(siteLabel);
  }

  const videoFound = addVideosFromSelectors(videoSelectors);
  if (!videoFound) {
    observeForNewVideos(
      targetNode,
      "No valid target node found for MutationObserver",
    );
  }
}

function initSiteWithDefaultVideoDetection(targetNode, errorMessage) {
  if (document.querySelector("video")) {
    findAndInitAllVideos();
    return;
  }

  observeForNewVideos(targetNode, errorMessage);
}

let sites = {
  "www.youtube.com": {
    init: function () {
      let targetNode = document.getElementById("content");
      if (!targetNode) {
        // Fallback to another node or use the body
        targetNode = document.querySelector("ytd-app") || document.body;
      }
      initSiteWithDefaultVideoDetection(
        targetNode,
        "No valid target node found for MutationObserver",
      );
    },
  },

  "www.amazon.co.jp": {
    init: function () {
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
      initSiteWithSelectors("amazon", videoSelectors, targetNode);
    },
  },

  "www.primevideo.com": {
    init: function () {
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
      initSiteWithSelectors("amazon prime video", videoSelectors, targetNode);
    },
  },

  "www.netflix.com": {
    init: function () {
      console.log("netflix");
      const targetNode = document.getElementById("appMountPoint");
      initSiteWithDefaultVideoDetection(
        targetNode,
        "No valid target node found for MutationObserver",
      );
    },
  },
};

function callback(mutationsList, observer) {
  let shouldScheduleScan = false;

  for (let mutation of mutationsList) {
    if (mutation.type === "childList") {
      shouldScheduleScan = true;
      mutation.addedNodes.forEach((node) => {
        if (node.nodeName === "VIDEO") {
          addVideoToTargets(node);
        } else if (
          node.nodeType === Node.ELEMENT_NODE &&
          node.querySelectorAll
        ) {
          // ノードが子要素を持つ可能性がある場合、その中のvideo要素を探す
          const videos = node.querySelectorAll("video");
          videos.forEach((video) => addVideoToTargets(video));
        }
      });
    }
  }

  if (shouldScheduleScan) {
    scheduleFullVideoScan();
  }
}

// 新しいvideo要素をtargetVideos配列に追加する関数
function addVideoToTargets(video) {
  if (!targetVideos.includes(video)) {
    targetVideos.push(video);
    videoCanvasMap.set(video, new SpeedIndicatorManager(video));
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
  const parsedSpeed = Number(result.playbackSpeed);
  const safeSpeed = Number.isFinite(parsedSpeed)
    ? parsedSpeed
    : DEFAULT_PLAYBACK_SPEED;
  return normalizeSpeed(clampSpeed(safeSpeed));
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
    setPlaybackSpeed(videoElement, storedSpeed, TIMER_DURATION, {
      persist: false,
    });
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
      setPlaybackSpeed(videoElement, storedSpeed, TIMER_DURATION, {
        persist: false,
      });
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
          withApplyingRate(() => {
            videoElement.playbackRate = desiredRate;
          });
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

    const speedIndicatorManager = videoCanvasMap.get(video);
    if (speedIndicatorManager) {
      speedIndicatorManager.dispose();
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
    clearAllSpeedIndicators();
  }
});

// 全てのvideo要素に同じ再生速度を適用する関数
function applySpeedToAllVideos(speed) {
  cleanupDisconnectedVideos();
  const normalizedSpeed = normalizeSpeed(speed);

  targetVideos.forEach((video) => {
    withApplyingRate(() => {
      video.playbackRate = normalizedSpeed;
    });
    // 各ビデオごとの速度表示を更新
    updateSpeedIndicator(video, normalizedSpeed);
  });
}

// 全てのキャンバスをクリアする関数
function clearAllSpeedIndicators() {
  videoCanvasMap.forEach((speedIndicatorManager) => {
    speedIndicatorManager.clear();
  });
}

// 特定のビデオの速度表示を更新する関数
function updateSpeedIndicator(video, speed, duration = TIMER_DURATION) {
  const speedIndicatorManager = videoCanvasMap.get(video);
  if (speedIndicatorManager) {
    speedIndicatorManager.show(speed, duration);
  }
}

async function setPlaybackSpeed(
  video,
  speed,
  duration,
  { persist = true } = {},
) {
  const speedIndicatorManager = videoCanvasMap.get(video);
  const normalizedSpeed = normalizeSpeed(speed);

  if (speedIndicatorManager) {
    withApplyingRate(() => {
      video.playbackRate = normalizedSpeed;
    });
    speedIndicatorManager.show(normalizedSpeed, duration);
  }

  if (persist) {
    await saveStoredPlaybackSpeed(normalizedSpeed);
    console.log("playbackSpeed is set to " + normalizedSpeed);
  }
}

function clampSpeed(speed) {
  return Math.max(MIN_PLAYBACK_SPEED, Math.min(MAX_PLAYBACK_SPEED, speed));
}

function enqueueSpeedAdjustment(task) {
  speedAdjustmentQueue = speedAdjustmentQueue
    .then(() => task())
    .catch((error) => {
      console.error("Failed to adjust playback speed", error);
    });
  return speedAdjustmentQueue;
}

async function adjustSpeed(video, duration, delta) {
  return enqueueSpeedAdjustment(async () => {
    const currentSpeed = await getStoredPlaybackSpeed();
    const nextSpeed = clampSpeed(currentSpeed + delta);
    await setPlaybackSpeed(video, nextSpeed, duration);
    applySpeedToAllVideos(nextSpeed);
  });
}

function increaseSpeed(video, duration) {
  return adjustSpeed(video, duration, SPEED_STEP);
}

function decreaseSpeed(video, duration) {
  return adjustSpeed(video, duration, -SPEED_STEP);
}

function resetSpeed(video, duration) {
  return enqueueSpeedAdjustment(async () => {
    await setPlaybackSpeed(video, DEFAULT_PLAYBACK_SPEED, duration);
    applySpeedToAllVideos(DEFAULT_PLAYBACK_SPEED);
  });
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
    observeForNewVideos(
      document.body,
      "No valid target node found for MutationObserver",
    );
  } catch (e) {
    console.log(e.message);
  }
}
