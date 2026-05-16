import nodemailer from "nodemailer";
import dns from "dns/promises";
import logger from "./logger.js";

// SMTP 连接配置
const SMTP_CONFIG = {
  host: process.env.QQ_SMTP_HOST || "smtp.qq.com",
  port: parseInt(process.env.QQ_SMTP_PORT || "465", 10),
  user: process.env.QQ_SMTP_USER,
  pass: process.env.QQ_SMTP_PASS,
};

/**
 * 手动解析 SMTP 主机的真实 IP，绕过本地代理 DNS 劫持
 * @returns {Promise<string>} 解析到的 IPv4 地址
 */
async function resolveSmtpHost() {
  try {
    const { address } = await dns.lookup(SMTP_CONFIG.host, { family: 4 });
    logger.info({ host: SMTP_CONFIG.host, resolvedIp: address }, "SMTP DNS resolved");
    return address;
  } catch {
    logger.warn("SMTP DNS resolution failed, using original host");
    return SMTP_CONFIG.host;
  }
}

/**
 * 创建邮件传输器（DNS 直连，绕过代理劫持）
 */
const createTransporter = async () => {
  const host = await resolveSmtpHost();

  return nodemailer.createTransport({
    host,
    port: SMTP_CONFIG.port,
    secure: SMTP_CONFIG.port === 465,
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 20000,
    tls: {
      servername: SMTP_CONFIG.host,
      rejectUnauthorized: true,
    },
    auth: {
      user: SMTP_CONFIG.user,
      pass: SMTP_CONFIG.pass,
    },
  });
};

/**
 * 发送面试批准邮件
 * @param {string} candidateEmail - 申请者邮箱
 * @param {string} candidateName - 申请者姓名
 * @param {string} companyName - 公司名称
 * @param {string} jobTitle - 职位名称
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export const sendInterviewApprovalEmail = async (
  candidateEmail,
  candidateName,
  companyName,
  jobTitle
) => {
  try {
    const transporter = await createTransporter();

    logger.info({ to: candidateEmail, host: SMTP_CONFIG.host }, "Attempting to send email");

    const mailOptions = {
      from: `"IntelliHire" <${SMTP_CONFIG.user}>`,
      to: candidateEmail,
      subject: `${companyName} 面试通知`,
      text: `您好 ${candidateName || ""}，${companyName} 邀请您参加 ${jobTitle} 职位面试，请登录平台查看详情。`,
      html: `
        <div style="padding: 24px; font-family: sans-serif; color: #333;">
          <h2 style="color: #1a73e8;">${companyName} 面试通知</h2>
          <p>您好 <strong>${candidateName || ""}</strong>，</p>
          <p><strong>${companyName}</strong> 邀请您参加 <strong>${jobTitle}</strong> 职位的面试。</p>
          <p>请登录 IntelliHire 平台查看详细信息并做好准备。</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
          <p style="color: #999; font-size: 12px;">此邮件由 IntelliHire 系统自动发送，请勿直接回复。</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info({ to: candidateEmail, messageId: info.messageId }, "Email sent successfully");
    return { success: true, messageId: info.messageId };
  } catch (err) {
    logger.error({ to: candidateEmail, err: err.message }, "Email send failed");
    return { success: false, error: err.message };
  }
};
