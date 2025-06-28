// Excel疲劳报告生成模块
class FatigueExcelReportGenerator {
  constructor() {
    this.reportData = null;
    this.user = null;
  }

  // 生成疲劳报告Excel
  async generateReport(user) {
    try {
      // 检查XLSX库
      if (typeof XLSX === 'undefined') {
        throw new Error('Excel处理库未加载，无法生成报告');
      }

      this.user = user;
      this.reportData = this.prepareReportData(user);
      
      // 创建工作簿
      const workbook = XLSX.utils.book_new();
      
      // 生成各个工作表
      this.addSummarySheet(workbook);
      this.addDetailEventsSheet(workbook);
      this.addStatisticsSheet(workbook);
      this.addAnalysisSheet(workbook);
      this.addRecommendationsSheet(workbook);
      
      // 下载Excel文件
      const fileName = `疲劳报告_${user.username}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      return true;
    } catch (error) {
      console.error('生成Excel报告失败:', error);
      throw error;
    }
  }

  // 准备报告数据
  prepareReportData(user) {
    const now = new Date();
    const events = user.events || [];
    
    // 基础疲劳事件统计
    const stats = {
      totalEvents: events.length,
      highSeverityEvents: events.filter(e => this.getSeverityLevel(e.duration) === '高').length,
      mediumSeverityEvents: events.filter(e => this.getSeverityLevel(e.duration) === '中').length,
      lowSeverityEvents: events.filter(e => this.getSeverityLevel(e.duration) === '低').length,
      avgDuration: events.length > 0 ? Math.round(events.reduce((sum, e) => sum + e.duration, 0) / events.length) : 0,
      maxDuration: events.length > 0 ? Math.max(...events.map(e => e.duration)) : 0,
      minDuration: events.length > 0 ? Math.min(...events.map(e => e.duration)) : 0,
      totalDuration: events.reduce((sum, e) => sum + e.duration, 0)
    };

    // 疲劳事件类型分布统计
    const typeStats = {};
    const typeDurationStats = {};
    events.forEach(event => {
      const type = event.type || '未知类型';
      typeStats[type] = (typeStats[type] || 0) + 1;
      
      if (!typeDurationStats[type]) {
        typeDurationStats[type] = { 
          totalDuration: 0, 
          count: 0, 
          avgDuration: 0,
          maxDuration: 0
        };
      }
      
      typeDurationStats[type].totalDuration += event.duration;
      typeDurationStats[type].count++;
      typeDurationStats[type].maxDuration = Math.max(typeDurationStats[type].maxDuration, event.duration);
    });

    // 计算各类型平均持续时间
    Object.keys(typeDurationStats).forEach(type => {
      typeDurationStats[type].avgDuration = Math.round(typeDurationStats[type].totalDuration / typeDurationStats[type].count);
    });

    // 疲劳事件趋势分析（按日期）
    const dailyStats = {};
    const trendData = [];
    events.forEach(event => {
      const date = event.time.split(' ')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { 
          count: 0, 
          duration: 0, 
          highSeverityCount: 0,
          avgDuration: 0
        };
      }
      
      dailyStats[date].count++;
      dailyStats[date].duration += event.duration;
      
      if (this.getSeverityLevel(event.duration) === '高') {
        dailyStats[date].highSeverityCount++;
      }
    });

    // 计算每日平均持续时间
    Object.keys(dailyStats).forEach(date => {
      dailyStats[date].avgDuration = dailyStats[date].count > 0 ? 
        Math.round(dailyStats[date].duration / dailyStats[date].count) : 0;
    });

    // 生成趋势数据（最近7天）
    const last7Days = Object.keys(dailyStats)
      .sort((a, b) => new Date(b) - new Date(a))
      .slice(0, 7)
      .reverse();

    last7Days.forEach(date => {
      if (dailyStats[date]) {
        trendData.push({
          date: date,
          count: dailyStats[date].count,
          duration: dailyStats[date].duration,
          avgDuration: dailyStats[date].avgDuration,
          highSeverityCount: dailyStats[date].highSeverityCount,
          riskLevel: this.calculateDailyRiskLevel(dailyStats[date])
        });
      }
    });

    // 风险评估和分析
    const riskAssessment = this.performRiskAssessment(stats, typeStats, trendData);
    
    // 时间段分析
    const timeAnalysis = this.analyzeTimeDistribution(events);
    
    return {
      reportDate: now.toISOString().split('T')[0],
      reportTime: now.toTimeString().split(' ')[0].substring(0, 5),
      stats,
      typeStats,
      typeDurationStats,
      dailyStats,
      trendData,
      riskAssessment,
      timeAnalysis,
      events: events.slice(0, 50)
    };
  }

  // 根据持续时间判断严重程度
  getSeverityLevel(duration) {
    if (duration >= 30) return '高';
    if (duration >= 15) return '中';
    return '低';
  }

  // 计算每日风险等级
  calculateDailyRiskLevel(dayData) {
    const riskScore = dayData.highSeverityCount * 3 + 
                     (dayData.count - dayData.highSeverityCount) * 1 + 
                     (dayData.avgDuration > 25 ? 2 : 0);
    
    if (riskScore >= 10) return '高风险';
    if (riskScore >= 5) return '中风险';
    return '低风险';
  }

  // 执行风险评估
  performRiskAssessment(stats, typeStats, trendData) {
    const assessment = {
      overallRisk: '低风险',
      riskLevel: 1,
      riskFactors: [],
      trendAnalysis: '',
      typeAnalysis: ''
    };

    // 整体风险评估
    let riskScore = 0;
    
    if (stats.totalEvents > 25) riskScore += 4;
    else if (stats.totalEvents > 15) riskScore += 3;
    else if (stats.totalEvents > 8) riskScore += 2;
    else if (stats.totalEvents > 3) riskScore += 1;
    
    if (stats.highSeverityEvents > 8) riskScore += 5;
    else if (stats.highSeverityEvents > 5) riskScore += 4;
    else if (stats.highSeverityEvents > 3) riskScore += 3;
    else if (stats.highSeverityEvents > 1) riskScore += 2;
    
    if (stats.avgDuration > 30) riskScore += 3;
    else if (stats.avgDuration > 20) riskScore += 2;
    else if (stats.avgDuration > 15) riskScore += 1;

    // 确定风险等级
    if (riskScore >= 12) {
      assessment.overallRisk = '极高风险';
      assessment.riskLevel = 5;
    } else if (riskScore >= 9) {
      assessment.overallRisk = '高风险';
      assessment.riskLevel = 4;
    } else if (riskScore >= 6) {
      assessment.overallRisk = '中风险';
      assessment.riskLevel = 3;
    } else if (riskScore >= 3) {
      assessment.overallRisk = '低风险';
      assessment.riskLevel = 2;
    } else {
      assessment.overallRisk = '很低风险';
      assessment.riskLevel = 1;
    }

    // 风险因素分析
    if (stats.highSeverityEvents > 5) {
      assessment.riskFactors.push('高危疲劳事件频发，存在严重安全隐患');
    }
    if (stats.avgDuration > 25) {
      assessment.riskFactors.push('疲劳持续时间过长，注意力下降明显');
    }
    if (stats.totalEvents > 20) {
      assessment.riskFactors.push('疲劳事件总数偏高，需要调整作息');
    }

    // 趋势分析
    if (trendData.length >= 3) {
      const recent = trendData.slice(-3);
      const isIncreasing = recent[2].count > recent[0].count;
      
      if (isIncreasing) {
        assessment.trendAnalysis = '近期疲劳事件呈上升趋势，需要重点关注';
      } else {
        assessment.trendAnalysis = '近期疲劳事件相对稳定';
      }
    }

    // 类型分析
    if (Object.keys(typeStats).length > 0) {
      const dominantType = Object.keys(typeStats).reduce((a, b) => 
        typeStats[a] > typeStats[b] ? a : b);
      const dominantPercent = Math.round(typeStats[dominantType] / stats.totalEvents * 100);
      
      assessment.typeAnalysis = `主要疲劳表现为"${dominantType}"，占比${dominantPercent}%`;
    }

    return assessment;
  }

  // 分析时间分布
  analyzeTimeDistribution(events) {
    const timeDistribution = {
      morning: 0,    // 6-12点
      afternoon: 0,  // 12-18点
      evening: 0,    // 18-22点
      night: 0       // 22-6点
    };

    events.forEach(event => {
      const hour = parseInt(event.time.split(' ')[1].split(':')[0]);
      if (hour >= 6 && hour < 12) timeDistribution.morning++;
      else if (hour >= 12 && hour < 18) timeDistribution.afternoon++;
      else if (hour >= 18 && hour < 22) timeDistribution.evening++;
      else timeDistribution.night++;
    });

    const total = events.length;
    return {
      distribution: timeDistribution,
      percentages: {
        morning: total > 0 ? Math.round(timeDistribution.morning / total * 100) : 0,
        afternoon: total > 0 ? Math.round(timeDistribution.afternoon / total * 100) : 0,
        evening: total > 0 ? Math.round(timeDistribution.evening / total * 100) : 0,
        night: total > 0 ? Math.round(timeDistribution.night / total * 100) : 0
      }
    };
  }

  // 添加概览工作表
  addSummarySheet(workbook) {
    const data = [
      ['驾驶员疲劳监测报告'],
      [''],
      ['报告生成时间', `${this.reportData.reportDate} ${this.reportData.reportTime}`],
      ['驾驶员姓名', this.user.username],
      ['手机号码', this.user.phone || '未设置'],
      ['当前状态', this.user.status || '在线'],
      [''],
      ['整体评估'],
      ['风险等级', this.reportData.riskAssessment.overallRisk],
      ['风险评分', `${this.reportData.riskAssessment.riskLevel}/5级`],
      [''],
      ['统计概览'],
      ['总事件数', `${this.reportData.stats.totalEvents}次`],
      ['高危事件', `${this.reportData.stats.highSeverityEvents}次`],
      ['中危事件', `${this.reportData.stats.mediumSeverityEvents}次`],
      ['低危事件', `${this.reportData.stats.lowSeverityEvents}次`],
      ['平均持续时间', `${this.reportData.stats.avgDuration}秒`],
      ['最长持续时间', `${this.reportData.stats.maxDuration}秒`],
      ['总持续时间', `${this.reportData.stats.totalDuration}秒`],
      [''],
      ['趋势分析'],
      ['', this.reportData.riskAssessment.trendAnalysis],
      [''],
      ['类型分析'],
      ['', this.reportData.riskAssessment.typeAnalysis]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // 设置列宽
    worksheet['!cols'] = [
      { width: 20 },
      { width: 40 }
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, '报告概览');
  }

  // 添加详细事件工作表
  addDetailEventsSheet(workbook) {
    const headers = ['序号', '发生时间', '事件类型', '持续时间(秒)', '严重程度', '发生位置'];
    const data = [headers];

    this.reportData.events.forEach((event, index) => {
      data.push([
        index + 1,
        event.time,
        event.type || '未知类型',
        event.duration,
        this.getSeverityLevel(event.duration),
        event.location || '未知位置'
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // 设置列宽
    worksheet['!cols'] = [
      { width: 8 },   // 序号
      { width: 20 },  // 时间
      { width: 12 },  // 类型
      { width: 15 },  // 持续时间
      { width: 12 },  // 严重程度
      { width: 30 }   // 位置
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, '详细事件记录');
  }

  // 添加统计分析工作表
  addStatisticsSheet(workbook) {
    const data = [
      ['疲劳事件统计分析'],
      [''],
      ['按类型统计'],
      ['事件类型', '发生次数', '占比(%)', '平均持续时间(秒)', '最长持续时间(秒)']
    ];

    // 添加类型统计数据
    Object.keys(this.reportData.typeStats).forEach(type => {
      const count = this.reportData.typeStats[type];
      const percentage = Math.round(count / this.reportData.stats.totalEvents * 100);
      const typeDetail = this.reportData.typeDurationStats[type];

      data.push([
        type,
        count,
        percentage,
        typeDetail ? typeDetail.avgDuration : 0,
        typeDetail ? typeDetail.maxDuration : 0
      ]);
    });

    data.push(['']);
    data.push(['按严重程度统计']);
    data.push(['严重程度', '事件数量', '占比(%)']);

    const severityData = [
      ['高危', this.reportData.stats.highSeverityEvents],
      ['中危', this.reportData.stats.mediumSeverityEvents],
      ['低危', this.reportData.stats.lowSeverityEvents]
    ];

    severityData.forEach(([level, count]) => {
      const percentage = this.reportData.stats.totalEvents > 0 ?
        Math.round(count / this.reportData.stats.totalEvents * 100) : 0;
      data.push([level, count, percentage]);
    });

    data.push(['']);
    data.push(['按时间段统计']);
    data.push(['时间段', '事件数量', '占比(%)']);

    const timeData = [
      ['上午(6-12点)', this.reportData.timeAnalysis.distribution.morning, this.reportData.timeAnalysis.percentages.morning],
      ['下午(12-18点)', this.reportData.timeAnalysis.distribution.afternoon, this.reportData.timeAnalysis.percentages.afternoon],
      ['傍晚(18-22点)', this.reportData.timeAnalysis.distribution.evening, this.reportData.timeAnalysis.percentages.evening],
      ['夜间(22-6点)', this.reportData.timeAnalysis.distribution.night, this.reportData.timeAnalysis.percentages.night]
    ];

    timeData.forEach(row => {
      data.push(row);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // 设置列宽
    worksheet['!cols'] = [
      { width: 15 },
      { width: 12 },
      { width: 10 },
      { width: 18 },
      { width: 18 }
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, '统计分析');
  }

  // 添加趋势分析工作表
  addAnalysisSheet(workbook) {
    const data = [
      ['疲劳事件趋势分析'],
      [''],
      ['近7天趋势'],
      ['日期', '事件数量', '总持续时间(秒)', '平均持续时间(秒)', '高危事件数', '风险等级']
    ];

    this.reportData.trendData.forEach(day => {
      data.push([
        day.date,
        day.count,
        day.duration,
        day.avgDuration,
        day.highSeverityCount,
        day.riskLevel
      ]);
    });

    data.push(['']);
    data.push(['风险因素分析']);

    if (this.reportData.riskAssessment.riskFactors.length > 0) {
      this.reportData.riskAssessment.riskFactors.forEach((factor, index) => {
        data.push([`风险因素${index + 1}`, factor]);
      });
    } else {
      data.push(['', '暂无明显风险因素']);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // 设置列宽
    worksheet['!cols'] = [
      { width: 12 },
      { width: 12 },
      { width: 18 },
      { width: 18 },
      { width: 15 },
      { width: 12 }
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, '趋势分析');
  }

  // 添加建议措施工作表
  addRecommendationsSheet(workbook) {
    const data = [
      ['改进建议与措施'],
      [''],
      ['序号', '建议内容']
    ];

    const recommendations = this.generateRecommendations();
    recommendations.forEach((rec, index) => {
      data.push([index + 1, rec]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // 设置列宽
    worksheet['!cols'] = [
      { width: 8 },
      { width: 80 }
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, '改进建议');
  }

  // 生成智能建议
  generateRecommendations() {
    const stats = this.reportData.stats;
    const risk = this.reportData.riskAssessment;
    const timeAnalysis = this.reportData.timeAnalysis;
    const typeStats = this.reportData.typeStats;
    const recommendations = [];

    // 基于风险等级的建议
    if (risk.riskLevel >= 4) {
      recommendations.push('立即停止驾驶，强制休息至少8小时，建议就医检查身体状况');
      recommendations.push('调整作息时间，确保每日睡眠时间不少于7小时');
      recommendations.push('暂停长途驾驶任务，改为短途或市内驾驶');
    } else if (risk.riskLevel >= 3) {
      recommendations.push('减少连续驾驶时间，每2小时休息15-20分钟');
      recommendations.push('避免夜间驾驶，合理安排驾驶时间');
      recommendations.push('加强身体锻炼，提高身体素质和抗疲劳能力');
    }

    // 基于事件总数的建议
    if (stats.totalEvents > 20) {
      recommendations.push('疲劳事件频发，建议进行全面体检，排查潜在健康问题');
      recommendations.push('调整饮食结构，避免油腻食物，多食用清淡易消化食品');
    } else if (stats.totalEvents > 10) {
      recommendations.push('适当增加休息频率，避免疲劳驾驶');
    }

    // 基于高危事件的建议
    if (stats.highSeverityEvents > 5) {
      recommendations.push('高危疲劳事件过多，必须立即改善睡眠质量');
      recommendations.push('考虑更换驾驶班次，避开个人疲劳高发时段');
    }

    // 基于平均持续时间的建议
    if (stats.avgDuration > 25) {
      recommendations.push('疲劳持续时间过长，建议缩短单次驾驶时间');
      recommendations.push('学习疲劳自我识别技巧，及时发现疲劳征象');
    }

    // 基于时间分布的建议
    if (timeAnalysis.distribution.night > stats.totalEvents * 0.3) {
      recommendations.push('夜间疲劳事件过多，建议调整为白班驾驶');
      recommendations.push('如必须夜间驾驶，应提前2-3小时进行充分休息');
    }

    if (timeAnalysis.distribution.afternoon > stats.totalEvents * 0.4) {
      recommendations.push('下午疲劳高发，建议午餐后适当休息30分钟');
      recommendations.push('下午驾驶时保持车内通风，适当降低温度');
    }

    // 基于疲劳类型的建议
    const dominantType = Object.keys(typeStats).reduce((a, b) =>
      typeStats[a] > typeStats[b] ? a : b, Object.keys(typeStats)[0]);

    if (dominantType === '闭眼' && typeStats[dominantType] > stats.totalEvents * 0.3) {
      recommendations.push('闭眼疲劳频繁，存在瞌睡风险，建议立即停车休息');
      recommendations.push('检查睡眠质量，必要时使用提神饮品（适量咖啡等）');
    } else if (dominantType === '点头' && typeStats[dominantType] > stats.totalEvents * 0.25) {
      recommendations.push('点头疲劳突出，注意力不集中，建议调整座椅和驾驶姿势');
      recommendations.push('增加车内互动，如听音乐、开窗通风等保持清醒');
    } else if (dominantType === '分神' && typeStats[dominantType] > stats.totalEvents * 0.3) {
      recommendations.push('分神现象严重，建议减少车内干扰因素');
      recommendations.push('专注驾驶，避免使用手机或进行其他分散注意力的活动');
    }

    // 通用建议
    if (recommendations.length === 0 || risk.riskLevel <= 2) {
      recommendations.push('整体疲劳状况良好，继续保持规律作息');
      recommendations.push('定期进行疲劳自测，预防疲劳驾驶');
      recommendations.push('保持良好的驾驶习惯，确保行车安全');
    }

    // 预防性建议
    recommendations.push('建议安装疲劳驾驶预警设备，实时监控驾驶状态');
    recommendations.push('定期参加安全驾驶培训，提高安全意识');
    recommendations.push('建立驾驶日志，记录疲劳状况和休息时间');

    return recommendations;
  }
}

// 创建全局实例
window.fatigueReportGenerator = new FatigueExcelReportGenerator();
