'use strict';
var _ = require('lodash');
var InfoCenterAgent = require('./infoCenterAgent');
var serviceDetails = require('msb/lib/support/serviceDetails');
var logger = require('msb/lib/support/logger');

var channelMonitorAgent = exports;

channelMonitorAgent.create = function(channelManager) {
  var channelMonitorAgent = new InfoCenterAgent({
    announceNamespace: '_channels:announce',
    heartbeatsNamespace: '_channels:heartbeat'
  }, channelManager);

  channelMonitorAgent.start = channelMonitorAgent.startBroadcasting = function() {
    if (this.heartbeatResponderEmitter) return; // Already responding to heartbeats

    if (channelManager.hasChannels()) {
      logger.warn('`channelMonitorAgent.start()` must be called before channels are created.');
    }

    InfoCenterAgent.prototype.start.call(this, arguments);
  };

  channelMonitorAgent.doBroadcast = _.debounce(channelMonitorAgent.doBroadcast, 0);

  channelMonitorAgent.on('start', function() {
    channelManager
    .on(channelManager.PRODUCER_NEW_TOPIC_EVENT, onChannelManagerProducerNewTopic)
    .on(channelManager.PRODUCER_REMOVED_TOPIC_EVENT, onChannelManagerProducerRemovedTopic)
    .on(channelManager.PRODUCER_NEW_MESSAGE_EVENT, onChannelManagerProducerNewMessage)
    .on(channelManager.CONSUMER_NEW_TOPIC_EVENT, onChannelManagerConsumerNewTopic)
    .on(channelManager.CONSUMER_REMOVED_TOPIC_EVENT, onChannelManagerConsumerRemovedTopic)
    .on(channelManager.CONSUMER_NEW_MESSAGE_EVENT, onChannelManagerConsumerNewMessage);
  });

  channelMonitorAgent.on('stop', function() {
    channelManager
    .removeListener(channelManager.PRODUCER_NEW_TOPIC_EVENT, onChannelManagerProducerNewTopic)
    .removeListener(channelManager.PRODUCER_REMOVED_TOPIC_EVENT, onChannelManagerProducerRemovedTopic)
    .removeListener(channelManager.PRODUCER_NEW_MESSAGE_EVENT, onChannelManagerProducerNewMessage)
    .removeListener(channelManager.CONSUMER_NEW_TOPIC_EVENT, onChannelManagerConsumerNewTopic)
    .removeListener(channelManager.CONSUMER_REMOVED_TOPIC_EVENT, onChannelManagerConsumerRemovedTopic)
    .removeListener(channelManager.CONSUMER_NEW_MESSAGE_EVENT, onChannelManagerConsumerNewMessage);
  });

  function onChannelManagerProducerNewTopic(topic) {
    if (topic[0] === '_') return;
    findOrCreateChannelInfo(channelMonitorAgent.doc, topic).producers = true;
    channelMonitorAgent.doBroadcast();
  }

  function onChannelManagerProducerRemovedTopic(topic) {
    if (topic[0] === '_') return;
    findOrCreateChannelInfo(channelMonitorAgent.doc, topic).producers = false;
    removeStaleChannelInfo(channelMonitorAgent.doc, topic);
  }

  function onChannelManagerProducerNewMessage(topic) {
    if (topic[0] === '_') return;
    var info = findOrCreateChannelInfo(channelMonitorAgent.doc, topic);
    info.lastProducedAt = new Date();
  }

  function onChannelManagerConsumerNewTopic(topic) {
    if (topic[0] === '_') return;
    findOrCreateChannelInfo(channelMonitorAgent.doc, topic).consumers = true;
    channelMonitorAgent.doBroadcast();
  }

  function onChannelManagerConsumerRemovedTopic(topic) {
    if (topic[0] === '_') return;
    findOrCreateChannelInfo(channelMonitorAgent.doc, topic).consumers = false;
    removeStaleChannelInfo(channelMonitorAgent.doc, topic);
  }

  function onChannelManagerConsumerNewMessage(topic) {
    if (topic[0] === '_') return;
    var info = findOrCreateChannelInfo(channelMonitorAgent.doc, topic);
    info.lastConsumedAt = new Date();
  }

  function findOrCreateChannelInfo(channelInfoPerTopic, topic) {
    var channelInfo = channelInfoPerTopic[topic];
    if (channelInfo) return channelInfo;

    channelInfo = channelInfoPerTopic[topic] = {
      producers: false,
      consumers: false,
      lastProducedAt: null,
      lastConsumedAt: null
    };

    return channelInfo;
  }

  function removeStaleChannelInfo(channelInfoPerTopic, topic) {
    var channelInfo = channelInfoPerTopic[topic];
    if (!channelInfo) return;
    if (channelInfo.producers || channelInfo.consumers) return;
    delete(channelInfoPerTopic[topic]);
  }

  return channelMonitorAgent;
};
