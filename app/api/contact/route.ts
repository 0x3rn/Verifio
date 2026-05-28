import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    if (message.length < 10) {
      return NextResponse.json({ error: 'Message must be at least 10 characters.' }, { status: 400 });
    }

    // Check if email credentials are configured
    const emailUser = process.env.CONTACT_EMAIL_USER;
    const emailPass = process.env.CONTACT_EMAIL_PASS;
    const recipientEmail = process.env.CONTACT_EMAIL_TO || process.env.CONTACT_EMAIL_USER;

    if (!emailUser || !emailPass) {
      // Email not configured yet — store or log the message instead
      console.log('[Contact Form Submission]', { name, email, subject, message });
      return NextResponse.json({
        success: true,
        message: 'Your message has been received. We will get back to you soon.',
      });
    }

    // Configure nodemailer transport
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    await transporter.sendMail({
      from: `"Verifio Contact" <${emailUser}>`,
      to: recipientEmail,
      replyTo: email,
      subject: `[Verifio Contact] ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366f1;">New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <hr style="border: 1px solid #e2e8f0;" />
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you soon.',
    });
  } catch (error) {
    console.error('[Contact API Error]', error);
    return NextResponse.json(
      { error: 'Failed to send message. Please try again later.' },
      { status: 500 }
    );
  }
}