"""
Email Service - Send transactional emails for 2FA and notifications.

Uses Resend for email delivery (simple, developer-friendly API).
Fallback to console logging in development mode.
"""

import logging
import secrets
from datetime import datetime, timedelta
from typing import Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

# In-memory store for 2FA codes (use Redis in production)
_verification_codes: dict[str, dict] = {}


class EmailError(Exception):
    """Email sending failed."""
    pass


class EmailService:
    """Service for sending transactional emails."""
    
    def __init__(self):
        self.api_key = getattr(settings, 'resend_api_key', None)
        self.from_email = getattr(settings, 'from_email', 'noreply@reimburse.ai')
        self.base_url = "https://api.resend.com"
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
    ) -> bool:
        """
        Send an email via Resend API.
        
        Falls back to console logging if no API key configured.
        """
        if not self.api_key or self.api_key == "your-resend-api-key":
            # Development mode - log to console
            logger.info(f"[DEV EMAIL] To: {to_email}")
            logger.info(f"[DEV EMAIL] Subject: {subject}")
            logger.info(f"[DEV EMAIL] Content: {text_content or html_content}")
            return True
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/emails",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "from": self.from_email,
                        "to": [to_email],
                        "subject": subject,
                        "html": html_content,
                        "text": text_content,
                    },
                    timeout=10.0,
                )
                
                if response.status_code == 200:
                    logger.info(f"Email sent successfully to {to_email}")
                    return True
                else:
                    logger.error(f"Email failed: {response.status_code} - {response.text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Email error: {e}")
            raise EmailError(f"Failed to send email: {str(e)}")
    
    def generate_2fa_code(self) -> str:
        """Generate a 6-digit verification code."""
        return "".join([str(secrets.randbelow(10)) for _ in range(6)])
    
    async def send_2fa_code(
        self,
        to_email: str,
        code: str,
        employee_name: Optional[str] = None,
    ) -> bool:
        """
        Send 2FA verification code to employee email.
        """
        name = employee_name or "there"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0f1e; color: #fff; padding: 40px; }}
                .container {{ max-width: 480px; margin: 0 auto; background: linear-gradient(135deg, #0d1529 0%, #1a2744 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1); }}
                .logo {{ font-size: 24px; font-weight: bold; color: #22d3ee; margin-bottom: 30px; }}
                .code {{ font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #22d3ee; background: rgba(34,211,238,0.1); padding: 20px 30px; border-radius: 12px; text-align: center; margin: 30px 0; }}
                .message {{ color: rgba(255,255,255,0.7); line-height: 1.6; }}
                .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.4); font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">Reimburse AI</div>
                <p class="message">Hi {name},</p>
                <p class="message">Your verification code is:</p>
                <div class="code">{code}</div>
                <p class="message">This code expires in <strong>5 minutes</strong>.</p>
                <p class="message">If you didn't request this code, please ignore this email or contact support if you have concerns.</p>
                <div class="footer">
                    <p>This is an automated message from Reimburse AI.</p>
                    <p>© 2026 Reimburse AI. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Hi {name},
        
        Your Reimburse AI verification code is: {code}
        
        This code expires in 5 minutes.
        
        If you didn't request this code, please ignore this email.
        
        - Reimburse AI Team
        """
        
        return await self.send_email(
            to_email=to_email,
            subject=f"Your Reimburse AI verification code: {code}",
            html_content=html_content,
            text_content=text_content,
        )
    
    async def store_verification_code(
        self,
        wallet_address: str,
        email: str,
        code: str,
        expires_minutes: int = 5,
    ) -> None:
        """
        Store a verification code for later validation.
        
        In production, use Redis with TTL instead of in-memory dict.
        """
        key = wallet_address.lower()
        _verification_codes[key] = {
            "code": code,
            "email": email,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(minutes=expires_minutes),
            "attempts": 0,
        }
        logger.info(f"Stored 2FA code for wallet {wallet_address[:10]}...")
    
    async def verify_code(
        self,
        wallet_address: str,
        code: str,
        max_attempts: int = 5,
    ) -> tuple[bool, str]:
        """
        Verify a 2FA code.
        
        Returns:
            (success, message)
        """
        key = wallet_address.lower()
        stored = _verification_codes.get(key)
        
        if not stored:
            return False, "No verification code found. Please request a new code."
        
        # Check expiration
        if datetime.utcnow() > stored["expires_at"]:
            del _verification_codes[key]
            return False, "Code expired. Please request a new code."
        
        # Check attempts
        if stored["attempts"] >= max_attempts:
            del _verification_codes[key]
            return False, "Too many failed attempts. Please request a new code."
        
        # Verify code
        if stored["code"] != code:
            stored["attempts"] += 1
            remaining = max_attempts - stored["attempts"]
            return False, f"Invalid code. {remaining} attempts remaining."
        
        # Success - remove code
        del _verification_codes[key]
        return True, "Verification successful"
    
    async def has_pending_code(self, wallet_address: str) -> bool:
        """Check if there's a valid pending code for this wallet."""
        key = wallet_address.lower()
        stored = _verification_codes.get(key)
        
        if not stored:
            return False
        
        if datetime.utcnow() > stored["expires_at"]:
            del _verification_codes[key]
            return False
        
        return True


# Singleton instance
email_service = EmailService()
