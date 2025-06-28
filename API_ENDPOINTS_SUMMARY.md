# API 接口总结

## 完整的 API 接口列表

### 1. 认证相关 (Authentication)
| 方法 | 路径 | 描述 | 参数 |
|------|------|------|------|
| POST | `/auth/login` | 用户登录 | username, password |
| POST | `/auth/logout` | 用户登出 | - |
| POST | `/auth/refresh` | 刷新Token | - |
| GET | `/auth/verify` | 验证Token | - |
| GET | `/auth/me` | 获取当前用户信息 | - |

### 2. 用户管理 (User Management)
| 方法 | 路径 | 描述 | 参数 |
|------|------|------|------|
| GET | `/users` | 获取用户列表 | role, status, search (后端返回所有数据，前端分页) |
| POST | `/users` | 创建用户 | username, password, phone, role |
| GET | `/users/{userId}` | 获取单个用户 | - |
| PUT | `/users/{userId}` | 更新用户 | phone, password, role, status |
| DELETE | `/users/{userId}` | 删除用户 | - |


### 3. 在线用户 (Online Users)
| 方法 | 路径 | 描述 | 参数 |
|------|------|------|------|
| GET | `/users/online` | 获取在线用户列表 | page, limit, role |
| GET | `/users/online/stats` | 获取在线用户统计 | - |
| GET | `/users/online/trend` | 获取在线用户趋势 | period, startDate, endDate |


### 4. 用户详情 (User Details)
| 方法 | 路径 | 描述 | 参数 |
|------|------|------|------|
| GET | `/users/{username}/detail` | 获取用户详细信息 | - |
| GET | `/users/{username}/fatigue-events` | 获取疲劳事件历史 | startDate, endDate |
| GET | `/users/{username}/health` | 获取健康数据 | - |

### 5. 疲劳事件 (Fatigue Events)
| 方法 | 路径 | 描述 | 参数 |
|------|------|------|------|
| POST | `/users/{username}/fatigue-events` | 添加疲劳事件 | type, severity, duration, timestamp |
| PUT | `/users/{username}/fatigue-events/{eventId}` | 更新疲劳事件 | type, severity |
| DELETE | `/users/{username}/fatigue-events/{eventId}` | 删除疲劳事件 | - |



### 6. 监控数据 (Monitor Data)
| 方法 | 路径 | 描述 | 参数 |
|------|------|------|------|
| GET | `/monitor/dashboard` | 获取监控仪表板 | - |
| GET | `/monitor/users` | 获取用户监控列表 | - |
| GET | `/monitor/fatigue/stats` | 获取疲劳统计 | - |
| GET | `/monitor/fatigue/trend` | 获取疲劳趋势 | period |

## 数据模型定义

### User 用户模型
```json
{
  "username": "string",
  "password": "string (hashed)",
  "phone": "string",
  "role": "admin|monitor|driver",
  "status": "在线|离线",
  "lastLoginTime": "datetime"
}
```

### FatigueEvent 疲劳事件模型
```json
{
  "type": "闭眼|点头|分神|打哈欠",
  "severity": "低|中|高",
  "duration": "number",
  "timestamp": "datetime"
}
```


