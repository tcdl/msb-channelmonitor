'use strict';
var util = require('util');
var assert = require('assert');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var Requester = require('msb/lib/requester');
var Responder = require('msb/lib/responder');
var messageFactory = require('msb/lib/messageFactory');

function InfoCenterAgent(config, channelManager) {
  assert(channelManager);

  this.doc = {};
  this.config = config;
  this.channelManager = channelManager;

  this.announceNamespace = config.announceNamespace;
  this.heartbeatsNamespace = config.heartbeatsNamespace;

  this.announcementProducer = null;
  this.heartbeatResponderEmitter = null;

  // Bind for events
  this._onHeartbeatResponder = this._onHeartbeatResponder.bind(this);
}

util.inherits(InfoCenterAgent, EventEmitter);

var infoCenterAgent = InfoCenterAgent.prototype;

infoCenterAgent.onHeartbeatResponder = null; // Override this with function(responder) {}

infoCenterAgent.start = infoCenterAgent.startBroadcasting = function() {
  if (this.heartbeatResponderEmitter) return; // Already responding to heartbeats

  this.heartbeatResponderEmitter = Responder.createEmitter({
    namespace: this.heartbeatsNamespace,
    prefetchCount: 0,
    autoConfirm: false,
    groupId: false
  }).on('responder', this._onHeartbeatResponder);

  this.emit('start');
};

infoCenterAgent.stop = infoCenterAgent.stopBroadcasting = function() {
  if (!this.heartbeatResponderEmitter) return; // Not broadcasting

  this.heartbeatResponderEmitter.end();
  this.heartbeatResponderEmitter = null;

  this.emit('stop');
};

infoCenterAgent.doBroadcast = function() {
  if (!this.announcementProducer) {
    this.announcementProducer = this.channelManager.createRawProducer(this.announceNamespace);
  }

  var message = messageFactory.createBroadcastMessage({
    namespace: this.announceNamespace
  });

  message.payload.body = this.doc;
  this.announcementProducer.publish(message, _noop);
};

infoCenterAgent._onHeartbeatResponder = function(responder) {
  this.onHeartbeatResponder(responder);
};

/** Override this to customize response. */
infoCenterAgent.onHeartbeatResponder = function(responder) {
  responder.send({ body: this.doc });
};

function _noop() {}

module.exports = InfoCenterAgent;
