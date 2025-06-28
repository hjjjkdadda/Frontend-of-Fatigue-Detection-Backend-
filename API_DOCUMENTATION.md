# 疲劳驾驶监测系统 API 文档

## 基础信息

- **Base URL**: `http://localhost:3000/api`
- **认证方式**: Bearer Token
- **数据格式**: JSON
- **字符编码**: UTF-8

## 通用响应格式

### 成功响应
```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 1. 认证相关 API

### 1.1 用户登录
- **URL**: `POST /auth/login`
- **描述**: 用户登录验证
- **请求体**:
```json
{
  "username": "string",
  "password": "string",
  "rememberMe": "boolean"
}
```
- **响应数据**:
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "username": "string",
    "role": "admin|monitor",
    "phone": "string",
  
    "avatar": "string",
    "lastLoginTime": "string",
    "permissions": ["string"]
  }
}
```

### 1.2 用户登出
- **URL**: `POST /auth/logout`
- **描述**: 用户登出
- **请求头**: `Authorization: Bearer {token}`

### 1.3 刷新Token
- **URL**: `POST /auth/refresh`
- **描述**: 刷新访问令牌
- **请求头**: `Authorization: Bearer {token}`

### 1.4 验证Token
- **URL**: `GET /auth/verify`
- **描述**: 验证令牌有效性
- **请求头**: `Authorization: Bearer {token}`

## 2. 用户管理 API

### 2.1 获取用户列表
- **URL**: `GET /users`
- **描述**: 获取所有符合条件的用户数据，前端负责分页和筛选显示
- **查询参数**:
  - `role`: 角色筛选（可选）
  - `status`: 状态筛选（可选）
  - `search`: 搜索关键词（可选）
- **响应数据**:
```json
{
  "users": [
    {
      "username": "string",
      "phone": "string",
      "role": "admin|monitor|driver",
      "status": "在线|离线",
      "lastLoginTime": "string"
    }
  ]
}
```

### 2.2 创建用户
- **URL**: `POST /users`
- **描述**: 创建新用户
- **请求体**:
```json
{
  "username": "string",
  "password": "string",
  "phone": "string",
  "role": "admin|monitor|driver"
}
```

### 2.3 更新用户
- **URL**: `PUT /users/{userId}`
- **描述**: 更新用户信息
- **请求体**:
```json
{
  "phone": "string",
  "password": "string",
  "role": "admin|monitor|driver",
  "status": "在线|离线"
}
```

### 2.4 删除用户
- **URL**: `DELETE /users/{userId}`
- **描述**: 删除用户

### 2.5 批量操作用户
- **URL**: `POST /users/batch`
- **描述**: 批量操作用户
- **请求体**:
```json
{
  "userIds": ["string"],
  "action": "activate|deactivate|delete",
  "data": {}
}
```

## 3. 在线用户 API

### 3.1 获取在线用户列表
- **URL**: `GET /online-users`
- **描述**: 获取当前在线用户列表
- **查询参数**:
  - `page`: 页码
  - `limit`: 每页数量
  - `role`: 角色筛选
- **响应数据**:
```json
{
  "onlineUsers": [
    {
      "id": "string",
      "username": "string",
      "role": "admin|monitor",
      "status": "online|driving|resting",
      "loginTime": "string",
      "lastActiveTime": "string",
      "currentActivity": "string"
    }
  ],
  "summary": {
    "totalOnline": "number",
    "adminCount": "number",
    "monitorCount": "number",
    "driverCount": "number"
  }
}
```

### 3.2 更新用户在线状态
- **URL**: `PUT /online-users/{userId}/status`
- **描述**: 更新用户在线状态
- **请求体**:
```json
{
  "status": "online|driving|resting|offline",
  "location": "string",
  "activity": "string"
}
```

## 4. 用户详情 API

### 4.1 获取用户详细信息
- **URL**: `GET /users/{username}/detail`
- **描述**: 获取用户详细信息
- **响应数据**:
```json
{
  "user": {
    "id": "string",
    "username": "string",
    "phone": "string",
  
    "role": "admin|monitor",
    "status": "active|inactive|suspended",
    "avatar": "string",
    "department": "string",
    "vehicleId": "string",
    "createdAt": "string",
    "lastLoginTime": "string"
  },
  "stats": {
    "fatigueCount": "number",
    "fatigueDuration": "number",
    "totalDrivingTime": "number",
    "totalDistance": "number",
    "safetyScore": "number"
  },
  "recentActivity": [
    {
      "type": "login|logout|fatigue|driving",
      "timestamp": "string",
      "description": "string",
      "location": "string"
    }
  ]
}
```

