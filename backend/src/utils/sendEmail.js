import nodemailer from 'nodemailer';

const getTransporter = () => {
  const smtpReady =
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.EMAIL_FROM;

  if (!smtpReady) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

const generateHtmlTemplate = ({ title, heading, body, details = [] }) => {
  const detailsHtml = details.length > 0
    ? `<div style="margin-top: 24px; padding: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;">
        <table style="width: 100%; border-collapse: collapse; font-family: sans-serif;">
          <tbody>
            ${details.map(item => `
              <tr>
                <td style="padding: 8px 0; font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; width: 140px; vertical-align: top;">${item.label}</td>
                <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #0f172a; vertical-align: top;">${item.value}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
       </div>`
    : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table style="width: 100%; border-collapse: collapse; background-color: #f1f5f9; padding: 20px 0;">
          <tbody>
            <tr>
              <td align="center" style="padding: 24px 0;">
                <table style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);">
                  <tbody>
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px; text-transform: uppercase;">MERN CRM</h1>
                        <p style="margin: 4px 0 0 0; font-size: 13px; font-weight: 600; color: #c7d2fe; letter-spacing: 0.5px;">Sales Workspace & Pipeline Tracker</p>
                      </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 32px; background-color: #ffffff;">
                        <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #0f172a;">${heading}</h2>
                        <div style="font-size: 15px; line-height: 24px; color: #334155;">
                          ${body}
                        </div>
                        ${detailsHtml}
                      </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f8fafc; padding: 24px; border-top: 1px solid #e2e8f0; text-align: center;">
                        <p style="margin: 0; font-size: 12px; font-weight: 600; color: #64748b;">MERN CRM Team &bull; Track, qualify, and convert leads</p>
                        <p style="margin: 6px 0 0 0; font-size: 11px; color: #94a3b8;">This is an automated system notification.</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  `;
};

export const sendLeadAssignedEmail = async ({ to, agentName, leadName, leadEmail, leadPhone, source, notes }) => {
  const transporter = getTransporter();
  if (!transporter) return;

  try {
    const html = generateHtmlTemplate({
      title: 'New Lead Assigned - MERN CRM',
      heading: 'Lead Assignment Notification',
      body: `<p>Hi ${agentName},</p><p>A new lead has been assigned to your sales pipeline. Please review the details below and initiate contact within 24 hours.</p>`,
      details: [
        { label: 'Lead Name', value: leadName },
        { label: 'Email', value: leadEmail || 'Not provided' },
        { label: 'Phone', value: leadPhone || 'Not provided' },
        { label: 'Source', value: source || 'Website' },
        { label: 'Notes', value: notes || 'No conversation notes entered.' }
      ]
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: `[New Lead Assigned] ${leadName}`,
      html
    });
  } catch (error) {
    console.error(`Failed to send assignment email: ${error.message}`);
  }
};

export const sendWelcomeEmail = async ({ to, userName, role }) => {
  const transporter = getTransporter();
  if (!transporter) return;

  const roleName = role === 'admin' ? 'Administrator' : 'Sales Agent';

  try {
    const html = generateHtmlTemplate({
      title: 'Welcome to MERN CRM',
      heading: `Welcome to the Team, ${userName}!`,
      body: `<p>Hi ${userName},</p><p>Your MERN CRM workspace account has been successfully created. You can now log in using your registered credentials to start tracking leads and managing your sales activity.</p>`,
      details: [
        { label: 'Username', value: userName },
        { label: 'Email Address', value: to },
        { label: 'System Role', value: roleName }
      ]
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: `Welcome to MERN CRM, ${userName}!`,
      html
    });
  } catch (error) {
    console.error(`Failed to send welcome email: ${error.message}`);
  }
};

export const sendLeadCreatedEmail = async ({ to, leadName, source }) => {
  const transporter = getTransporter();
  if (!transporter) return;

  try {
    const html = generateHtmlTemplate({
      title: 'Inquiry Received - MERN CRM',
      heading: 'Thank you for getting in touch!',
      body: `<p>Hi ${leadName},</p><p>We have successfully received your inquiry through our platform. One of our dedicated sales representatives is currently reviewing your details and will reach out to you shortly to discuss next steps.</p>`,
      details: [
        { label: 'Lead Name', value: leadName },
        { label: 'Inquiry Route', value: source || 'Website Registration' }
      ]
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: `We have received your inquiry, ${leadName}!`,
      html
    });
  } catch (error) {
    console.error(`Failed to send lead creation email: ${error.message}`);
  }
};

export const sendLeadDeletedEmail = async ({ to, agentName, leadName }) => {
  const transporter = getTransporter();
  if (!transporter) return;

  try {
    const html = generateHtmlTemplate({
      title: 'Lead Removed - MERN CRM',
      heading: 'Lead Deletion Alert',
      body: `<p>Hi ${agentName},</p><p>This is to notify you that the lead "<strong>${leadName}</strong>" has been deleted or archived by an administrator and has been removed from your active sales pipeline.</p>`,
      details: [
        { label: 'Lead Name', value: leadName },
        { label: 'Pipeline State', value: 'Deleted / Archived' }
      ]
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: `[Pipeline Alert] Lead removed: ${leadName}`,
      html
    });
  } catch (error) {
    console.error(`Failed to send lead deletion email: ${error.message}`);
  }
};

export const sendLeadStatusUpdatedEmail = async ({ leadEmail, leadName, agentEmail, agentName, oldStatus, newStatus }) => {
  const transporter = getTransporter();
  if (!transporter) return;

  const statusColors = {
    new: '#3b82f6',
    contacted: '#f59e0b',
    converted: '#10b981',
    lost: '#ef4444'
  };

  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  // Email to Lead
  try {
    const leadHtml = generateHtmlTemplate({
      title: 'Lead Status Updated - MERN CRM',
      heading: 'Inquiry Status Update',
      body: `<p>Hi ${leadName},</p><p>We wanted to let you know that the status of your inquiry in our system has been updated. Our sales team is actively working on your request.</p>`,
      details: [
        { label: 'Lead Name', value: leadName },
        { label: 'Inquiry Status', value: `<span style="color: ${statusColors[newStatus] || '#0f172a'}">${capitalize(newStatus)}</span>` }
      ]
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: leadEmail,
      subject: `Update on your inquiry status: ${capitalize(newStatus)}`,
      html: leadHtml
    });
  } catch (error) {
    console.error(`Failed to send status update email to lead: ${error.message}`);
  }

  // Email to Agent
  try {
    const agentHtml = generateHtmlTemplate({
      title: 'Lead Status Changed - MERN CRM',
      heading: 'Pipeline Update',
      body: `<p>Hi ${agentName},</p><p>The status of a lead assigned to you has been changed from <strong>${capitalize(oldStatus)}</strong> to <strong>${capitalize(newStatus)}</strong>.</p>`,
      details: [
        { label: 'Lead Name', value: leadName },
        { label: 'Previous Status', value: capitalize(oldStatus) },
        { label: 'New Status', value: `<span style="color: ${statusColors[newStatus] || '#0f172a'}">${capitalize(newStatus)}</span>` }
      ]
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: agentEmail,
      subject: `[Pipeline Update] Status changed for ${leadName}`,
      html: agentHtml
    });
  } catch (error) {
    console.error(`Failed to send status update email to agent: ${error.message}`);
  }
};
