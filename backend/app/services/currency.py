"""
Currency Conversion Service
===========================
Handles fiat-to-stablecoin currency conversions for multi-currency receipt support.

Flow:
1. Employee submits receipt in any fiat currency (EUR, GBP, INR, etc.)
2. AI extracts original currency and amount
3. This service converts to company's base stablecoin (USDC, EURC, etc.)
4. Employee gets paid in company's base currency
"""

import asyncio
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import Any

import httpx
from pydantic import BaseModel

from app.config import settings


class ExchangeRate(BaseModel):
    """Exchange rate data."""
    
    from_currency: str
    to_currency: str
    rate: float
    timestamp: datetime
    source: str = "coingecko"  # or "chainlink", "openexchangerates"


class CurrencyConversionResult(BaseModel):
    """Result of currency conversion."""
    
    original_amount: float
    original_currency: str
    converted_amount: float
    target_currency: str
    exchange_rate: float
    exchange_rate_timestamp: datetime
    
    
# Fiat currency to CoinGecko ID mapping
FIAT_TO_COINGECKO = {
    "USD": "usd",
    "EUR": "eur",
    "GBP": "gbp",
    "INR": "inr",
    "CAD": "cad",
    "AUD": "aud",
    "JPY": "jpy",
    "CHF": "chf",
    "CNY": "cny",
    "KRW": "krw",
    "SGD": "sgd",
    "HKD": "hkd",
    "BRL": "brl",
    "MXN": "mxn",
}

# Stablecoin to fiat peg mapping
STABLECOIN_PEG = {
    "USDC": "USD",
    "USDT": "USD",
    "DAI": "USD",
    "EURC": "EUR",
}

# Cache for exchange rates (to avoid rate limiting)
_rate_cache: dict[str, ExchangeRate] = {}
_cache_ttl = timedelta(minutes=5)