### 4.2 获取用户疲劳事件历史
- **URL**: `GET /users/{username}/fatigue-events`
- **描述**: 获取用户疲劳事件历史记录
- **查询参数**:
  - `page`: 页码
  - `limit`: 每页数量
  - `startDate`: 开始日期
  - `endDate`: 结束日期
  - `type`: 事件类型
  - `severity`: 严重程度
- **响应数据**:
```json
{
  "events": [
    {
      "id": "string",
      "type": "闭眼|点头|分神|打哈欠",
      "severity": "低|中|高",
      "duration": "number",
      "timestamp": "string",
      "location": "string",
      "vehicleId": "string",
      "deviceId": "string",
      "videoUrl": "string",
      "processed": "boolean"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "totalPages": "number"
  },
  "summary": {
    "totalEvents": "number",
    "highSeverityEvents": "number",
    "mediumSeverityEvents": "number",
    "lowSeverityEvents": "number",
    "avgDuration": "number",
    "maxDuration": "number",
    "totalDuration": "number"
  }
}
```

### 4.3 获取用户实时监控流
- **URL**: `GET /users/{username}/video-stream`
- **描述**: 获取用户实时视频监控流URL
- **响应数据**:
```json
{
  "streamUrl": "string",
  "status": "active|inactive",
  "quality": "high|medium|low",
  "deviceInfo": {
    "deviceId": "string",
    "deviceName": "string",
    "resolution": "string",
    "frameRate": "number"
  }
}
```

### 4.4 获取用户实时事件
- **URL**: `GET /users/{username}/realtime-events`
- **描述**: 获取用户最近的实时事件
- **查询参数**:
  - `limit`: 返回数量（默认10）
- **响应数据**:
```json
{
  "events": [
    {
      "id": "string",
      "type": "fatigue|alert|normal",
      "subType": "闭眼|点头|分神|打哈欠",
      "severity": "低|中|高",
      "timestamp": "string",
      "description": "string",
      "location": "string",
      "handled": "boolean"
    }
  ]
}
```

### 4.5 获取用户视频历史记录
- **URL**: `GET /users/{username}/video-history`
- **描述**: 获取用户视频历史记录
- **查询参数**:
  - `page`: 页码
  - `limit`: 每页数量
  - `startDate`: 开始日期
  - `endDate`: 结束日期
  - `search`: 搜索关键词
- **响应数据**:
```json
{
  "videos": [
    {
      "id": "string",
      "title": "string",
      "duration": "number",
      "fileSize": "number",
      "recordTime": "string",
      "location": "string",
      "videoUrl": "string",
      "thumbnailUrl": "string",
      "eventCount": "number",
      "tags": ["string"]
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "totalPages": "number"
  }
}
```

### 4.6 获取用户健康数据
- **URL**: `GET /users/{username}/health`
- **描述**: 获取用户健康数据
- **响应数据**:
```json
{
  "healthData": {
    "fatigueLevel": "number"
  }
}
```



## 5. 疲劳事件 API

### 5.1 添加疲劳事件
- **URL**: `POST /users/{username}/fatigue-events`
- **描述**: 添加新的疲劳事件
- **请求体**:
```json
{
  "type": "闭眼|点头|分神|打哈欠",
  "severity": "低|中|高",
  "duration": "number",
  "timestamp": "string"
}
```

### 5.2 更新疲劳事件
- **URL**: `PUT /users/{username}/fatigue-events/{eventId}`
- **描述**: 更新疲劳事件信息
- **请求体**:
```json
{
  "type": "闭眼|点头|分神|打哈欠",
  "severity": "低|中|高"
}
```

### 5.3 删除疲劳事件
- **URL**: `DELETE /users/{username}/fatigue-events/{eventId}`
- **描述**: 删除疲劳事件

### 5.4 批量导入疲劳事件
- **URL**: `POST /users/{username}/fatigue-events/batch`
- **描述**: 批量导入疲劳事件
- **请求体**:
```json
{
  "events": [
    {
      "type": "闭眼|点头|分神|打哈欠",
      "severity": "低|中|高",
      "duration": "number",
      "timestamp": "string"
    }
  ]
}
```


