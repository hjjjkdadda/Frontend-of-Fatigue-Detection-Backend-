// AI疲劳建议生成模块
class AIFatigueAdvisor {
  constructor() {
    // 星火认知大模型配置
    this.apiConfig = {
      baseUrl: 'https://spark-api-open.xf-yun.com/v2/chat/completions',
      apiKey: 'KjiUevKchUNtWjJKNdKG:WZSwyxiLdIWUThWOUvas', // 星火API密钥
      model: 'x1', // 星火X1模型
      maxTokens: 150,
      temperature: 0.7,
      provider: 'spark'
    };
    
    // 备用的本地建议库（当API不可用时使用）
    this.fallbackRecommendations = {
      high: [
        '立即停止驾驶，强制休息至少8小时，建议就医检查身体状况',
        '调整作息时间，确保每日睡眠时间不少于7小时',
        '暂停长途驾驶任务，改为短途或市内驾驶'
      ],
      medium: [
        '减少连续驾驶时间，每2小时休息15-20分钟',
        '避免夜间驾驶，合理安排驾驶时间',
        '加强身体锻炼，提高身体素质和抗疲劳能力'
      ],
      low: [
        '整体疲劳状况良好，继续保持规律作息',
        '定期进行疲劳自测，预防疲劳驾驶',
        '保持良好的驾驶习惯，确保行车安全'
      ]
    };
  }

  // 配置API设置
  configureAPI(config) {
    this.apiConfig = { ...this.apiConfig, ...config };
  }

  // 生成个人疲劳建议
  async generatePersonalRecommendations(reportData, user) {
    try {
      // 构建提示词
      const prompt = this.buildPersonalPrompt(reportData, user);
      
      // 调用AI API
      const aiRecommendations = await this.callAIAPI(prompt);
      
      if (aiRecommendations && aiRecommendations.length > 0) {
        console.log('✅ AI建议生成成功');
        return aiRecommendations;
      } else {
        throw new Error('AI返回空建议');
      }
    } catch (error) {
      console.warn('⚠️ AI建议生成失败，使用备用建议:', error.message);
      return this.getFallbackPersonalRecommendations(reportData);
    }
  }

  // 生成总体疲劳建议
  async generateOverallRecommendations(reportData) {
    try {
      // 构建提示词
      const prompt = this.buildOverallPrompt(reportData);
      
      // 调用AI API
      const aiRecommendations = await this.callAIAPI(prompt);
      
      if (aiRecommendations && aiRecommendations.length > 0) {
        console.log('✅ AI总体建议生成成功');
        return aiRecommendations;
      } else {
        throw new Error('AI返回空建议');
      }
    } catch (error) {
      console.warn('⚠️ AI总体建议生成失败，使用备用建议:', error.message);
      return this.getFallbackOverallRecommendations(reportData);
    }
  }

  // 构建个人建议提示词
  buildPersonalPrompt(reportData, user) {
    const stats = reportData.stats;
    const risk = reportData.riskAssessment;
    const timeAnalysis = reportData.timeAnalysis;

    return `这是单人疲劳的建议情况。根据以下驾驶员疲劳监测数据，给出个人疲劳驾驶建议：

驾驶员：${user.username}，当前状态：${user.status || '在线'}

疲劳数据：
- 总疲劳事件：${stats.totalEvents}次
- 高危事件：${stats.highSeverityEvents}次，中危事件：${stats.mediumSeverityEvents}次，低危事件：${stats.lowSeverityEvents}次
- 平均持续时间：${stats.avgDuration}秒，最长持续时间：${stats.maxDuration}秒
- 风险等级：${risk.overallRisk}

时间分布：上午${timeAnalysis.distribution.morning}次(${timeAnalysis.percentages.morning}%)，下午${timeAnalysis.distribution.afternoon}次(${timeAnalysis.percentages.afternoon}%)，傍晚${timeAnalysis.distribution.evening}次(${timeAnalysis.percentages.evening}%)，夜间${timeAnalysis.distribution.night}次(${timeAnalysis.percentages.night}%)

疲劳类型：${Object.entries(reportData.typeStats).map(([type, count]) => `${type}${count}次`).join('，')}

请直接给出5-8条个人疲劳驾驶建议，分点作答，不需要分析过程。`;
  }

  // 构建总体建议提示词
  buildOverallPrompt(reportData) {
    const stats = reportData.overallStats;
    const riskLevels = reportData.riskLevels;

    return `这是针对管理员如何管理所有疲劳驾驶员的建议情况。根据以下车队整体疲劳监测数据，给出管理建议：

车队数据：
- 总驾驶员：${stats.totalUsers}人（在线${stats.onlineUsers}人，离线${stats.offlineUsers}人）
- 总疲劳事件：${stats.totalFatigueEvents}次，总疲劳时长：${stats.totalFatigueDuration}秒
- 人均疲劳事件：${stats.avgFatiguePerUser}次，人均疲劳时长：${stats.avgDurationPerUser}秒

风险分布：高风险${riskLevels.high}人，中风险${riskLevels.medium}人，低风险${riskLevels.low}人

疲劳最多前5名：${reportData.usersByFatigueCount.slice(0, 5).map(user =>
  `${user.username}(${user.fatigueCount}次)`
).join('，')}

请直接给出6-10条管理员管理疲劳驾驶员的建议，分点作答，不需要分析过程。`;
  }

