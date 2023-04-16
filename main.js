console.log("Hello! from Video Speed Controller");

// DOM構築後に実行
window.onload = function () {
  if (!document.querySelector("video")) {
    console.log("video element not found");
    return;
  }
  var playbackSpeed;
  var speedIndicatorTimerId;
  var targetVideo = document.querySelector("video");
  var speedIndicatorCanvas = document.createElement("canvas");
  speedIndicatorCanvas.id = "speedIndicatorCanvas";
  speedIndicatorCanvas.style.zIndex = 1;
  speedIndicatorCanvas.style.position = "absolute";
  speedIndicatorCanvas.style.display = "none";
  document.body.appendChild(speedIndicatorCanvas);

  // 自動再生動画の再生速度を変更
  targetVideo.addEventListener("play", () => {
    chrome.storage.local.get({ playbackSpeed: 1.0 }).then((result) => {
      playbackSpeed = result.playbackSpeed;
      console.log(
        "Get playbackSpeed from local storage : " + result.playbackSpeed
      );
    });
    if (playbackSpeed !== 1.0) {
      var targetVideo = document.querySelector("video");
      targetVideo.playbackRate = Number(playbackSpeed.toFixed(1));
      clearTimeout(speedIndicatorTimerId);
      clearSpeedIndicator();
      drawSpeedIndicator();
      speedIndicatorTimerId = setTimeout(clearSpeedIndicator, 3000);
      console.log("Video playback has started.");
    }
  });

  window.document.onkeydown = function (event) {
    targetVideo = document.querySelector("video");
    chrome.storage.local.get({ playbackSpeed: 1.0 }).then((result) => {
      playbackSpeed = result.playbackSpeed;
      console.log(
        "Get playbackSpeed from local storage : " + result.playbackSpeed
      );
    });
    speedIndicatorCanvas.width = targetVideo.clientWidth;
    speedIndicatorCanvas.height = targetVideo.clientHeight;
    var clientRect = targetVideo.getBoundingClientRect();
    speedIndicatorCanvas.style.top = clientRect.top + "px";
    speedIndicatorCanvas.style.left = clientRect.left + "px";

    if (playbackSpeed <= 50.0 && event.key === "d") {
      playbackSpeed += 0.1;
      clearTimeout(speedIndicatorTimerId);
      clearSpeedIndicator();
      drawSpeedIndicator();
      speedIndicatorTimerId = setTimeout(clearSpeedIndicator, 3000);
    } else if (playbackSpeed > 0.1 && event.key === "a") {
      console.log(playbackSpeed);
      playbackSpeed -= 0.1;
      clearTimeout(speedIndicatorTimerId);
      clearSpeedIndicator();
      drawSpeedIndicator();
      speedIndicatorTimerId = setTimeout(clearSpeedIndicator, 3000);
    } else if (event.key === "s") {
      playbackSpeed = 1.0;
      clearTimeout(speedIndicatorTimerId);
      clearSpeedIndicator();
      drawSpeedIndicator();
      speedIndicatorTimerId = setTimeout(clearSpeedIndicator, 3000);
    } else {
      clearTimeout(speedIndicatorTimerId);
      clearSpeedIndicator();
    }
    targetVideo.playbackRate = Number(playbackSpeed.toFixed(1));
    chrome.storage.local
      .set({ playbackSpeed: Number(playbackSpeed.toFixed(1)) })
      .then(() => {
        console.log("playbackSpeed is set to " + playbackSpeed);
      });
  };
};

function drawSpeedIndicator() {
  speedIndicatorCanvas = document.getElementById("speedIndicatorCanvas");
  speedIndicatorCanvas.style.display = "block";
  var ctx = speedIndicatorCanvas.getContext("2d");
  ctx.clearRect(0, 0, speedIndicatorCanvas.width, speedIndicatorCanvas.height);
  ctx.fillStyle = "gray";
  ctx.font = parseInt(speedIndicatorCanvas.height / 3) + "px Sans-Serif ";
  ctx.textBaseline = "bottom";
  ctx.textAlign = "right";
  ctx.maxWidth = speedIndicatorCanvas.width;
  ctx.maxHeight = speedIndicatorCanvas.height;
  var speedText = String(playbackSpeed.toFixed(1)) + " x";
  ctx.fillText(
    speedText,
    speedIndicatorCanvas.width,
    speedIndicatorCanvas.height
  );
}

function clearSpeedIndicator() {
  speedIndicatorCanvas = document.getElementById("speedIndicatorCanvas");
  var ctx = speedIndicatorCanvas.getContext("2d");
  ctx.clearRect(0, 0, speedIndicatorCanvas.width, speedIndicatorCanvas.height);
  speedIndicatorCanvas.style.display = "none";
}
