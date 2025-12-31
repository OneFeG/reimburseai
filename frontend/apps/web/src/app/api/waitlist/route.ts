import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, reason } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // In production, you would:
    // 1. Store in database
    // 2. Send notification email to contact@reimburseai.app
    // 3. Send confirmation email to the user
    
    // For now, log the submission
    console.log("Waitlist submission:", {
      email,
      reason: reason || "Not provided",
      timestamp: new Date().toISOString(),
    });

    // TODO: Implement actual email sending with services like:
    // - SendGrid
    // - Resend
    // - AWS SES
    // - Postmark
    
    // Example with Resend (when API key is configured):
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: "noreply@reimburseai.app",
    //   to: "contact@reimburseai.app",
    //   subject: "New Waitlist Signup",
    //   html: `<p>Email: ${email}</p><p>Reason: ${reason || "Not provided"}</p>`,
    // });

    return NextResponse.json(
      { 
        success: true, 
        message: "Successfully joined the waitlist" 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Waitlist error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
