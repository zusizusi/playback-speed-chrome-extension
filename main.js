console.log("Hello! from Video Speed Controller");
let playbackSpeed;
let speedIndicatorTimerId;
let targetVideo = document.querySelector("video");
let speedIndicatorCanvas = createCanvas();
const timerDuration = 1000;

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
        initializeEvents(targetVideo);
      } else if (targetNode) {
        observer.observe(targetNode, config); // Start MutationObserver
      } else {
        console.error("No valid target node found for MutationObserver");
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
        initializeEvents();
      } else {
        observer.observe(targetNode, config); // MutationObserverを開始
      }
    },
  },
};

let hostname = window.location.hostname;

if (sites[hostname]) {
  sites[hostname].init();
} else {
  try {
    if (!document.querySelector("video")) {
      throw new Error("video element not found");
    } else {
      initializeEvents();
    }
  } catch (e) {
    console.log(e.message);
  }
}

function callback(mutationsList, observer) {
  for (let mutation of mutationsList) {
    if (mutation.type === "childList") {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeName === "VIDEO") {
          targetVideo = node;
          initializeEvents(targetVideo);
        }
      });
    }
  }
}

function initializeEvents(targetVideo = document.querySelector("video")) {
  if (!targetVideo) {
    console.error("Video element not found");
    return;
  }
  // 自動再生動画の再生速度を変更用
  targetVideo.addEventListener("canplay", () => {
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.get({ playbackSpeed: 1.0 }).then((result) => {
        playbackSpeed = result.playbackSpeed;
        console.log(
          "Get playbackSpeed from local storage : " + result.playbackSpeed
        );

        setPlaybackSpeed(
          document.querySelector("video"),
          playbackSpeed,
          timerDuration
        );
      });
    } else {
      console.error("chrome.storage.local is not available");
    }
  });

  window.addEventListener("keydown", (event) => {
    targetVideo = document.querySelector("video");
    if (!targetVideo) {
      console.error("Video element not found");
      return;
    }
    switch (event.key) {
      case "d":
        increaseSpeed(targetVideo, timerDuration);
        break;
      case "a":
        decreaseSpeed(targetVideo, timerDuration);
        break;
      case "s":
        resetSpeed(targetVideo, timerDuration);
        break;
      default:
        clearTimeout(speedIndicatorTimerId);
        clearSpeedIndicator(speedIndicatorCanvas);
    }
  });
}

function createCanvas() {
  const canvas = document.createElement("canvas");
  canvas.id = "speedIndicatorCanvas";
  canvas.style.position = "absolute";
  canvas.style.zIndex = 1;
  canvas.style.display = "none";
  canvas.style.pointerEvents = "none";
  document.body.appendChild(canvas);
  return canvas;
}

function setPlaybackSpeed(video, speed, duration) {
  speedIndicatorCanvas.width = video.clientWidth;
  speedIndicatorCanvas.height = video.clientHeight;
  var clientRect = video.getBoundingClientRect();
  speedIndicatorCanvas.style.top = clientRect.top + "px";
  speedIndicatorCanvas.style.left = clientRect.left + "px";
  // console.log(speedIndicatorCanvas.style.top);
  video.playbackRate = Number(speed.toFixed(1));
  clearTimeout(speedIndicatorTimerId);
  clearSpeedIndicator(speedIndicatorCanvas);
  drawSpeedIndicator(speedIndicatorCanvas, speed);
  speedIndicatorTimerId = setTimeout(() => {
    clearSpeedIndicator(speedIndicatorCanvas);
  }, duration);
  chrome.storage.local
    .set({ playbackSpeed: Number(speed.toFixed(1)) })
    .then(() => {
      console.log("playbackSpeed is set to " + Number(speed.toFixed(1)));
    });
}

function increaseSpeed(video, duration) {
  chrome.storage.local.get({ playbackSpeed: 1.0 }, (result) => {
    playbackSpeed = result.playbackSpeed;
    if (playbackSpeed + 0.1 <= 10.0) {
      playbackSpeed += 0.1;
      setPlaybackSpeed(video, playbackSpeed, duration);
    } else {
      playbackSpeed = 10.0;
      setPlaybackSpeed(video, playbackSpeed, duration);
    }
  });
}

function decreaseSpeed(video, duration) {
  chrome.storage.local.get({ playbackSpeed: 1.0 }, (result) => {
    playbackSpeed = result.playbackSpeed;
    if (playbackSpeed > 0.1) {
      playbackSpeed -= 0.1;
      setPlaybackSpeed(video, playbackSpeed, duration);
    } else {
      playbackSpeed = 0.1;
      setPlaybackSpeed(video, playbackSpeed, duration);
    }
  });
}

function resetSpeed(video, duration) {
  playbackSpeed = 1.0;
  setPlaybackSpeed(video, playbackSpeed, duration);
}

function drawSpeedIndicator(canvas, speed) {
  canvas.style.display = "block";
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "gray";
  ctx.font = `${parseInt(canvas.height / 3)}px Sans-Serif`;
  ctx.textBaseline = "bottom";
  ctx.textAlign = "right";
  ctx.maxWidth = canvas.width;
  ctx.maxHeight = canvas.height;
  const speedText = `${speed.toFixed(1)} x`;
  ctx.fillText(speedText, canvas.width, canvas.height);
}

function clearSpeedIndicator(canvas) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.style.display = "none";
}
