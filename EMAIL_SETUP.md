# 📧 恋爱监狱邮件提醒设置指南

为了让恋爱监狱的邮件提醒功能正常工作，你需要配置EmailJS服务。

## 📋 前置条件

1. 一个Gmail或其他邮箱账号（用于发送邮件）
2. EmailJS账号（免费）

## 🚀 配置步骤

### 第1步：注册EmailJS账号

1. 访问 [EmailJS官网](https://www.emailjs.com/)
2. 点击"Sign Up"注册免费账号
3. 验证邮箱并登录

### 第2步：创建邮件服务

1. 在EmailJS仪表板中，点击"Email Services"
2. 点击"Add New Service"
3. 选择你的邮件提供商（推荐Gmail）
4. 按照指示连接你的Gmail账号
5. 记录下生成的"Service ID"（例如：service_xxxxxx）

### 第3步：创建邮件模板

1. 在EmailJS仪表板中，点击"Email Templates"
2. 点击"Create New Template"
3. 复制以下模板内容：

```html
主题: {{subject}}

亲爱的，

{{title}}

{{message}}

详细信息：
- 时间：{{timestamp}}
- 罪名：{{crime}}
- 刑期：{{duration}}

快速操作：
🏰 查看监狱状态：{{prison_url}}
👑 管理中心：{{admin_url}}

---
来自恋爱监狱系统的自动通知
```

4. 在"Settings"中设置：
   - To Email: {{girlfriend_email}}
   - From Name: 恋爱监狱系统
   - Reply To: {{your_email}}

5. 保存模板并记录"Template ID"（例如：template_xxxxxx）

### 第4步：获取Public Key

1. 在EmailJS仪表板中，点击"Account"
2. 找到"Public Key"并复制

### 第5步：更新配置

1. 打开 `scripts/email-service.js` 文件
2. 更新以下配置：

```javascript
const EMAILJS_SERVICE_ID = 'your_service_id_here';
const EMAILJS_TEMPLATE_ID = 'your_template_id_here';  
const EMAILJS_PUBLIC_KEY = 'your_public_key_here';
```

### 第6步：配置网站邮件设置

1. 访问恋爱监狱管理页面 (`prison-admin.html`)
2. 点击"📧 邮件设置"按钮
3. 填写配置：
   - ✅ 启用邮件提醒
   - 输入你的邮箱地址
   - 输入女朋友的邮箱地址
4. 点击"💾 保存设置"
5. 点击"🧪 发送测试邮件"验证配置

## 🔧 故障排除

### 邮件发送失败？

1. **检查EmailJS配置**：确保Service ID、Template ID和Public Key正确
2. **检查邮箱地址**：确保邮箱格式正确且可接收邮件
3. **检查Gmail设置**：确保Gmail账号已正确连接到EmailJS
4. **查看控制台**：打开浏览器开发者工具查看错误信息

### 邮件没有收到？

1. **检查垃圾邮件箱**：新邮件可能被误判为垃圾邮件
2. **确认邮箱地址**：重新检查收件人邮箱地址是否正确
3. **等待时间**：邮件发送可能需要几分钟时间

### 模板变量不显示？

1. **检查模板语法**：确保使用双花括号 `{{variable}}`
2. **检查变量名**：确保模板中的变量名与代码中一致

## 📝 邮件触发场景

恋爱监狱系统会在以下情况自动发送邮件：

1. **🔒 入狱通知**：当你被关进监狱时，你和女朋友都会收到邮件
2. **🙏 申请出狱**：当你申请出狱时，女朋友会收到邮件通知
3. **🎉 出狱通知**：当你被释放时，你和女朋友都会收到邮件

## 💡 小贴士

- EmailJS免费版每月有200封邮件的限制，对于个人使用完全够用
- 建议使用Gmail作为发送邮箱，稳定性更好
- 可以自定义邮件模板的样式和内容
- 邮件设置保存在Firebase中，多设备同步

## 🆘 需要帮助？

如果遇到问题，请：
1. 检查浏览器控制台的错误信息
2. 确认所有配置步骤都已完成
3. 尝试发送测试邮件进行调试

祝你使用愉快！💕 