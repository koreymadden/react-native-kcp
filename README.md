# react-native-kcp

### React Native Implementation of the [KCP Protocol](kcp).

[![JavaScript KCP](https://img.shields.io/badge/Powered_By-KCP-293C81?style=for-the-badge&logo=JavaScript&logoColor=FFFFFF)](https://reactnative.dev/docs/environment-setup)

Code from [bruce48x/kcpjs](https://github.com/bruce48x/kcpjs) and [as3long/kcpjs](https://github.com/as3long/kcpjs).

> Note: The forward error correction (FEC) feature has been removed from the codebase due to the presence of C++ code. Encrytion is also not supported with this package.

# Installation

### Install react-native-udp library

```
npm install react-native-udp
```

### Install react-native-kcp library

```
npm install react-native-kcp
```

# API

## Create Server

`ListenWithOptions`

### Parameters

| Parameter  | Type      | Description                                             |
| ---------- | --------- | ------------------------------------------------------- |
| Options    | object    | Options to configure KCP server.                        |
| UDP Socket | UdpSocket | Socket created by [react-native-udp](react-native-udp). |

#### Options Object Properties

| Property | Type           | Description                           |
| -------- | -------------- | ------------------------------------- |
| port     | number         | Listening port.                       |
| callback | ListenCallback | Callback when UDP Session is created. |

> Note: You will need to make sure to bind the socket before you pass it into the ListenWithOptions function.

## Create Client

`DialWithOptions`

### Parameters

| Parameter  | Type      | Description                                             |
| ---------- | --------- | ------------------------------------------------------- |
| Options    | object    | Options to configure KCP client.                        |
| UDP Socket | UdpSocket | Socket created by [react-native-udp](react-native-udp). |

> Note: You will need to make sure to bind the socket before you pass it into the DialWithOptions function.

#### Options Object Properties

| Property | Type   | Description     |
| -------- | ------ | --------------- |
| host     | string | Server address. |
| port     | number | Server port.    |
| conv     | number | Session ID.     |

# Server Example

```ts
import dgram from 'react-native-udp';
import { ListenWithOptions } from 'react-native-kcp';

const port = 3333;

export const kcpServer = () => {
    const socketInstance = dgram.createSocket({ type: 'udp4' });
    socketInstance.bind(port);

    const listener = ListenWithOptions(
        {
            port,
            callback: (session) => {
                console.log('callback here');
                session.on('recv', (buff: Buffer) => {
                    console.log('[MESSAGE RECEIVED FROM CLIENT]:', buff.toString());
                    console.log('[SENDING MESSAGE BACK]:', `[GREETINGS FROM HOST]: ${buff.toString()}`);
                    session.write(buff);
                });
            },
        },
        socketInstance,
    );
};
```

# Client Example

```ts
import dgram from 'react-native-udp';
import { DialWithOptions } from 'react-native-kcp';

const host = '10.104.15.237';
const port = 3333;
const conv = 255;

export const kcpClient = () => {
    const socketInstance = dgram.createSocket({ type: 'udp4' });
    socketInstance.bind(port);

    const socket = DialWithOptions(
        {
            conv: conv,
            host: host,
            port: port,
        },
        socketInstance,
    );

    socket.on('recv', (buff: Buffer) => {
        console.log('[RECEIVED KCP MESSAGE]:', buff.toString());
    });

    setInterval(() => {
        const msg = Buffer.from(new Date().toISOString());
        console.log(`[SENDING KCP MESSAGE]: ${msg.toString()}`);
        console.log('[DESTINATION]:', `${socket.host}:${socket.port}`);
        socket.write(msg);
    }, 5000);
};
```

[kcp]: https://github.com/skywind3000/kcp
[react-native-udp]: https://github.com/tradle/react-native-udp/blob/master/README
