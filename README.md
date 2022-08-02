# ham-kcpjs

纯 js 实现 kcp

代码来自 [kcpjs](https://github.com/bruce48x/kcpjs)

去掉了FEC 前向纠错, 因为里面有C++代码

# 示例1
```sh
ts-node examples/echo.ts
```

# 示例2
```sh
ts-node examples/server.ts
ts-node examples/client.ts
```

# API

## 创建 server
ListenWithOptions

### 参数

port
监听的端口

block
加密模块

callback
客户端连接成功的回调

## 创建 client
DialWithOptions

### 参数

host
服务器地址

port
服务器端口

conv
会话ID

block
加密模块
