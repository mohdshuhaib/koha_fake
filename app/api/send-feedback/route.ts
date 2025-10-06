import { Resend } from 'resend';
import { NextResponse } from 'next/server';

// Initialize Resend with your API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);
const myEmail = 'hafizshuhaibwafy@gmail.com'; 

export async function POST(request: Request) {
  try {
    const { feedback } = await request.json();

    if (!feedback || feedback.trim().length < 10) {
      return NextResponse.json({ error: 'Feedback is too short.' }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: 'PMSA Library Feedback <onboarding@resend.dev>', // Sender address (must be from Resend)
      to: myEmail,
      subject: 'New Library Feedback Received!',
      html: `<p>You have received new feedback from the library website:</p>
             <p style="border-left: 2px solid #ccc; padding-left: 12px; font-style: italic;">
               ${feedback}
             </p>`,
    });

    if (error) {
      return NextResponse.json({ error: 'Failed to send email.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Email sent successfully!' });
  } catch (error) {
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
