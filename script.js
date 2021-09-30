(function (callback) {
  var script = document.createElement("script");
  script.textContent = "(" + callback.toString() + ")();";
  document.body.appendChild(script);
})(function () {
  function canselEvent(e) {
    e.stopPropagation();
    e.preventDefault();
    return false;
  }
  let playbackSpeed = 1;
  window.document.onkeydown = function (event) {
    if (event.key === "d") playbackSpeed += 0.1;
    if (playbackSpeed >= 0.1) {
      if (event.key === "a") playbackSpeed -= 0.1;
    }
    if (event.key === "s") playbackSpeed = 1;

    document.querySelector("video").playbackRate = playbackSpeed;
    console.log("playbackSpeed : " + playbackSpeed);
  };
});
