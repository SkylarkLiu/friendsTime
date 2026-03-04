# 好友派对助手 - 房间同步服务

MVP 内存版后端，支持 HTTP + WebSocket 实时房间同步。

## 快速启动

```bash
cd server
npm install
npm start
```

开发模式（文件变更自动重启）：
```bash
npm run dev
```

## 环境变量

| 变量 | 说明 | 默认 |
|------|------|------|
| PORT | HTTP 端口 | 3000 |
| HOST | 监听地址 | 0.0.0.0 |

## 接口

- `POST /v1/rooms` - 创建房间
- `POST /v1/rooms/:roomId/join` - 加入房间
- `GET /v1/rooms/:roomId` - 获取房间快照
- `POST /v1/rooms/:roomId/leave` - 离开房间
- `POST /v1/rooms/:roomId/update` - 房主更新房间
- `GET /v1/ws?roomId=&playerId=&token=` - WebSocket 实时同步

## 部署说明

打包成 APK 后，10 台手机需能访问同一台服务器。请将客户端 `.env.production` 中的 `VITE_API_BASE_URL` 改为你的服务器公网地址，例如：

```
VITE_API_BASE_URL=http://192.168.1.100:3000
# 或使用域名
VITE_API_BASE_URL=https://api.yourdomain.com
```

注意：手机访问需与服务器在同一局域网，或服务器有公网 IP/域名。
