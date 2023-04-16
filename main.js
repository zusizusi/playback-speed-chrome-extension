"use strict";
console.log("読み込み");
window.onload = function () {
  console.log("Hello! from More Speed Extention");
  var playbackSpeed = 1;
  var video = document.querySelector("video");
  var canv = document.createElement("canvas");
  canv.id = "canvasSpeed";
  // canv.width = 300;
  // canv.height = 1500;
  // canv.style.top = 0;
  // canv.style.left = 0;
  // canv.setAttribute( "width" ,  );
  // canv.setAttribute( "height" , 500 );
  canv.style.zIndex = 1;
  canv.style.position = "absolute";
  document.body.appendChild(canv);
  var timerId;
  // document.body.appendChild(canvas); // adds the canvas to the body element
  // document.getElementById('container').appendChild(canvas)
  // document.getElementsByClassName('html5-video-container').appendChild(canv)
  window.document.onkeydown = function (event) {
    // canv.width = parseInt(video.style.width)/2;
    var video = document.querySelector("video");
    var orgW = video.videoWidth;
    var orgH = video.videoHeight;
    var orgR = orgH / orgW;

    // videoタグのサイズ
    var videoW = video.clientWidth;
    var videoH = video.clientHeight;
    var videoR = videoH / videoW;

    // 描画されている部分のサイズ
    var screenW, screenH;
    if (orgR > videoR) {
      screenH = video.clientHeight;
      screenW = screenH / orgR;
    } else {
      screenW = video.clientWidth;
      screenH = screenW * orgR;
    }

    canv.width = parseInt(screenW) / 2;
    // canv.height = parseInt(video.style.height)/3;
    canv.height = parseInt(screenH) / 3;
    var clientRect = video.getBoundingClientRect();
    canv.style.top =
      clientRect.top + (parseInt(video.style.height) * 2) / 5 + "px";
    canv.style.left = clientRect.left + parseInt(video.style.width) / 2 + "px";

    if (playbackSpeed <= 50.0 && event.key === "d") {
      playbackSpeed += 0.1;
      clearTimeout(timerId);
      clearDraw();
      drawSpeed();
      timerId = setTimeout(clearDraw, 3000);
      // drawSpeed();
    } else if (playbackSpeed >= 0.1 && event.key === "a") {
      playbackSpeed -= 0.1;
      clearTimeout(timerId);
      clearDraw();
      drawSpeed();
      timerId = setTimeout(clearDraw, 3000);
      // drawSpeed();
    } else if (event.key === "s") {
      playbackSpeed = 1;
      clearTimeout(timerId);
      clearDraw();
      drawSpeed();
      timerId = setTimeout(clearDraw, 3000);
    } else {
      clearTimeout(timerId);
      clearDraw();
    }
    video.playbackRate = playbackSpeed;
    console.log("playbackSpeed : " + playbackSpeed.toFixed(1));
  };

  function drawSpeed() {
    canv = document.getElementById("canvasSpeed");
    canv.style.display = "block";
    var ctx = canv.getContext("2d");
    ctx.clearRect(0, 0, canv.width, canv.height);
    // ctx.translate(10,150);
    ctx.fillStyle = "gray";
    ctx.font = canv.height + "px serif";
    ctx.textBaseline = "middle";
    ctx.textAlign = "end";
    ctx.fillText(
      String(playbackSpeed.toFixed(1)) + " x",
      canv.width - canv.width * 0.1,
      canv.height / 2
    );
    // ctx.fillText("aaaaaaaaaaaaaaaa", 100, 100);
    // var ctx = document.getElementById('canvasSpeed').getContext("2d");
  }

  function clearDraw() {
    canv = document.getElementById("canvasSpeed");
    var ctx = canv.getContext("2d");
    ctx.clearRect(0, 0, canv.width, canv.height);
    canv.style.display = "none";
  }
};
