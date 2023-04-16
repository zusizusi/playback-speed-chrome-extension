// DOM構築後に実行
window.addEventListener("load", function () {
  console.log("Hello! from Video Speed Controller");
  if (!document.querySelector("video")) {
    console.log("video element not found");
    return;
  }
  let playbackSpeed;
  let speedIndicatorTimerId;
  let targetVideo = document.querySelector("video");
  let speedIndicatorCanvas = createCanvas();
  const timerDuration = 1000;
  chrome.storage.local.get({ playbackSpeed: 1.0 }).then((result) => {
    playbackSpeed = result.playbackSpeed;
    console.log(
      "Get playbackSpeed from local storage : " + result.playbackSpeed
    );
    setPlaybackSpeed(targetVideo, playbackSpeed, timerDuration);
  });

  // 自動再生動画の再生速度を変更用
  targetVideo.addEventListener("play", () => {
    chrome.storage.local.get({ playbackSpeed: 1.0 }).then((result) => {
      playbackSpeed = result.playbackSpeed;
      console.log(
        "Get playbackSpeed from local storage : " + result.playbackSpeed
      );
      setPlaybackSpeed(targetVideo, playbackSpeed, timerDuration);
    });
  });

  window.addEventListener("keydown", (event) => {
    speedIndicatorCanvas.width = targetVideo.clientWidth;
    speedIndicatorCanvas.height = targetVideo.clientHeight;
    var clientRect = targetVideo.getBoundingClientRect();
    speedIndicatorCanvas.style.top = clientRect.top + "px";
    speedIndicatorCanvas.style.left = clientRect.left + "px";
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

  function createCanvas() {
    const canvas = document.createElement("canvas");
    canvas.id = "speedIndicatorCanvas";
    canvas.style.position = "absolute";
    canvas.style.zIndex = 1;
    canvas.style.display = "none";
    document.body.appendChild(canvas);
    return canvas;
  }

  function setPlaybackSpeed(video, speed, duration) {
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
      if (playbackSpeed <= 10.0) {
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
});