class CurrencyService:
    """Service for handling currency conversions."""
    
    def __init__(self):
        self.base_url = "https://api.coingecko.com/api/v3"
        # For production, use OpenExchangeRates or Chainlink
        self.openexchange_api_key = getattr(settings, 'openexchange_api_key', None)
    
    async def get_exchange_rate(
        self,
        from_currency: str,
        to_currency: str,
    ) -> ExchangeRate:
        """
        Get exchange rate between two fiat currencies.
        
        Args:
            from_currency: Source fiat currency (e.g., "EUR", "GBP")
            to_currency: Target fiat currency (e.g., "USD")
            
        Returns:
            ExchangeRate with current rate and timestamp
        """
        # Normalize currency codes
        from_currency = from_currency.upper()
        to_currency = to_currency.upper()
        
        # Same currency - no conversion needed
        if from_currency == to_currency:
            return ExchangeRate(
                from_currency=from_currency,
                to_currency=to_currency,
                rate=1.0,
                timestamp=datetime.utcnow(),
                source="none",
            )
        
        # Check cache
        cache_key = f"{from_currency}_{to_currency}"
        if cache_key in _rate_cache:
            cached = _rate_cache[cache_key]
            if datetime.utcnow() - cached.timestamp < _cache_ttl:
                return cached
        
        # Fetch fresh rate
        rate = await self._fetch_rate_coingecko(from_currency, to_currency)
        
        result = ExchangeRate(
            from_currency=from_currency,
            to_currency=to_currency,
            rate=rate,
            timestamp=datetime.utcnow(),
            source="coingecko",
        )
        
        # Cache the result
        _rate_cache[cache_key] = result
        
        return result
    
    async def _fetch_rate_coingecko(
        self,
        from_currency: str,
        to_currency: str,
    ) -> float:
        """Fetch exchange rate from CoinGecko (free, no API key needed)."""
        
        from_id = FIAT_TO_COINGECKO.get(from_currency, from_currency.lower())
        to_id = FIAT_TO_COINGECKO.get(to_currency, to_currency.lower())
        
        # CoinGecko uses USD as base, so we need to convert through USD
        async with httpx.AsyncClient() as client:
            # Get both currencies in USD terms
            url = f"{self.base_url}/simple/price"
            
            # For fiat-to-fiat, we use the exchange_rates endpoint
            exchange_url = f"{self.base_url}/exchange_rates"
            
            try:
                response = await client.get(exchange_url, timeout=10.0)
                response.raise_for_status()
                data = response.json()
                
                rates = data.get("rates", {})
                
                # Get rates relative to BTC (CoinGecko's base)
                from_rate = rates.get(from_id.lower(), {}).get("value", 1.0)
                to_rate = rates.get(to_id.lower(), {}).get("value", 1.0)
                
                # Calculate cross rate
                if from_rate and to_rate:
                    return to_rate / from_rate
                    
            except Exception as e:
                # Fallback to hardcoded rates if API fails
                return self._get_fallback_rate(from_currency, to_currency)
        
        return 1.0
    
    def _get_fallback_rate(self, from_currency: str, to_currency: str) -> float:
        """Fallback exchange rates (approximate, update periodically)."""
        
        # Rates relative to USD (approximate as of Jan 2026)
        usd_rates = {
            "USD": 1.0,
            "EUR": 0.92,
            "GBP": 0.79,
            "INR": 83.5,
            "CAD": 1.36,
            "AUD": 1.53,
            "JPY": 148.0,
            "CHF": 0.88,
            "CNY": 7.25,
            "KRW": 1320.0,
            "SGD": 1.34,
            "HKD": 7.82,
            "BRL": 4.95,
            "MXN": 17.2,
        }
        
        from_usd = usd_rates.get(from_currency, 1.0)
        to_usd = usd_rates.get(to_currency, 1.0)
        
        return to_usd / from_usd
    
    async def convert_to_stablecoin(
        self,
        amount: float,
        from_currency: str,
        to_stablecoin: str = "USDC",
    ) -> CurrencyConversionResult:
        """
        Convert a fiat amount to stablecoin equivalent.
        
        Args:
            amount: Original amount in fiat
            from_currency: Original fiat currency (e.g., "EUR")
            to_stablecoin: Target stablecoin (e.g., "USDC", "EURC")
            
        Returns:
            CurrencyConversionResult with converted amount and rate info
            
        Example:
            # Employee submits €50 receipt, company uses USDC
            result = await currency_service.convert_to_stablecoin(50.0, "EUR", "USDC")
            # result.converted_amount = 54.35 (at 1 EUR = 1.087 USD)
        """
        from_currency = from_currency.upper()
        to_stablecoin = to_stablecoin.upper()
        
        # Get the fiat currency the stablecoin is pegged to
        target_fiat = STABLECOIN_PEG.get(to_stablecoin, "USD")
        
        # Get exchange rate
        rate_info = await self.get_exchange_rate(from_currency, target_fiat)
        
        # Calculate converted amount (round to 2 decimal places)
        converted = Decimal(str(amount)) * Decimal(str(rate_info.rate))
        converted_amount = float(converted.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))
        
        return CurrencyConversionResult(
            original_amount=amount,
            original_currency=from_currency,
            converted_amount=converted_amount,
            target_currency=to_stablecoin,
            exchange_rate=rate_info.rate,
            exchange_rate_timestamp=rate_info.timestamp,
        )
    
    def format_currency(
        self,
        amount: float,
        currency: str,
        show_original: bool = False,
        original_amount: float | None = None,
        original_currency: str | None = None,
    ) -> str:
        """
        Format currency amount for display.
        
        Args:
            amount: Amount to format
            currency: Currency code
            show_original: Whether to show original amount
            original_amount: Original amount before conversion
            original_currency: Original currency code
            
        Returns:
            Formatted string like "$54.35 USDC" or "€50.00 → $54.35 USDC"
        """
        symbols = {
            "USDC": "$",
            "USDT": "$",
            "DAI": "$",
            "EURC": "€",
            "USD": "$",
            "EUR": "€",
            "GBP": "£",
            "INR": "₹",
            "JPY": "¥",
            "CNY": "¥",
        }
        
        symbol = symbols.get(currency, "")
        formatted = f"{symbol}{amount:,.2f} {currency}"
        
        if show_original and original_amount and original_currency:
            orig_symbol = symbols.get(original_currency, "")
            formatted = f"{orig_symbol}{original_amount:,.2f} {original_currency} → {formatted}"
        
        return formatted


# Singleton instance
currency_service = CurrencyService()
