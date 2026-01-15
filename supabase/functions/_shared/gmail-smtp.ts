/**
 * Gmail SMTP Email Utility
 * Uses Gmail SMTP via Google Workspace for transactional emails
 * 
 * Required secrets:
 * - GMAIL_SMTP_USER: Google Workspace email (e.g., no-reply@presaleproperties.com)
 * - GMAIL_SMTP_PASSWORD: Google App Password (NOT Gmail login password)
 */

import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  fromName?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

const DEFAULT_FROM_NAME = "Presale Properties";
const DEFAULT_REPLY_TO = "info@presaleproperties.com";

/**
 * Send an email using Gmail SMTP
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const smtpUser = Deno.env.get("GMAIL_SMTP_USER");
  const smtpPassword = Deno.env.get("GMAIL_SMTP_PASSWORD");

  if (!smtpUser || !smtpPassword) {
    console.error("Gmail SMTP credentials not configured");
    return {
      success: false,
      error: "Email service not configured. Missing GMAIL_SMTP_USER or GMAIL_SMTP_PASSWORD.",
    };
  }

  // Use port 465 with direct TLS (SSL) instead of STARTTLS on 587
  const client = new SMTPClient({
    connection: {
      hostname: "smtp.gmail.com",
      port: 465,
      tls: true,
      auth: {
        username: smtpUser,
        password: smtpPassword,
      },
    },
  });

  try {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    
    console.log(`Sending email to ${recipients.join(", ")} via Gmail SMTP (port 465)`);
    
    const senderName = options.fromName || DEFAULT_FROM_NAME;
    
    await client.send({
      from: `${senderName} <${smtpUser}>`,
      to: recipients,
      subject: options.subject,
      content: options.html,
      html: options.html,
      replyTo: options.replyTo || DEFAULT_REPLY_TO,
    });
    
    await client.close();

    console.log(`Email sent successfully to ${recipients.join(", ")}`);
    
    return {
      success: true,
      messageId: `gmail-${Date.now()}`,
    };
  } catch (error: unknown) {
    console.error("Gmail SMTP error:", error);
    try {
      await client.close();
    } catch {
      // Ignore close errors
    }
    
    const errorMessage = error instanceof Error ? error.message : "Failed to send email";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get the configured sender email
 */
export function getSenderEmail(): string {
  return Deno.env.get("GMAIL_SMTP_USER") || "no-reply@presaleproperties.com";
}
