// 多格式疲劳报告生成模块
class MultiFatigueReportGenerator {
  constructor() {
    this.reportData = null;
    this.user = null;
  }

  // 生成疲劳报告 - 支持多种格式
  async generateReport(user, format = 'excel') {
    try {
      this.user = user;
      this.reportData = this.prepareReportData(user);
      
      switch (format) {
        case 'excel':
          return await this.generateExcelReport();
        case 'word':
          return await this.generateWordReport();
        case 'pdf':
          return await this.generatePdfReport();
        default:
          throw new Error('不支持的格式');
      }
    } catch (error) {
      console.error('生成报告失败:', error);
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
          highSeverityCount: dailyStats[date].highSeverityCount
        });
      }
    });

    // 风险评估
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

  // 生成Excel报告
  async generateExcelReport() {
    const workbook = XLSX.utils.book_new();
    
    this.addExcelSummarySheet(workbook);
    this.addExcelDetailEventsSheet(workbook);
    this.addExcelStatisticsSheet(workbook);
    this.addExcelAnalysisSheet(workbook);
    this.addExcelRecommendationsSheet(workbook);
    
    const fileName = `疲劳报告_${this.user.username}_${this.reportData.reportDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    return true;
  }

  // 生成Word报告
  async generateWordReport() {
    const doc = new docx.Document({
      sections: [{
        properties: {},
        children: [
          // 标题
          new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: "驾驶员疲劳监测报告",
                bold: true,
                size: 32,
                color: "2E7D32"
              })
            ],
            alignment: docx.AlignmentType.CENTER,
            spacing: { after: 400 }
          }),
          
          // 基本信息
          new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: "基本信息",
                bold: true,
                size: 24,
                color: "2E7D32"
              })
            ],
            spacing: { before: 200, after: 200 }
          }),
          
          new docx.Paragraph({
            children: [
              new docx.TextRun(`报告生成时间：${this.reportData.reportDate} ${this.reportData.reportTime}`)
            ]
          }),
          
          new docx.Paragraph({
            children: [
              new docx.TextRun(`驾驶员姓名：${this.user.username}`)
            ]
          }),
          
          new docx.Paragraph({
            children: [
              new docx.TextRun(`手机号码：${this.user.phone || '未设置'}`)
            ]
          }),
          
          new docx.Paragraph({
            children: [
              new docx.TextRun(`当前状态：${this.user.status || '在线'}`)
            ]
          }),
          
          // 统计概览
          new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: "疲劳统计概览",
                bold: true,
                size: 24,
                color: "2E7D32"
              })
            ],
            spacing: { before: 400, after: 200 }
          }),
          
          new docx.Paragraph({
            children: [
              new docx.TextRun(`总事件数：${this.reportData.stats.totalEvents}次`)
            ]
          }),
          
          new docx.Paragraph({
            children: [
              new docx.TextRun(`高危事件：${this.reportData.stats.highSeverityEvents}次`)
            ]
          }),
          
          new docx.Paragraph({
            children: [
              new docx.TextRun(`中危事件：${this.reportData.stats.mediumSeverityEvents}次`)
            ]
          }),
          
          new docx.Paragraph({
            children: [
              new docx.TextRun(`低危事件：${this.reportData.stats.lowSeverityEvents}次`)
            ]
          }),
          
          new docx.Paragraph({
            children: [
              new docx.TextRun(`平均持续时间：${this.reportData.stats.avgDuration}秒`)
            ]
          }),
          
          new docx.Paragraph({
            children: [
              new docx.TextRun(`最长持续时间：${this.reportData.stats.maxDuration}秒`)
            ]
          }),
          
          new docx.Paragraph({
            children: [
              new docx.TextRun(`总持续时间：${this.reportData.stats.totalDuration}秒`)
            ]
          }),
          
          // 风险评估
          new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: "风险评估",
                bold: true,
                size: 24,
                color: "2E7D32"
              })
            ],
            spacing: { before: 400, after: 200 }
          }),
          
          new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: `整体风险等级：${this.reportData.riskAssessment.overallRisk}`,
                bold: true,
                color: this.reportData.riskAssessment.riskLevel >= 4 ? "DC3545" : 
                       this.reportData.riskAssessment.riskLevel >= 3 ? "FFC107" : "28A745"
              })
            ]
          }),
          
          new docx.Paragraph({
            children: [
              new docx.TextRun(`趋势分析：${this.reportData.riskAssessment.trendAnalysis}`)
            ]
          }),
          
          new docx.Paragraph({
            children: [
              new docx.TextRun(`类型分析：${this.reportData.riskAssessment.typeAnalysis}`)
            ]
          })
        ]
      }]
    });
    
    const buffer = await docx.Packer.toBlob(doc);
    const fileName = `疲劳报告_${this.user.username}_${this.reportData.reportDate}.docx`;
    
    // 下载文件
    const link = document.createElement('a');
    link.href = URL.createObjectURL(buffer);
    link.download = fileName;
    link.click();
    
    return true;
  }

  // 生成PDF报告（通过Word转换）
  async generatePdfReport() {
    // 先生成Word文档内容
    const wordContent = this.generateWordContent();
    
    // 创建临时HTML容器用于PDF生成
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = wordContent;
    tempDiv.style.cssText = `
      position: absolute;
      left: -9999px;
      top: -9999px;
      width: 210mm;
      padding: 20mm;
      font-family: 'Microsoft YaHei', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #333;
    `;
    
    document.body.appendChild(tempDiv);
    
    try {
      // 使用html2canvas和jsPDF生成PDF
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF.jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      const fileName = `疲劳报告_${this.user.username}_${this.reportData.reportDate}.pdf`;
      pdf.save(fileName);
      
      return true;
    } finally {
      document.body.removeChild(tempDiv);
    }
  }

  // 生成Word内容的HTML版本（用于PDF转换）
  generateWordContent() {
    return `
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2E7D32; font-size: 24px; margin-bottom: 10px;">驾驶员疲劳监测报告</h1>
        <h2 style="color: #2E7D32; font-size: 18px;">${this.user.username} 疲劳分析报告</h2>
        <p style="color: #666; font-size: 12px;">报告日期: ${this.reportData.reportDate} ${this.reportData.reportTime}</p>
      </div>
      
      <div style="margin-bottom: 25px;">
        <h3 style="color: #2E7D32; border-bottom: 2px solid #2E7D32; padding-bottom: 5px;">基本信息</h3>
        <p>驾驶员姓名：${this.user.username}</p>
        <p>手机号码：${this.user.phone || '未设置'}</p>
        <p>当前状态：${this.user.status || '在线'}</p>
      </div>
      
      <div style="margin-bottom: 25px;">
        <h3 style="color: #2E7D32; border-bottom: 2px solid #2E7D32; padding-bottom: 5px;">疲劳统计概览</h3>
        <p>总事件数：${this.reportData.stats.totalEvents}次</p>
        <p>高危事件：${this.reportData.stats.highSeverityEvents}次</p>
        <p>中危事件：${this.reportData.stats.mediumSeverityEvents}次</p>
        <p>低危事件：${this.reportData.stats.lowSeverityEvents}次</p>
        <p>平均持续时间：${this.reportData.stats.avgDuration}秒</p>
        <p>最长持续时间：${this.reportData.stats.maxDuration}秒</p>
        <p>总持续时间：${this.reportData.stats.totalDuration}秒</p>
      </div>
      
      <div style="margin-bottom: 25px;">
        <h3 style="color: #2E7D32; border-bottom: 2px solid #2E7D32; padding-bottom: 5px;">风险评估</h3>
        <p style="font-weight: bold; color: ${this.reportData.riskAssessment.riskLevel >= 4 ? '#DC3545' : 
                                              this.reportData.riskAssessment.riskLevel >= 3 ? '#FFC107' : '#28A745'};">
          整体风险等级：${this.reportData.riskAssessment.overallRisk}
        </p>
        <p>趋势分析：${this.reportData.riskAssessment.trendAnalysis}</p>
        <p>类型分析：${this.reportData.riskAssessment.typeAnalysis}</p>
      </div>
      
      <div style="margin-bottom: 25px;">
        <h3 style="color: #2E7D32; border-bottom: 2px solid #2E7D32; padding-bottom: 5px;">改进建议</h3>
        ${this.generateRecommendations().map((rec, index) => 
          `<p>${index + 1}. ${rec}</p>`
        ).join('')}
      </div>
    `;
  }

  // Excel工作表生成方法
  addExcelSummarySheet(workbook) {
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
      ['总持续时间', `${this.reportData.stats.totalDuration}秒`]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    worksheet['!cols'] = [{ width: 20 }, { width: 40 }];
    XLSX.utils.book_append_sheet(workbook, worksheet, '报告概览');
  }

  addExcelDetailEventsSheet(workbook) {
    const headers = ['序号', '发生时间', '事件类型', '持续时间(秒)', '严重程度'];
    const data = [headers];

    this.reportData.events.forEach((event, index) => {
      data.push([
        index + 1,
        event.time,
        event.type || '未知类型',
        event.duration,
        this.getSeverityLevel(event.duration)
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    worksheet['!cols'] = [
      { width: 8 }, { width: 20 }, { width: 12 }, { width: 15 }, { width: 12 }
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, '详细事件记录');
  }

  addExcelStatisticsSheet(workbook) {
    const data = [
      ['疲劳事件统计分析'],
      [''],
      ['按类型统计'],
      ['事件类型', '发生次数', '占比(%)', '平均持续时间(秒)']
    ];

    Object.keys(this.reportData.typeStats).forEach(type => {
      const count = this.reportData.typeStats[type];
      const percentage = Math.round(count / this.reportData.stats.totalEvents * 100);
      const typeDetail = this.reportData.typeDurationStats[type];

      data.push([
        type,
        count,
        percentage,
        typeDetail ? typeDetail.avgDuration : 0
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    worksheet['!cols'] = [{ width: 15 }, { width: 12 }, { width: 10 }, { width: 18 }];
    XLSX.utils.book_append_sheet(workbook, worksheet, '统计分析');
  }

  addExcelAnalysisSheet(workbook) {
    const data = [
      ['疲劳事件趋势分析'],
      [''],
      ['近7天趋势'],
      ['日期', '事件数量', '总持续时间(秒)', '平均持续时间(秒)', '高危事件数']
    ];

    this.reportData.trendData.forEach(day => {
      data.push([
        day.date,
        day.count,
        day.duration,
        day.avgDuration,
        day.highSeverityCount
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    worksheet['!cols'] = [
      { width: 12 }, { width: 12 }, { width: 18 }, { width: 18 }, { width: 15 }
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, '趋势分析');
  }

  addExcelRecommendationsSheet(workbook) {
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
    worksheet['!cols'] = [{ width: 8 }, { width: 80 }];
    XLSX.utils.book_append_sheet(workbook, worksheet, '改进建议');
  }

  // 生成智能建议
  generateRecommendations() {
    const stats = this.reportData.stats;
    const risk = this.reportData.riskAssessment;
    const recommendations = [];

    if (risk.riskLevel >= 4) {
      recommendations.push('立即停止驾驶，强制休息至少8小时，建议就医检查身体状况');
      recommendations.push('调整作息时间，确保每日睡眠时间不少于7小时');
      recommendations.push('暂停长途驾驶任务，改为短途或市内驾驶');
    } else if (risk.riskLevel >= 3) {
      recommendations.push('减少连续驾驶时间，每2小时休息15-20分钟');
      recommendations.push('避免夜间驾驶，合理安排驾驶时间');
      recommendations.push('加强身体锻炼，提高身体素质和抗疲劳能力');
    }

    if (stats.totalEvents > 20) {
      recommendations.push('疲劳事件频发，建议进行全面体检，排查潜在健康问题');
    }

    if (stats.highSeverityEvents > 5) {
      recommendations.push('高危疲劳事件过多，必须立即改善睡眠质量');
    }

    if (recommendations.length === 0) {
      recommendations.push('整体疲劳状况良好，继续保持规律作息');
      recommendations.push('定期进行疲劳自测，预防疲劳驾驶');
    }

    recommendations.push('建议安装疲劳驾驶预警设备，实时监控驾驶状态');
    recommendations.push('定期参加安全驾驶培训，提高安全意识');

    return recommendations;
  }
}

// 创建全局实例
window.fatigueReportGenerator = new MultiFatigueReportGenerator();
