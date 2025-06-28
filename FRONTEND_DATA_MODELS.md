# 前端数据模型定义

## 1. 用户详情页面数据模型

### 用户基本信息 (User Detail)
```javascript
{
  // 基本信息
  username: "string",
  phone: "string",
  role: "admin|monitor|driver",
  status: "在线|离线",
  lastLoginTime: "string"        // 最后登录时间
}
```

### 用户健康数据 (Health Data)
```javascript
{
  fatigueLevel: "number"         // 疲劳度 0-100（页面显示用）
}
```

### 疲劳事件 (Fatigue Event)
```javascript
{
  type: "闭眼|点头|分神|打哈欠|眨眼",
  severity: "低|中|高",
  duration: "number",            // 持续时间（秒）
  timestamp: "string"            // 发生时间
}
```

## 2. 监控页面数据模型

### 监控仪表板数据 (Monitor Dashboard)
```javascript
{
  onlineCount: "number",         // 在线人数
  totalCount: "number",          // 总人数
  fatigueCount: "number",        // 疲劳事件总数

  users: [
    {
      username: "string",
      phone: "string",
      fatigueCount: "number",    // 疲劳次数
      fatigueDuration: "number", // 疲劳时长（秒）
      status: "在线|离线",
      events: [
        {
          time: "string",        // 时间
          duration: "number",    // 持续时间
          type: "string"         // 事件类型
        }
      ]
    }
  ],

  fatigueTrend: ["number"],      // 疲劳趋势数据
  fatigueTrendDate: ["string"]   // 趋势日期
}
```



## 3. 在线用户数据模型

### 在线用户列表 (Online Users)
```javascript
{
  onlineUsers: [
    {
      username: "string",
      role: "admin|monitor|driver",
      phone: "string",
      status: "在线|离线"
    }
  ]
}
```

## 4. 视频监控数据模型

### 视频历史记录 (Video History)
```javascript
{
  videos: [
    {
      title: "string",           // 标题
      duration: "number",        // 时长（秒）
      recordTime: "string"       // 录制时间
    }
  ]
}
```







## 5. API响应格式

### 成功响应
```javascript
{
  success: true,
  data: {},                      // 具体数据
  message: "string",             // 成功消息
  timestamp: "string"            // 时间戳
}
```

### 错误响应
```javascript
{
  success: false,
  error: {
    code: "string",              // 错误代码
    message: "string",           // 错误消息
    details: {}                  // 错误详情
  },
  timestamp: "string"
}
```