  // 调用AI API
  async callAIAPI(prompt) {
    if (!this.apiConfig.apiKey) {
      throw new Error('API密钥未配置');
    }

    // 根据不同的服务商构建请求体
    let requestBody;
    let headers;

    if (this.apiConfig.provider === 'spark') {
      // 星火认知大模型的请求格式
      requestBody = {
        model: this.apiConfig.model,
        messages: [
          {
            role: 'system',
            content: '分两种情况,一种是单人疲劳的建议和针对管理员如何管理所有疲劳驾驶员的建议\n第一种就是根据疲劳驾驶员的疲劳信息给出一些建议，生成建议内容。分点作答,不需要你分析,而是直接给出平时的建议\n第二种就是建议管理员如何管理疲劳驾驶员的建议,比如对高风险人员进行重点监控，增加休息频率，定期组织安全驾驶培训，提高驾驶员安全意识，建立疲劳驾驶预警机制，及时发现和处理疲劳状态，合理安排驾驶班次，避免长时间连续驾驶，加强驾驶员健康管理，定期进行体检，完善疲劳监测设备，提高监测精度和覆盖率，建立疲劳驾驶事件报告和分析制度，制定个性化的驾驶员作息时间表\n请直接给出建议,不需要前面的分析过程'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.apiConfig.maxTokens,
        temperature: this.apiConfig.temperature,
        top_k: 6,
        stream: false, // 使用非流式响应
        tools: [
          {
            web_search: {
              search_mode: "normal",
              enable: false
            },
            type: "web_search"
          }
        ]
      };

      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiConfig.apiKey}`
      };
    } else {
      // 其他服务商的标准格式
      requestBody = {
        model: this.apiConfig.model,
        messages: [
          {
            role: 'system',
            content: '你是一位专业的驾驶安全顾问，专门为驾驶员和车队管理者提供疲劳驾驶预防建议。请提供实用、具体、可操作的建议。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.apiConfig.maxTokens,
        temperature: this.apiConfig.temperature
      };

      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiConfig.apiKey}`
      };
    }

    const response = await fetch(this.apiConfig.baseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API请求失败: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    if (data.choices && data.choices[0] && data.choices[0].message) {
      const content = data.choices[0].message.content;

      // 解析星火API的响应
      return this.parseAIResponse(content);
    }

    throw new Error('AI响应格式错误');
  }

  // 解析AI响应内容
  parseAIResponse(content) {
    // 尝试解析为JSON数组
    try {
      const recommendations = JSON.parse(content);
      if (Array.isArray(recommendations)) {
        return recommendations;
      }
    } catch (e) {
      // JSON解析失败，按行分割处理
    }

    // 按行分割并清理格式
    const lines = content.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const recommendations = [];

    for (const line of lines) {
      // 移除序号前缀 (1. 2. 等)
      let cleanLine = line.replace(/^\d+[\.\)]\s*/, '');

      // 移除项目符号 (- * • 等)
      cleanLine = cleanLine.replace(/^[-\*•]\s*/, '');

      // 移除多余的空格
      cleanLine = cleanLine.trim();

      // 过滤掉太短的内容
      if (cleanLine.length > 10) {
        recommendations.push(cleanLine);
      }
    }

    return recommendations.length > 0 ? recommendations : ['建议保持规律作息，注意行车安全'];
  }

  // 获取备用个人建议
  getFallbackPersonalRecommendations(reportData) {
    const risk = reportData.riskAssessment;
    const recommendations = [];
    
    // 根据风险等级选择基础建议
    if (risk.riskLevel >= 4) {
      recommendations.push(...this.fallbackRecommendations.high);
    } else if (risk.riskLevel >= 3) {
      recommendations.push(...this.fallbackRecommendations.medium);
    } else {
      recommendations.push(...this.fallbackRecommendations.low);
    }
    
    // 添加通用建议
    recommendations.push('建议安装疲劳驾驶预警设备，实时监控驾驶状态');
    recommendations.push('定期参加安全驾驶培训，提高安全意识');
    
    return recommendations;
  }

  // 获取备用总体建议
  getFallbackOverallRecommendations() {
    return [
      '对高风险人员进行重点监控，增加休息频率',
      '定期组织安全驾驶培训，提高驾驶员安全意识',
      '建立疲劳驾驶预警机制，及时发现和处理疲劳状态',
      '合理安排驾驶班次，避免长时间连续驾驶',
      '加强驾驶员健康管理，定期进行体检',
      '完善疲劳监测设备，提高监测精度和覆盖率',
      '建立疲劳驾驶事件报告和分析制度',
      '制定个性化的驾驶员作息时间表'
    ];
  }

  // 测试API连接
  async testAPIConnection() {
    try {
      const testPrompt = '请简单回复"连接成功"';
      const response = await this.callAIAPI(testPrompt);
      return { success: true, response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// 创建全局实例
window.aiFatigueAdvisor = new AIFatigueAdvisor();

// 页面加载时输出AI状态
document.addEventListener('DOMContentLoaded', () => {
  console.log('🤖 星火认知大模型已加载，将在生成报告时自动调用AI生成建议');
});
