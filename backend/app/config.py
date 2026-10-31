import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "OTT Share Scheduler System"
    VERSION: str = "1.0.0"
    TEAM: str = "B.S. Monica & K. Sashwathi Sri"
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "mysql+pymysql://root:@localhost:3306/ott_share_scheduler")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretcollegeschedulertokenkey2026")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

settings = Settings()
