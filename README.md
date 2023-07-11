# react-native-kcp

### Pure JavaScript Implementation of the KCP Protocol.

[![JavaScript KCP](https://img.shields.io/badge/Powered_By-KCP-293C81?style=for-the-badge&logo=JavaScript&logoColor=FFFFFF)](https://reactnative.dev/docs/environment-setup)

Code from [bruce48x/kcpjs](https://github.com/bruce48x/kcpjs) and [as3long/kcpjs](https://github.com/as3long/kcpjs).

> Note: The forward error correction (FEC) feature has been removed from the codebase due to the presence of C++ code.

# Example 1
```sh
ts-node examples/echo.ts
```

# Example 2
```sh
ts-node examples/server.ts
ts-node examples/client.ts
```

# API

## Create Server
```ListenWithOptions```

#### Parameters

| Option | Description |
| ------ | ----------- |
| port | Listening port. |
| block | Encryption module. |
| callback | Callback for successful client connection. |

## Create Client
```DialWithOptions```

#### Parameters

| Option | Description |
| ------ | ----------- |
| host | Server address. |
| port | Server port. |
| conv | Session ID. |
| block | Encryption module. |
