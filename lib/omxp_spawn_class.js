var spawn = require('child_process').spawn,
  execSync = require('child_process').execSync,
  util = require('util'),
  EventEmitter = require('events');

var that;
var prevent_kill_signal = false;

module.exports = OmxSpawn;
function OmxSpawn(address){
  that = this;
  EventEmitter.call(that);
  that.address = address;

}
util.inherits(OmxSpawn, EventEmitter);

OmxSpawn.prototype.omxp_running = omxp_running;
OmxSpawn.prototype.player = player;

var omxp_running = function() {
  var stdout = execSync('ps xa | grep "[o]mxplayer.bin" | wc -l');
  var processCount = parseInt(stdout);
  return processCount;
};

var player = function(path, options) {
  var count = omxp_running();
  options.maxPlayerAllowCount = options.maxPlayerAllowCount || 1;
  options.closeOtherPlayers = typeof options.closeOtherPlayers === 'undefined' ? true : options.closeOtherPlayers;
  if (count >= options.maxPlayerAllowCount) {
    if (options.closeOtherPlayers) {
      prevent_kill_signal = true;
      execSync('killall -9 omxplayer.bin'); //Kill all previous omxplayers
    } else {
      return; //Dont open a new player, it is not neccesary
    }
  }
  var settings = options || {};
  var command = 'omxplayer';
  path = typeof path === 'string' ? [path] : path;
  var args = path;
  if (['hdmi', 'local', 'both'].indexOf(settings.audioOutput) != -1)
    args.push('-o', settings.audioOutput);
  if (settings.blackBackground !== false)
    args.push('-b');
  if (settings.disableKeys === true)
    args.push('--no-keys');
  if (settings.disableOnScreenDisplay === true)
    args.push('--no-osd');
  if (settings.disableGhostbox === true)
    args.push('--no-ghost-box');
  if (settings.subtitlePath && settings.subtitlePath !== '')
    args.push('--subtitles', '"' + settings.subtitlePath + '"');
  if (settings.startAt)
    args.push('--pos', '' + settings.startAt + '');
  if (typeof settings.startVolume !== 'undefined') {
    if (settings.startVolume >= 0.0 && settings.startVolume <= 1.0) {
      args.push('--vol');
      var db = settings.startVolume > 0 ? Math.round(100 * 20 * (Math.log(settings.startVolume) / Math.log(10))) / 1 : -12000000;
      args.push(db);
    }
  }
  if (typeof settings.otherArgs !== 'undefined' && settings.otherArgs.constructor === Array) {
    args = args.concat(settings.otherArgs);
  }
  if (settings.nativeLoop === true) {
    args.push('--loop');
  }

  args.push('--dbus_name');
  args.push('org.mpris.MediaPlayer' + that.address + '.omxplayer');
  args.push('< omxpipe');
  var omxspawn = spawn(command, args);
  omxspawn.on('exit', function() {
    that.emit('finish', !prevent_kill_signal);
  });
};