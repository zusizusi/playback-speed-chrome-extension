"use strict";
console.log("読み込み");
// window.addEventListener("load", main, false);
window.onload = function () {
  // function main() {
  console.log("ロード後");
  var playbackSpeed = 1;
  var video = document.querySelector("video");
  var clientRect = video.getBoundingClientRect() ;
  console.log(video.style.width);
  var canv = document.createElement("canvas");
  canv.id = "canvasSpeed";
  // canv.width = 300;
  // canv.height = 1500;
  // canv.style.top = 0;
  // canv.style.left = 0;
  // canv.setAttribute( "width" ,  );
  // canv.setAttribute( "height" , 500 );

  canv.width = parseInt(video.style.width);
  canv.height = parseInt(video.style.height);
  canv.style.top = clientRect.top + "px";
  canv.style.left = clientRect.left + "px";
  canv.style.zIndex = 10000;
  canv.style.position = "absolute";
  console.log("add canvas")
  document.body.appendChild(canv);
  // document.body.appendChild(canvas); // adds the canvas to the body element
  // document.getElementById('container').appendChild(canvas)
  // document.getElementsByClassName('html5-video-container').appendChild(canv)
  window.document.onkeydown = function (event) {
    var timerId;
    if (event.key === "d") {
      playbackSpeed += 0.1;
      console.log(playbackSpeed);
      clearDraw();
      clearTimeout(timerId);
      drawSpeed()
      timerId = setTimeout(clearDraw, 3000 );
      // drawSpeed();
    }
    if (playbackSpeed >= 0.1) {
      if (event.key === "a") {
        playbackSpeed -= 0.1;
        console.log(playbackSpeed);
        clearDraw();
        clearTimeout(timerId);
        drawSpeed()
        timerId = setTimeout(clearDraw, 3000 );
        // drawSpeed();
      }
    }
    if (event.key === "s") {
      playbackSpeed = 1;
      console.log(playbackSpeed);
      clearDraw();
      clearTimeout(timerId);
      drawSpeed()
      timerId = setTimeout(clearDraw, 3000 );
    }
    video.playbackRate = playbackSpeed;
    console.log("playbackSpeed : " + playbackSpeed);
  };

  function drawSpeed() {
    canv = document.getElementById('canvasSpeed');
    var ctx = canv.getContext("2d");
    ctx.clearRect(0, 0, canv.width, canv.height);
    // ctx.translate(10,150);
    ctx.fillStyle = "gray";
    ctx.font = "48px serif";
    ctx.fillText(String(Math.round(playbackSpeed * 10) / 10), 10, 50);
    // ctx.fillText("aaaaaaaaaaaaaaaa", 100, 100);
    // var ctx = document.getElementById('canvasSpeed').getContext("2d");
  }

  function clearDraw(){
    canv = document.getElementById('canvasSpeed');
    var ctx = canv.getContext("2d");
    ctx.clearRect(0, 0, canv.width, canv.height);
  }
};


// document.addEventListener("keydown", function (e) {
//   console.log(e.code);
// });
