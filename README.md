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

`Listen`

### Parameters

| Parameter  | Type           | Description                                             |
| ---------- | -------------- | ------------------------------------------------------- |
| UDP Socket | UdpSocket      | Socket created by [react-native-udp](react-native-udp). |
| Callback   | ListenCallback | Callback when UDP Session is created.                   |

> Note: You will need to make sure to bind the socket before you pass it into the Listen function.

## Create Client

`Dial`

### Parameters

| Parameter  | Type        | Description                                             |
| ---------- | ----------- | ------------------------------------------------------- |
| UDP Socket | UdpSocket   | Socket created by [react-native-udp](react-native-udp). |
| Options    | DialOptions | Options to configure KCP client.                        |

> Note: You will need to make sure to bind the socket before you pass it into the Dial function.

#### DialOptions Properties

| Property | Type   | Description     |
| -------- | ------ | --------------- |
| host     | string | Server address. |
| port     | number | Server port.    |
| conv     | number | Session ID.     |

# Server Example

```ts
import dgram from 'react-native-udp';
import { Listen } from 'react-native-kcp';

export const kcpServer = () => {
    const socketInstance = dgram.createSocket({ type: 'udp4' });
    socketInstance.bind(port);

    const listener = Listen(socketInstance, (session) => {
        session.on('recv', (buff: Buffer) => {
            const messageFromClient = buff.toString();
            console.debug('[MESSAGE RECEIVED FROM CLIENT]:', messageFromClient);
            console.debug('[SENDING MESSAGE BACK]');
            session.write(Buffer.from(`[GREETINGS FROM HOST]: ${messageFromClient}`));
        });
    });
};
```

# Client Example

```ts
import dgram from 'react-native-udp';
import { Dial } from 'react-native-kcp';

export const kcpClient = () => {
    const socketInstance = dgram.createSocket({ type: 'udp4' });
    socketInstance.bind(port);

    const socket = Dial(socketInstance, {
        conv,
        host,
        port,
    });

    socket.on('recv', (buff: Buffer) => {
        console.debug('[RECEIVED KCP MESSAGE]:', buff.toString());
    });

    setInterval(() => {
        const message = Buffer.from(new Date().toISOString());
        console.debug(`[SENDING MESSAGE]: ${message.toString()}`);
        console.debug('[DESTINATION]:', `${socket.host}:${socket.port}`);
        socket.write(message);
    }, 5000);
};
```

[kcp]: https://github.com/skywind3000/kcp
[react-native-udp]: https://github.com/tradle/react-native-udp/blob/master/README
