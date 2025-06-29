// 全局美观Toast组件
// 统一的Toast消息显示系统

// 确保只初始化一次
if (!window.ToastManager) {
  window.ToastManager = {
    // 创建Toast容器
    createContainer() {
      let toastContainer = document.getElementById('toast-container');
      if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          max-width: 420px;
          pointer-events: none;
        `;
        document.body.appendChild(toastContainer);
      }
      return toastContainer;
    },

    // 显示Toast消息
    show(message, type = 'info', duration = 5000) {
      const toastContainer = this.createContainer();
      
      // 创建toast元素
      const toast = document.createElement('div');
      const toastId = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
      toast.id = toastId;

      // 根据类型设置样式
      const typeStyles = {
        success: { 
          bg: 'linear-gradient(135deg, #4CAF50, #45a049)', 
          text: '#ffffff', 
          icon: 'fa-check-circle',
          shadow: '0 8px 32px rgba(76, 175, 80, 0.3)',
          border: 'rgba(76, 175, 80, 0.3)'
        },
        error: { 
          bg: 'linear-gradient(135deg, #f44336, #d32f2f)', 
          text: '#ffffff', 
          icon: 'fa-exclamation-circle',
          shadow: '0 8px 32px rgba(244, 67, 54, 0.3)',
          border: 'rgba(244, 67, 54, 0.3)'
        },
        warning: { 
          bg: 'linear-gradient(135deg, #ff9800, #f57c00)', 
          text: '#ffffff', 
          icon: 'fa-exclamation-triangle',
          shadow: '0 8px 32px rgba(255, 152, 0, 0.3)',
          border: 'rgba(255, 152, 0, 0.3)'
        },
        info: { 
          bg: 'linear-gradient(135deg, #2196F3, #1976D2)', 
          text: '#ffffff', 
          icon: 'fa-info-circle',
          shadow: '0 8px 32px rgba(33, 150, 243, 0.3)',
          border: 'rgba(33, 150, 243, 0.3)'
        }
      };

      const style = typeStyles[type] || typeStyles.info;

      toast.style.cssText = `
        background: ${style.bg};
        color: ${style.text};
        padding: 16px 20px;
        border-radius: 12px;
        margin-bottom: 12px;
        box-shadow: ${style.shadow};
        transform: translateX(100%);
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        display: flex;
        align-items: center;
        font-size: 14px;
        font-weight: 500;
        min-width: 320px;
        max-width: 420px;
        backdrop-filter: blur(10px);
        border: 1px solid ${style.border};
        pointer-events: auto;
        position: relative;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;

      // 创建Toast内容
      toast.innerHTML = `
        <i class="fa ${style.icon}" style="
          margin-right: 12px;
          font-size: 18px;
          opacity: 0.9;
          flex-shrink: 0;
        "></i>
        <span style="
          flex: 1;
          line-height: 1.4;
          word-break: break-word;
          margin-right: 8px;
        ">${message}</span>
        <button type="button" class="toast-close-btn" style="
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: ${style.text};
          padding: 4px;
          cursor: pointer;
          font-size: 11px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          font-weight: bold;
          line-height: 1;
          flex-shrink: 0;
        ">×</button>
      `;

      // 添加关闭按钮事件监听器
      const closeBtn = toast.querySelector('.toast-close-btn');
      closeBtn.addEventListener('click', () => {
        if (toast.parentNode) {
          toast.style.transform = 'translateX(100%)';
          setTimeout(() => {
            if (toast.parentNode) {
              toast.remove();
            }
          }, 400);
        }
      });

      // 添加悬停效果
      closeBtn.addEventListener('mouseover', () => {
        closeBtn.style.background = 'rgba(255,255,255,0.3)';
        closeBtn.style.transform = 'scale(1.1)';
      });

      closeBtn.addEventListener('mouseout', () => {
        closeBtn.style.background = 'rgba(255,255,255,0.2)';
        closeBtn.style.transform = 'scale(1)';
      });

      // 添加微妙的光泽效果
      const shimmer = document.createElement('div');
      shimmer.style.cssText = `
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
        animation: shimmer 3s infinite;
        pointer-events: none;
      `;

      // 添加shimmer动画的CSS（如果还没有）
      if (!document.getElementById('toast-shimmer-style')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'toast-shimmer-style';
        styleElement.textContent = `
          @keyframes shimmer {
            0% { left: -100%; }
            100% { left: 100%; }
          }
        `;
        document.head.appendChild(styleElement);
      }

      toast.appendChild(shimmer);
      toastContainer.appendChild(toast);

      // 显示动画
      setTimeout(() => {
        toast.style.transform = 'translateX(0) scale(1)';
      }, 100);

      // 自动隐藏
      if (duration > 0) {
        setTimeout(() => {
          if (toast.parentNode) {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
              if (toast.parentNode) {
                toast.remove();
              }
            }, 400);
          }
        }, duration);
      }

      return toast;
    },

    // 便捷方法
    success(message, duration = 5000) {
      return this.show(message, 'success', duration);
    },

    error(message, duration = 6000) {
      return this.show(message, 'error', duration);
    },

    warning(message, duration = 5000) {
      return this.show(message, 'warning', duration);
    },

    info(message, duration = 4000) {
      return this.show(message, 'info', duration);
    },

    // 清除所有Toast
    clear() {
      const container = document.getElementById('toast-container');
      if (container) {
        container.innerHTML = '';
      }
    }
  };

  // 创建全局showToast函数，保持向后兼容
  window.showToast = function(message, type = 'info', duration = 5000) {
    return window.ToastManager.show(message, type, duration);
  };

  console.log('✨ 美观Toast组件已加载');
}
