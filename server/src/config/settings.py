import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    NODE_ENV: str = "development"
    PORT: int = 5000
    CLIENT_URL: str = "http://localhost:5173"
    MOBILE_CLIENT_URL: str = ""
    
    SUPABASE_URL: str = "http://localhost:54321"
    SUPABASE_SERVICE_ROLE_KEY: str = "development-key"
    
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    
    MOMO_ENV: str = "mock"
    MOMO_PARTNER_CODE: str = ""
    MOMO_ACCESS_KEY: str = ""
    MOMO_SECRET_KEY: str = ""
    MOMO_ENDPOINT: str = "https://test-payment.momo.vn/v2/gateway/api/create"
    MOMO_QUERY_ENDPOINT: str = "https://test-payment.momo.vn/v2/gateway/api/query"
    MOMO_REDIRECT_URL: str = "http://localhost:5000/api/payments/momo/return"
    MOMO_IPN_URL: str = "http://localhost:5000/api/payments/momo/ipn"
    MOMO_NOTIFY_URL: str = "http://localhost:5000/api/payments/momo/ipn"
    MOMO_REQUEST_TYPE: str = "captureWallet"
    
    JWT_SECRET: str = "development_secret"
    
    GEMINI_API_KEY: str = ""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
