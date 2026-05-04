import nodemailer from "nodemailer";
import { SocksClient } from "socks";
import tls from "tls";

// 创建 QQ 邮箱 SMTP 传输器（通过 SOCKS5 代理）
const createTransporter = async () => {
  const cleanEnv = (key) => {
    const val = process.env[key];
    delete process.env[key];
    return val;
  };

  cleanEnv("HTTP_PROXY");
  cleanEnv("HTTPS_PROXY");
  cleanEnv("http_proxy");
  cleanEnv("https_proxy");
  cleanEnv("ALL_PROXY");
  cleanEnv("all_proxy");

  const proxyHost = process.env.QQ_SMTP_PROXY_HOST || "127.0.0.1";
  const proxyPort = parseInt(process.env.QQ_SMTP_PROXY_PORT || "7897", 10);
  const smtpHost = process.env.QQ_SMTP_HOST || "smtp.qq.com";
  const smtpPort = parseInt(process.env.QQ_SMTP_PORT || "587", 10);
  const isSSL = smtpPort === 465;

  // 通过 SOCKS5 代理建立到 SMTP 服务器的连接
  const { socket: socksSocket } = await SocksClient.createConnection({
    proxy: { host: proxyHost, port: proxyPort, type: 5 },
    destination: { host: smtpHost, port: smtpPort },
    command: "connect",
  });

  let secureSocket;
  if (isSSL) {
    secureSocket = tls.connect({
      socket: socksSocket,
      host: smtpHost,
      port: smtpPort,
      rejectUnauthorized: true,
    });
    await new Promise((resolve, reject) => {
      secureSocket.on("secure", resolve);
      secureSocket.on("error", reject);
      setTimeout(() => reject(new Error("TLS handshake timeout")), 15000);
    });
  } else {
    // 587 STARTTLS：nodemailer 会自己处理 TLS 升级，不需要提前 TLS 握手
    secureSocket = socksSocket;
  }

  // 创建 nodemailer 传输器，绑定已建立的 socket
  return nodemailer.createTransport({
    streamTransport: true,
    socket: secureSocket,
    connectionTimeout: 15000,
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

    console.log(`[Email] 尝试发送邮件到 ${candidateEmail}`);
    console.log(`[Email] SMTP 配置: host=${process.env.QQ_SMTP_HOST}, port=${process.env.QQ_SMTP_PORT}, secure=${parseInt(process.env.QQ_SMTP_PORT || "587") === 465}`);
    console.log(`[Email] 代理配置: SOCKS5 ${process.env.QQ_SMTP_PROXY_HOST || "127.0.0.1"}:${process.env.QQ_SMTP_PROXY_PORT || "7897"}`);

    const mailOptions = {
      from: process.env.QQ_SMTP_USER,
      to: candidateEmail,
      subject: `${companyName} 面试通知`,
      text: `您好 ${candidateName || ""}，${companyName} 邀请您参加 ${jobTitle} 职位面试，请登录平台查看详情。`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] 邮件发送成功 to ${candidateEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Email] 邮件发送失败 to ${candidateEmail}:`, err.message);
    return { success: false, error: err.message };
  }
};

export default {
  sendInterviewApprovalEmail,
};