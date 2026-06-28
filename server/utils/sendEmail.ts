import { Resend } from 'resend';

let resendInstance: Resend | null = null;

function getResend(): Resend | null {
  if (!resendInstance) {
    const key = process.env.RESEND_API_KEY;
    if (key) {
      resendInstance = new Resend(key);
    }
  }
  return resendInstance;
}

export interface CommentEmailParams {
  authorEmail: string;
  authorName: string;
  commenterName: string;
  commentPreview: string;
  postTitle: string;
  postSlug: string;
}

/**
 * Sends a notification email to the author of a post when someone comments on it.
 * Falls back to console logging if Resend API key is not configured.
 */
export async function sendCommentNotificationEmail(params: CommentEmailParams): Promise<void> {
  const { authorEmail, authorName, commenterName, commentPreview, postTitle, postSlug } = params;
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const postUrl = `${appUrl}/post/${postSlug}`;

  const subject = `New Comment on your post: "${postTitle}"`;
  const textContent = `Hi ${authorName},\n\n${commenterName} just commented on your post "${postTitle}".\n\nComment preview:\n"${commentPreview}"\n\nRead the full comment thread here: ${postUrl}\n\nBest,\nYour Blog Platform Team`;
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
      <h2 style="color: #111111; font-weight: 500;">New Comment Notification</h2>
      <p>Hi <strong>${authorName}</strong>,</p>
      <p><strong>${commenterName}</strong> left a new comment on your post <strong>"${postTitle}"</strong>:</p>
      <blockquote style="margin: 20px 0; padding-left: 15px; border-left: 3px solid #666; font-style: italic; color: #555;">
        "${commentPreview}"
      </blockquote>
      <p style="margin-top: 30px;">
        <a href="${postUrl}" style="background-color: #111111; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 500; display: inline-block;">
          View Comment Thread
        </a>
      </p>
      <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
      <p style="font-size: 12px; color: #888888;">This email was sent automatically by your Blog Platform. Manage your notifications inside your Profile Settings.</p>
    </div>
  `;

  const resend = getResend();

  if (resend) {
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
      await resend.emails.send({
        from: fromEmail,
        to: authorEmail,
        subject: subject,
        text: textContent,
        html: htmlContent,
      });
      console.log(`[Email] Successfully sent notification email to ${authorEmail}`);
    } catch (error) {
      console.error('[Email] Failed to send email via Resend:', error);
    }
  } else {
    console.log('\n--- [EMAIL NOTIFICATION MOCK] ---');
    console.log(`To: ${authorEmail} (${authorName})`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${textContent}`);
    console.log('---------------------------------\n');
  }
}

export async function sendSubscriptionConfirmation(email: string): Promise<void> {
  const subject = `Welcome to our Newsletter!`;
  const textContent = `Thank you for subscribing to our newsletter! We'll keep you updated with the latest news.`;
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
      <h2 style="color: #111111; font-weight: 500;">Welcome!</h2>
      <p>Thank you for subscribing to our newsletter.</p>
      <p>We're excited to have you on board and will keep you updated with the latest news and articles.</p>
    </div>
  `;

  const resend = getResend();
  if (resend) {
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: subject,
        text: textContent,
        html: htmlContent,
      });
      console.log(`[Email] Subscription confirmation sent to ${email}`);
    } catch (error) {
      console.error('[Email] Failed to send subscription confirmation via Resend:', error);
    }
  } else {
    console.log('\n--- [EMAIL MOCK: Subscription] ---');
    console.log(`To: ${email}\nSubject: ${subject}\nBody: ${textContent}`);
    console.log('---------------------------------\n');
  }
}

export async function sendNewsletter(email: string, subject: string, htmlContent: string): Promise<void> {
  const resend = getResend();
  if (resend) {
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: subject,
        html: htmlContent,
      });
      console.log(`[Email] Newsletter sent to ${email}`);
    } catch (error) {
      console.error(`[Email] Failed to send newsletter to ${email} via Resend:`, error);
    }
  } else {
    console.log('\n--- [EMAIL MOCK: Newsletter] ---');
    console.log(`To: ${email}\nSubject: ${subject}`);
    console.log('---------------------------------\n');
  }
}
