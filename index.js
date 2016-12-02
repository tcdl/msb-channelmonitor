'use strict';
/**
 * Use by `require('msb-channelmonitor')`
 */
var debug = require('debug')('msb');

var msb = require('msb');

function installMonitoring(channelManager) {
  channelManager.monitor = require('./lib/channelMonitor').create(channelManager);
  channelManager.monitorAgent = require('./lib/channelMonitorAgent').create(channelManager);
}

exports.installMonitoring = installMonitoring

// Install on default msb channelManager
installMonitoring(msb.channelManager);
msb.channelMonitor = msb.channelManager.monitor;
msb.channelMonitorAgent = msb.channelManager.monitorAgent;
