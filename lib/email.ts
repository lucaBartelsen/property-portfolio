// lib/email.ts
import AWS from 'aws-sdk';

// Configure AWS SES
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'eu-central-1' // Default to Frankfurt
});

const ses = new AWS.SES({ apiVersion: '2010-12-01' });

type EmailParams = {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
};

/**
 * Send an email using Amazon SES
 */
export async function sendEmail({ to, subject, text, html }: EmailParams): Promise<boolean> {
  try {
    const params = {
      Source: process.env.EMAIL_FROM || 'info@immolytix.de',
      Destination: {
        ToAddresses: Array.isArray(to) ? to : [to]
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8'
        },
        Body: {
          Text: {
            Data: text,
            Charset: 'UTF-8'
          },
          Html: {
            Data: html,
            Charset: 'UTF-8'
          }
        }
      }
    };

    await ses.sendEmail(params).promise();
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send a password initialization email to a new user
 */
export async function sendPasswordInitEmail(
  to: string, 
  name: string, 
  token: string
): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://immolytix.de';
  const resetUrl = `${baseUrl}/set-password?token=${token}`;
  
  const subject = 'Willkommen beim Immobiliensteuerrechner - Passwort einrichten';
  
  const text = `
  Hallo ${name},

  Sie wurden als Benutzer im Immobiliensteuerrechner registriert.
  
  Bitte klicken Sie auf den folgenden Link, um Ihr Passwort einzurichten:
  ${resetUrl}
  
  Der Link ist 24 Stunden gültig.
  
  Freundliche Grüße,
  Ihr Immobiliensteuerrechner-Team
  `;
  
  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Willkommen beim Immobiliensteuerrechner</h2>
    <p>Hallo ${name},</p>
    <p>Sie wurden als Benutzer im Immobiliensteuerrechner registriert.</p>
    <p>Bitte klicken Sie auf den folgenden Button, um Ihr Passwort einzurichten:</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="background-color: #4A7AFF; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
        Passwort einrichten
      </a>
    </p>
    <p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p><em>Der Link ist 24 Stunden gültig.</em></p>
    <p>Freundliche Grüße,<br>Ihr Immobiliensteuerrechner-Team</p>
  </div>
  `;
  
  return sendEmail({ to, subject, text, html });
}

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(
  to: string, 
  name: string, 
  token: string
): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://immolytix.de';
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  
  const subject = 'Immobiliensteuerrechner - Passwort zurücksetzen';
  
  const text = `
  Hallo ${name},

  Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.
  
  Bitte klicken Sie auf den folgenden Link, um Ihr Passwort zurückzusetzen:
  ${resetUrl}
  
  Der Link ist 24 Stunden gültig.
  
  Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.
  
  Freundliche Grüße,
  Ihr Immobiliensteuerrechner-Team
  `;
  
  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Passwort zurücksetzen</h2>
    <p>Hallo ${name},</p>
    <p>Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.</p>
    <p>Bitte klicken Sie auf den folgenden Button, um Ihr Passwort zurückzusetzen:</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="background-color: #4A7AFF; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
        Passwort zurücksetzen
      </a>
    </p>
    <p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p><em>Der Link ist 24 Stunden gültig.</em></p>
    <p>Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.</p>
    <p>Freundliche Grüße,<br>Ihr Immobiliensteuerrechner-Team</p>
  </div>
  `;
  
  return sendEmail({ to, subject, text, html });
}