var spawn = require("child_process").spawn,
  execSync = require("child_process").execSync;

var omxp_running = function () {
  var stdout = execSync('ps xa | grep "[o]mxplayer.bin" | wc -l');
  var processCount = parseInt(stdout);
  return processCount;
};
var prevent_kill_signal = false;
var player = function (path, options) {
  var count = omxp_running();
  options.maxPlayerAllowCount = options.maxPlayerAllowCount || 1;
  options.closeOtherPlayers =
    typeof options.closeOtherPlayers === "undefined"
      ? true
      : options.closeOtherPlayers;
  if (count >= options.maxPlayerAllowCount) {
    if (options.closeOtherPlayers) {
      prevent_kill_signal = true;
      execSync("killall -9 omxplayer.bin"); //Kill all previous omxplayers
    } else {
      return;
    }
  }
  var settings = options || {};
  var command = "omxplayer";
  path = typeof path === "string" ? [path] : path;
  var args = path;
  if (
    ["hdmi", "local", "both"].indexOf(settings.audioOutput) != -1 ||
    settings.audioOutput.startsWith("alsa")
  )
    args.push("-o", settings.audioOutput);
  if (settings.blackBackground !== false) args.push("-b");
  if (settings.disableKeys === true) args.push("--no-keys");
  if (settings.disableOnScreenDisplay === true) args.push("--no-osd");
  if (settings.disableGhostbox === true) args.push("--no-ghost-box");
  if (settings.subtitlePath && settings.subtitlePath !== "")
    args.push("--subtitles", '"' + settings.subtitlePath + '"');
  if (settings.startAt) args.push("--pos", "" + settings.startAt + "");
  if (settings.alpha) args.push("--alpha", "" + settings.alpha + "");
  if (settings.win) args.push("--win", "" + settings.win + "");
  if (settings.orientation) args.push("--orientation", +settings.orientation);
  if (typeof settings.startVolume !== "undefined") {
    if (settings.startVolume >= 0.0 && settings.startVolume <= 1.0) {
      args.push("--vol");
      var db =
        settings.startVolume > 0
          ? Math.round(
              100 * 20 * (Math.log(settings.startVolume) / Math.log(10))
            ) / 1
          : -12000000;
      args.push(db);
    }
  }
  if (
    typeof settings.otherArgs !== "undefined" &&
    settings.otherArgs.constructor === Array
  ) {
    args = args.concat(settings.otherArgs);
  }
  if (settings.nativeLoop === true) {
    args.push("--loop");
  }

  args.push("--dbus_name");
  args.push("org.mpris.MediaPlayer20.omxplayer");
  args.push("< omxpipe");

  const player = spawn(command, args);
  player.prevent_kill_signal = prevent_kill_signal;

  return player;
};

module.exports.omxp_running = omxp_running;
module.exports.player = player;
