export interface EmailConfig {
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  fromEmail?: string;
  fromName?: string;
}

export interface VoteReceiptData {
  studentUrn: string;
  votedAt: Date;
  positions: string[];
  receiptId: string;
}

export class EmailService {
  private config: EmailConfig;
  private isEnabled: boolean;

  constructor(config?: EmailConfig) {
    this.config = config || {};
    this.isEnabled = !!(this.config.smtpHost && this.config.smtpUser && this.config.smtpPassword);
    
    if (!this.isEnabled) {
      console.log('[EMAIL] Email service disabled - SMTP configuration not provided');
    }
  }

  async sendVoteConfirmation(studentUrn: string, receiptData: VoteReceiptData): Promise<boolean> {
    if (!this.isEnabled) {
      // Simulate email sending for development
      console.log(`[EMAIL] Would send vote confirmation to student ${studentUrn}:`, receiptData);
      return true;
    }

    try {
      // In a real implementation, you would use a library like nodemailer
      const emailContent = this.generateVoteReceiptEmail(receiptData);
      
      // Simulate sending email
      console.log(`[EMAIL] Sending vote confirmation to ${studentUrn}`);
      console.log('Email content:', emailContent);
      
      return true;
    } catch (error) {
      console.error('[EMAIL] Failed to send vote confirmation:', error);
      return false;
    }
  }

  async sendAdminNotification(action: string, details: any): Promise<boolean> {
    if (!this.isEnabled) {
      console.log(`[EMAIL] Would send admin notification - ${action}:`, details);
      return true;
    }

    try {
      console.log(`[EMAIL] Sending admin notification - ${action}`);
      return true;
    } catch (error) {
      console.error('[EMAIL] Failed to send admin notification:', error);
      return false;
    }
  }

  private generateVoteReceiptEmail(receiptData: VoteReceiptData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>AISA Vote Confirmation</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #3B82F6; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .receipt-info { background-color: white; padding: 15px; border-radius: 5px; margin: 10px 0; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AISA Voting System</h1>
      <h2>Vote Confirmation Receipt</h2>
    </div>
    <div class="content">
      <p>Dear Student (URN: ${receiptData.studentUrn}),</p>
      
      <p>Thank you for participating in the AISA (AI&DS Student Association) elections!</p>
      
      <div class="receipt-info">
        <h3>Vote Details:</h3>
        <p><strong>Receipt ID:</strong> ${receiptData.receiptId}</p>
        <p><strong>Voted At:</strong> ${receiptData.votedAt.toLocaleString()}</p>
        <p><strong>Positions Voted:</strong> ${receiptData.positions.join(', ')}</p>
      </div>
      
      <p>Your vote has been securely recorded and will be counted in the final results.</p>
      
      <p>Please keep this receipt for your records. If you have any questions about the voting process, please contact the AISA election committee.</p>
      
      <p>Thank you for your participation in shaping the future of our AI&DS Student Association!</p>
    </div>
    <div class="footer">
      <p>This is an automated email from the AISA Voting System.</p>
      <p>AI&DS Student Association | Your University</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  generateVoteReceiptId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `AISA-${timestamp}-${random}`.toUpperCase();
  }
}

export const emailService = new EmailService({
  smtpHost: process.env.SMTP_HOST,
  smtpPort: parseInt(process.env.SMTP_PORT || '587'),
  smtpUser: process.env.SMTP_USER,
  smtpPassword: process.env.SMTP_PASSWORD,
  fromEmail: process.env.FROM_EMAIL || 'noreply@aisa-voting.edu',
  fromName: process.env.FROM_NAME || 'AISA Voting System',
});
