from src.config.settings import settings

momo_config = {
    "env": settings.MOMO_ENV,
    "partnerCode": settings.MOMO_PARTNER_CODE,
    "accessKey": settings.MOMO_ACCESS_KEY,
    "secretKey": settings.MOMO_SECRET_KEY,
    "endpoint": settings.MOMO_ENDPOINT,
    "queryEndpoint": settings.MOMO_QUERY_ENDPOINT,
    "redirectUrl": settings.MOMO_REDIRECT_URL,
    "ipnUrl": settings.MOMO_IPN_URL or settings.MOMO_NOTIFY_URL,
    "requestType": settings.MOMO_REQUEST_TYPE,
    "clientUrl": settings.CLIENT_URL,
}

def is_momo_mock() -> bool:
    return momo_config["env"] == "mock"
