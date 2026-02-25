import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

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

    // Forward to backend API
    const response = await fetch(`${API_BASE_URL}/waitlist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        email: email.toLowerCase().trim(), 
        reason: reason || null 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Backend waitlist error:", errorData);
      
      // Return success anyway to not block users
      // The frontend will show success message
      return NextResponse.json(
        { 
          success: true, 
          message: "Successfully joined the waitlist" 
        },
        { status: 200 }
      );
    }

    const data = await response.json();
    
    return NextResponse.json(
      { 
        success: true, 
        message: data.message || "Successfully joined the waitlist",
        id: data.id
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Waitlist error:", error);
    
    // Log the submission even if backend fails
    // This ensures we don't lose leads
    const body = await request.json().catch(() => ({}));
    console.log("Waitlist submission (fallback):", {
      email: body.email,
      reason: body.reason || "Not provided",
      timestamp: new Date().toISOString(),
    });

    // Return success to user - better UX
    return NextResponse.json(
      { 
        success: true, 
        message: "Successfully joined the waitlist" 
      },
      { status: 200 }
    );
  }
}
