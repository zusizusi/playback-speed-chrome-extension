console.log("読み込み");
// window.addEventListener("load", main, false);
window.onload = function () {
  // function main() {
  console.log("ロード後");
  var playbackSpeed = 1;
  var video = document.querySelector("video");
  console.log(video.style.width);

  var canvas = document.createElement("canvas");
  canvas.id = "canvasSpeed";
  canvas.width = 300;
  canvas.height = 1500;
  canvas.style.top = 0;
  canvas.style.left = 0;
  //   canvas.width = video.style.width;
  //   canvas.height = video.style.height;
  //   canvas.style.top = video.style.top;
  //   canvas.style.left = video.style.left;
  canvas.style.zIndex = 10000;

  window.document.onkeydown = function (event) {
    if (event.key === "d") {
      playbackSpeed += 0.1;
      drawSpeed();
    }
    if (playbackSpeed >= 0.1) {
      if (event.key === "a") {
        playbackSpeed -= 0.1;
        drawSpeed();
      }
    }
    if (event.key === "s") {
      playbackSpeed = 1;
      drawSpeed();
    }
    video.playbackRate = playbackSpeed;
    console.log("playbackSpeed : " + playbackSpeed);
  };

  function drawSpeed() {
    console.log(canvas);
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "gray";
    // ctx.font = "48px serif";
    // ctx.fillText(String(Math.round(playbackSpeed * 10) / 10), 10, 50);
  }
};
// document.addEventListener("keydown", function (e) {
//   console.log(e.code);
// });
