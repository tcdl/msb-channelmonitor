# msb-channelmonitor
Extracted monitoring feature for [msb](https://github.com/tcdl/msb)

## Usage

Ensure you load this module before loading [msb](https://github.com/tcdl/msb) for the first time. E.g.

```
require('msb-channelmonitor');
var msb = require('msb');
```

## General

### Monitoring

The [Channel Monitor Agent](#channel-monitor-agent) reports the status of producer/consumer channels to all instances of [Channel Monitor](#channel-monitor). You should start the `channelMonitorAgent` in all services you wish to report from:

```js
msb.channelMonitorAgent.start()
```

The [CLI monitor](#cli-monitor) as well as the [archiver service](https://github.com/tcdl/es-archiver) are examples where a [Channel Monitor](#channel-monitor) is used for discovery of new channels.

### CLI Monitor

The CLI monitoring tool can be run for a globally installed MSB, by running:

```
$ node_modules/msb/bin/msb-monitor
```

Or if globally installed, i.e. `npm install msb -g`:

```
$ msb-monitor
```

Producing a table such as:

```
┌──────────────────────────────────┬──────┬───────────────┬──────┬───────────────┐
│ Topic                            │ Prod │ Last Produced │ Cons │ Last Consumed │
├──────────────────────────────────┼──────┼───────────────┼──────┼───────────────┤
│ example:topic                    │ 2    │ just now      │ 0    │ just now      │
│ example:topic:response:3cb35cdb… │ 2    │ just now      │ 0    │ just now      │
│ example:topic:response:3cb35cdb… │ 2    │ just now      │ 0    │ just now      │
└──────────────────────────────────┴──────┴───────────────┴──────┴───────────────┘
```

## API

### Channel Monitor

A channel monitor sends heartbeats and listens for information on producers and consumers on remote `channelManager` instances.

```js
var channelMonitor = msb.channelMonitor; // Default channelManager monitor, or
var channelMonitor = channelManager.monitor; // Additional channelManager monitor
```

#### channelMonitor.start()

Starts sending heartbeats and listening.

#### Event: 'update'

`function(doc) { }`

- **doc** Object
- **doc.infoByTopic** Object with topics as keys with objects as values e.g.

```js
{
  consumers: ['remoteInstanceId'],
  producers: ['remoteInstanceId'],
  consumedCount: 0,
  producedCount: 0,
  lastProducedAt: Tue Mar 31 2015 11:11:35 GMT+0100 (BST),
  lastConsumedAt: Tue Mar 31 2015 11:11:35 GMT+0100 (BST)
}
```

- **doc.serviceDetailsById** Object with instance IDs as keys with objects containing the remote `config.serviceDetails`.

#### Event: 'heartbeat'

Emitted when a new heartbeat has started.

### Channel Monitor Agent

```js
var channelMonitorAgent = msb.channelMonitorAgent; // Default channelManager monitoring agent, or
var channelMonitorAgent = channelManager.monitorAgent; // Additional channelManager monitoring agent
```

#### channelMonitorAgent.start()

Starts publishing information about the producers and consumers created on the `channelManager`, and responds to heartbeats.
