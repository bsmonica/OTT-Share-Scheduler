import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "OTT Share Scheduler System"
    VERSION: str = "1.0.0"
    TEAM: str = "B.S. Monica & K. Sashwathi Sri"
    
    def __init__(self):
        # Environment mode
        self.ENVIRONMENT: str = os.getenv("ENVIRONMENT", os.getenv("ENV", "development")).strip().lower()
        self.IS_PRODUCTION: bool = self.ENVIRONMENT in ("production", "prod") or bool(os.getenv("RAILWAY_ENVIRONMENT"))
        
        # Database URL normalization (support Railway MYSQL_URL and mysql:// protocol)
        raw_db_url = os.getenv("DATABASE_URL") or os.getenv("MYSQL_URL") or "mysql+pymysql://root:@localhost:3306/ott_share_scheduler"
        if raw_db_url.startswith("mysql://"):
            raw_db_url = raw_db_url.replace("mysql://", "mysql+pymysql://", 1)
        self.DATABASE_URL: str = raw_db_url

        # Secret key validation: require a custom secure key in production
        secret = os.getenv("SECRET_KEY", "").strip()
        default_dev_secret = "supersecretcollegeschedulertokenkey2026"
        
        if self.IS_PRODUCTION:
            if not secret or secret == default_dev_secret:
                raise ValueError(
                    "Production deployment requires a secure, non-default SECRET_KEY environment variable. "
                    "Please set a strong SECRET_KEY in your production environment settings."
                )
            self.SECRET_KEY: str = secret
        else:
            self.SECRET_KEY: str = secret if secret else default_dev_secret
            
        self.ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
        self.ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
        
        # CORS allowed origins configuration
        raw_origins = os.getenv("ALLOWED_ORIGINS", "").strip()
        local_origins = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8000",
            "http://127.0.0.1:8000",
        ]
        
        if raw_origins == "*":
            self.ALLOWED_ORIGINS: list[str] = ["*"]
        elif raw_origins:
            parsed = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
            for loc in local_origins:
                if loc not in parsed:
                    parsed.append(loc)
            self.ALLOWED_ORIGINS: list[str] = parsed
        else:
            self.ALLOWED_ORIGINS: list[str] = ["*"] if not self.IS_PRODUCTION else local_origins

    @property
    def is_production(self) -> bool:
        return self.IS_PRODUCTION

settings = Settings()
