"""
AI Auditor Service for receipt validation using GPT-4o vision.

Handles AI-powered receipt analysis and policy compliance checking.
"""

import base64
import json
import logging
from datetime import datetime
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class AuditError(Exception):
    """Custom exception for audit operations."""

    pass


class AuditService:
    """
    Service for AI-powered receipt auditing using GPT-4o vision.

    Analyzes receipt images and validates them against company expense policies.
    """

    def __init__(self):
        self.openai_api_key = settings.openai_api_key
        self.model = "gpt-4o"

    async def analyze_receipt(
        self,
        image_data: bytes | str,
        image_content_type: str = "image/jpeg",
        policy: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        Analyze a receipt image using GPT-4o vision.

        Args:
            image_data: Raw image bytes or base64-encoded string
            image_content_type: MIME type of the image
            policy: Company expense policy to validate against

        Returns:
            Dict with extracted data and validation result

        Raises:
            AuditError: If analysis fails
        """
        # Convert image to base64 if necessary
        if isinstance(image_data, bytes):
            image_b64 = base64.standard_b64encode(image_data).decode("utf-8")
        else:
            image_b64 = image_data

        # Build policy context for the prompt
        policy_context = self._build_policy_context(policy)
        
        # Include current date so GPT-4o can properly validate receipt dates
        current_date = datetime.utcnow().strftime("%Y-%m-%d")

        system_prompt = f"""You are an expert expense receipt auditor for a corporate expense reimbursement system.
Today's date is {current_date}.

Analyze the provided receipt image and extract the following information:
1. Vendor/merchant name
2. Total amount (in USD)
3. Date of transaction
4. Category (one of: travel, food, supplies, entertainment, utilities, other)
5. Line items if visible

Then validate the receipt against the company expense policy:
{policy_context}

Respond with a JSON object containing:
{{
    "extracted": {{
        "vendor": "string",
        "amount_usd": number,
        "date": "YYYY-MM-DD",
        "category": "string",
        "line_items": [{{ "description": "string", "amount": number }}],
        "currency": "string",
        "payment_method": "string or null"
    }},
    "validation": {{
        "is_valid": boolean,
        "decision_reason": "string explaining the decision",
        "policy_violations": ["list of specific violations if any"]
    }},
    "confidence": number between 0 and 1
}}

Be strict but fair. Reject receipts that clearly violate policy. If the image is unclear or not a valid receipt, set is_valid to false with an appropriate reason."""

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.openai_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {
                                "role": "user",
                                "content": [
                                    {
                                        "type": "image_url",
                                        "image_url": {
                                            "url": f"data:{image_content_type};base64,{image_b64}",
                                            "detail": "high",
                                        },
                                    },
                                    {
                                        "type": "text",
                                        "text": "Please analyze this receipt and provide the structured JSON response.",
                                    },
                                ],
                            },
                        ],
                        "max_tokens": 1000,
                        "temperature": 0.1,  # Low temperature for consistent extraction
                        "response_format": {"type": "json_object"},
                    },
                    timeout=60.0,
                )

                if response.status_code != 200:
                    error_data = response.json() if response.content else {}
                    raise AuditError(
                        f"OpenAI API error: {error_data.get('error', {}).get('message', 'Unknown error')}"
                    )

                result = response.json()
                content = result["choices"][0]["message"]["content"]

                # Parse the JSON response
                audit_result = json.loads(content)

                # Add metadata
                audit_result["audited_at"] = datetime.utcnow().isoformat()
                audit_result["model"] = self.model
                audit_result["tokens_used"] = result.get("usage", {}).get("total_tokens", 0)

                logger.info(
                    f"Receipt audit completed: valid={audit_result['validation']['is_valid']}, "
                    f"amount=${audit_result['extracted'].get('amount_usd', 0)}"
                )

                return audit_result

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse audit response: {e}")
            raise AuditError(f"Failed to parse audit response: {str(e)}")
        except httpx.RequestError as e:
            logger.error(f"OpenAI API request failed: {e}")
            raise AuditError(f"Audit request failed: {str(e)}")

    def _build_policy_context(self, policy: dict[str, Any] | None) -> str:
        """Build policy context string for the prompt."""
        if not policy:
            return """Default policy:
- Maximum amount: $100 per receipt
- Allowed categories: travel, food, supplies
- Receipts must be less than 365 days old"""

        lines = []

        if "amount_cap_usd" in policy:
            lines.append(f"- Maximum amount: ${policy['amount_cap_usd']} per receipt")

        if "allowed_categories" in policy:
            cats = ", ".join(policy["allowed_categories"])
            lines.append(f"- Allowed categories: {cats}")

        if "vendor_whitelist" in policy and policy["vendor_whitelist"]:
            vendors = ", ".join(policy["vendor_whitelist"])
            lines.append(f"- Approved vendors only: {vendors}")

        if "max_days_old" in policy:
            lines.append(f"- Receipts must be less than {policy['max_days_old']} days old")

        if "require_itemization" in policy and policy["require_itemization"]:
            lines.append("- Itemized receipts required")

        if "daily_limit_usd" in policy:
            lines.append(f"- Daily spending limit: ${policy['daily_limit_usd']}")

        return "\n".join(lines) if lines else "No specific policy restrictions."

    async def validate_against_policy(
        self,
        extracted_data: dict[str, Any],
        policy: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Validate extracted receipt data against a policy (without AI).

        This is a fallback/secondary validation that runs rules directly
        without calling the AI model.

        Args:
            extracted_data: Data extracted from receipt
            policy: Company expense policy

        Returns:
            Dict with validation result
        """
        violations = []

        amount = extracted_data.get("amount_usd", 0)
        category = extracted_data.get("category", "other")
        vendor = extracted_data.get("vendor", "")
        date_str = extracted_data.get("date", "")

        # Check amount cap
        if "amount_cap_usd" in policy and amount > policy["amount_cap_usd"]:
            violations.append(f"Amount ${amount} exceeds maximum ${policy['amount_cap_usd']}")

        # Check category
        if "allowed_categories" in policy:
            if category.lower() not in [c.lower() for c in policy["allowed_categories"]]:
                violations.append(
                    f"Category '{category}' not in allowed categories: {policy['allowed_categories']}"
                )

        # Check vendor whitelist
        if policy.get("vendor_whitelist"):
            vendor_lower = vendor.lower()
            whitelist_lower = [v.lower() for v in policy["vendor_whitelist"]]
            if not any(v in vendor_lower for v in whitelist_lower):
                violations.append(f"Vendor '{vendor}' not in approved vendor list")

        # Check date
        if date_str and "max_days_old" in policy:
            try:
                receipt_date = datetime.strptime(date_str, "%Y-%m-%d")
                days_old = (datetime.utcnow() - receipt_date).days
                if days_old > policy["max_days_old"]:
                    violations.append(
                        f"Receipt is {days_old} days old, exceeds maximum {policy['max_days_old']} days"
                    )
            except ValueError:
                pass  # Invalid date format, skip check

        return {
            "is_valid": len(violations) == 0,
            "policy_violations": violations,
            "decision_reason": (
                "Receipt meets all policy requirements"
                if not violations
                else f"Policy violations: {'; '.join(violations)}"
            ),
        }


# Singleton instance
audit_service = AuditService()
