// scripts/email-service.js

// EmailJS配置
const EMAILJS_SERVICE_ID = 'service_h3s57ab';
const EMAILJS_TEMPLATE_ID = 'template_mv4f6yl';
const EMAILJS_PUBLIC_KEY = 'h9HzplFZmfyXugW_P'; // 需要在EmailJS中配置

// 初始化EmailJS
let emailjsLoaded = false;

async function loadEmailJS() {
  if (emailjsLoaded) return;
  if (window.emailjs) {
    emailjs.init(EMAILJS_PUBLIC_KEY);
    emailjsLoaded = true;
    return;
  }
  try {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
      script.onload = () => {
        if (window.emailjs) {
          emailjs.init(EMAILJS_PUBLIC_KEY);
          emailjsLoaded = true;
          resolve();
        } else {
          reject(new Error('EmailJS SDK未挂载'));
        }
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  } catch (error) {
    console.error('加载EmailJS失败:', error);
  }
}

// 从Firestore获取邮件设置
async function getEmailSettings() {
  try {
    const { db } = await import('./firebase.js');
    const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js');
    
    const settingsDoc = await getDoc(doc(db, 'settings', 'email'));
    
    if (settingsDoc.exists()) {
      const settings = settingsDoc.data();
      return {
        enabled: settings.enabled || false,
        yourEmail: settings.yourEmail || '',
        girlfriendEmail: settings.girlfriendEmail || '',
        serviceId: settings.serviceId || EMAILJS_SERVICE_ID,
        templateId: settings.templateId || EMAILJS_TEMPLATE_ID,
        publicKey: settings.publicKey || EMAILJS_PUBLIC_KEY
      };
    }
    
    return {
      enabled: false,
      yourEmail: '',
      girlfriendEmail: '',
      serviceId: EMAILJS_SERVICE_ID,
      templateId: EMAILJS_TEMPLATE_ID,
      publicKey: EMAILJS_PUBLIC_KEY
    };
  } catch (error) {
    console.error('获取邮件设置失败:', error);
    return { enabled: false };
  }
}

// 发送邮件函数
async function sendEmail(templateParams, emailSettings = null) {
  try {
    // 获取邮件设置
    const settings = emailSettings || await getEmailSettings();
    
    if (!settings.enabled) {
      console.log('邮件提醒已禁用');
      return { success: false, message: '邮件提醒已禁用' };
    }
    
    if (!settings.yourEmail || !settings.girlfriendEmail) {
      console.log('邮箱地址未配置');
      return { success: false, message: '邮箱地址未配置' };
    }
    
    // 确保EmailJS已加载
    await loadEmailJS();
    
    if (!emailjsLoaded) {
      throw new Error('EmailJS加载失败');
    }
    
    // 更新EmailJS配置
    if (settings.publicKey && settings.publicKey !== EMAILJS_PUBLIC_KEY) {
      emailjs.init(settings.publicKey);
    }
    
    // 合并邮件参数
    const params = {
      ...templateParams,
      your_email: settings.yourEmail,
      girlfriend_email: settings.girlfriendEmail,
      timestamp: new Date().toLocaleString('zh-CN')
    };
    
    // 发送邮件
    const result = await emailjs.send(
      settings.serviceId,
      settings.templateId,
      params
    );
    
    console.log('邮件发送成功:', result);
    return { success: true, message: '邮件发送成功' };
    
  } catch (error) {
    console.error('邮件发送失败:', error);
    return { success: false, message: `邮件发送失败: ${error.message}` };
  }
}

// 监狱相关邮件模板
const PRISON_TEMPLATES = {
  // 入狱通知
  imprisoned: {
    subject: '🚨 恋爱监狱通知：你的男朋友被关押了！',
    title: '入狱通知',
    message: '你的男朋友因为犯罪被关进了恋爱监狱！',
    action: '立即查看详情'
  },
  
  // 申请出狱
  requestRelease: {
    subject: '🙏 恋爱监狱通知：有人申请出狱',
    title: '出狱申请',
    message: '你的男朋友正在申请出狱，请决定是否同意！',
    action: '处理申请'
  },
  
  // 出狱通知
  released: {
    subject: '🎉 恋爱监狱通知：犯人已被释放',
    title: '出狱通知',
    message: '恭喜！你们和好如初，犯人已经被释放了！',
    action: '查看状态'
  }
};

// 发送监狱相关邮件
export async function sendPrisonEmail(type, additionalData = {}) {
  try {
    const template = PRISON_TEMPLATES[type];
    if (!template) {
      throw new Error(`未知的邮件类型: ${type}`);
    }
    
    const templateParams = {
      subject: template.subject,
      title: template.title,
      message: template.message,
      action: template.action,
      prison_url: `${window.location.origin}/prison.html`,
      admin_url: `${window.location.origin}/prison-admin.html`,
      ...additionalData
    };
    
    // 根据类型添加特定信息
    switch (type) {
      case 'imprisoned':
        templateParams.crime = additionalData.crime || '';
        templateParams.duration = additionalData.duration || '';
        templateParams.message = `你的男朋友因为"${additionalData.crime}"被关进了恋爱监狱！刑期：${additionalData.duration}`;
        break;
        
      case 'requestRelease':
        templateParams.message = '你的男朋友正在恳求你的原谅，申请从恋爱监狱出来！';
        break;
        
      case 'released':
        templateParams.message = '太好了！你们和好如初，你的男朋友已经从恋爱监狱被释放了！';
        break;
    }
    
    const result = await sendEmail(templateParams);
    
    if (result.success) {
      console.log(`${template.title}邮件发送成功`);
    } else {
      console.error(`${template.title}邮件发送失败:`, result.message);
    }
    
    return result;
    
  } catch (error) {
    console.error('发送监狱邮件失败:', error);
    return { success: false, message: error.message };
  }
}

// 测试邮件发送
export async function sendTestEmail() {
  const templateParams = {
    subject: '🧪 恋爱监狱测试邮件',
    title: '测试邮件',
    message: '这是一封测试邮件，用于验证邮件服务是否正常工作。',
    action: '查看网站',
    prison_url: `${window.location.origin}/prison.html`
  };
  
  return await sendEmail(templateParams);
}

// 导出主要函数
export { sendEmail, getEmailSettings, loadEmailJS }; 