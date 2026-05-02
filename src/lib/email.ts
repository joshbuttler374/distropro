import { Resend } from "resend";

export async function sendOtpEmail(to: string, code: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[DEV] OTP for ${to}: ${code}`);
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: "DistroPro <noreply@distropro.com>",
    to,
    subject: `Your verification code: ${code}`,
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:24px">
        <h2>DistroPro Verification</h2>
        <p>Your 6-digit code:</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:16px;background:#f4f4f5;border-radius:8px">${code}</p>
        <p style="color:#71717a;font-size:14px">This code expires in 10 minutes.</p>
      </div>
    `,
  });
}

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
