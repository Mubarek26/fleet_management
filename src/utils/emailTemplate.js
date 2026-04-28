const getEmailTemplate = (title, content, buttonText, buttonUrl, note) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="width: 100%; background-color: #f1f5f9; padding-bottom: 40px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; margin-top: 40px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 48px 32px; text-align: center;">
            <div style="font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -1px;">
              Cargo<span style="color: #3b82f6;">Dash</span>
            </div>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 32px; color: #334155; line-height: 1.6;">
            <h1 style="font-size: 24px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px;">${title}</h1>
            ${content}
            
            ${buttonText && buttonUrl ? `
            <div style="text-align: center; margin: 32px 0;">
              <a href="${buttonUrl}" style="background-color: #2563eb; color: #ffffff !important; padding: 16px 36px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
                ${buttonText}
              </a>
            </div>
            ` : ''}
            
            ${note ? `
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; font-size: 14px; color: #64748b; border: 1px solid #e2e8f0; margin-bottom: 24px;">
              ${note}
            </div>
            ` : ''}
            
            ${buttonUrl ? `
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0;">
            
            <p style="font-size: 13px; color: #94a3b8; line-height: 1.4;">
              If you're having trouble with the button above, copy and paste the following link into your browser:
              <br>
              <a href="${buttonUrl}" style="color: #3b82f6; text-decoration: none; word-break: break-all;">${buttonUrl}</a>
            </p>
            ` : ''}
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; padding: 32px; font-size: 14px; color: #94a3b8; background-color: #f8fafc;">
            <p style="margin: 0 0 8px 0;">&copy; ${new Date().getFullYear()} CargoDash Logistics. All rights reserved.</p>
            <p style="margin: 0 0 16px 0;">Precision. Efficiency. Logistics.</p>
            <p style="margin: 0;">
              <a href="#" style="color: #3b82f6; text-decoration: none;">Support</a> &bull; 
              <a href="#" style="color: #3b82f6; text-decoration: none;">Privacy Policy</a> &bull; 
              <a href="#" style="color: #3b82f6; text-decoration: none;">Terms of Service</a>
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = getEmailTemplate;
