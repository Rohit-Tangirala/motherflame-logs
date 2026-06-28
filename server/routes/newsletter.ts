import { Router, Request, Response } from 'express';
import { dbService } from '../db.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { sendSubscriptionConfirmation, sendNewsletter } from '../utils/sendEmail.js';

const router = Router();

// Middleware to check if user is admin
const isAdmin = (req: Request, res: Response, next: Function) => {
  const user = (req as any).user;
  const adminEmails = ['admin@rohit.com', '2410030030cse@gmail.com'];
  if (!user || (user.role !== 'admin' && !adminEmails.includes(user.email.toLowerCase()))) {
    return res.status(403).json({ message: 'Forbidden: Admin access required.' });
  }
  next();
};

// POST /api/newsletter/subscribe
router.post('/subscribe', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ message: 'Valid email is required.' });
    }

    const added = await dbService.addSubscriber(email);
    if (!added) {
      return res.status(400).json({ message: 'already subscribed' });
    }

    // Send confirmation email asynchronously
    sendSubscriptionConfirmation(email).catch(console.error);

    return res.status(200).json({ message: 'Successfully subscribed.' });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// GET /api/newsletter/subscribers - Admin only
router.get('/subscribers', verifyToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const count = await dbService.getSubscriberCount();
    return res.status(200).json({ count });
  } catch (error) {
    console.error('Error fetching subscriber count:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /api/newsletter/send - Admin only
router.post('/send', verifyToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const { subject, body } = req.body;
    if (!subject || !body) {
      return res.status(400).json({ message: 'Subject and body are required.' });
    }

    const emails = await dbService.getAllSubscribers();
    console.log(`[Newsletter] Found ${emails.length} subscribers.`);
    if (emails.length === 0) {
      return res.status(200).json({ sent: 0, message: 'No subscribers found.' });
    }

    // Send emails
    let sentCount = 0;
    let failedCount = 0;
    console.log(`[Newsletter] Starting broadcast to ${emails.length} subscribers.`);
    
    for (const email of emails) {
      try {
        console.log(`[Newsletter] Sending to ${email}...`);
        await sendNewsletter(email, subject, body);
        sentCount++;
        console.log(`[Newsletter] Successfully sent to ${email}`);
      } catch (e) {
        failedCount++;
        console.error(`[Newsletter] Failed to send newsletter to ${email}`, e);
      }
    }
    console.log(`[Newsletter] Broadcast finished. Sent: ${sentCount}, Failed: ${failedCount}`);

    return res.status(200).json({ sent: sentCount, message: `Successfully sent ${sentCount} emails, failed ${failedCount}.` });
  } catch (error) {
    console.error('Error sending newsletter:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

export default router;
