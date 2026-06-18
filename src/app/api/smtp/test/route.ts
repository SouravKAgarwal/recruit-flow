import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { server, port, email, password } = await req.json();

    if (!server || !port || !email || !password) {
      return NextResponse.json(
        { error: "Missing SMTP parameters" },
        { status: 400 },
      );
    }

    const transporter = nodemailer.createTransport({
      host: server,
      port: parseInt(port),
      secure: parseInt(port) === 465, // true for port 465, false for 587 / other TLS ports
      auth: {
        user: email,
        pass: password,
      },
      tls: {
        rejectUnauthorized: false, // Avoid connection failures due to self-signed certificates
      },
    });

    // Test handshake and login
    await transporter.verify();

    return NextResponse.json({
      success: true,
      message: "SMTP connection verified successfully.",
    });
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    console.error("SMTP test error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "SMTP connection failed",
    });
  }
}
