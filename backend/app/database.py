import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

logger = logging.getLogger(__name__)

# Base declarative class for SQLAlchemy models
Base = declarative_base()

def get_engine():
    db_url = settings.DATABASE_URL
    # Normalize Railway MySQL URLs (mysql:// -> mysql+pymysql://)
    if db_url.startswith("mysql://"):
        db_url = db_url.replace("mysql://", "mysql+pymysql://", 1)

    # In production, require MySQL URL scheme
    if settings.is_production and not (db_url.startswith("mysql+") or db_url.startswith("mysql:")):
        raise RuntimeError(
            f"Production environment requires a MySQL DATABASE_URL (mysql+pymysql://...). "
            f"Configured URL scheme: {db_url.split('://')[0] if '://' in db_url else db_url}"
        )

    try:
        if db_url.startswith("mysql"):
            timeout = 10 if settings.is_production else 3
            engine = create_engine(
                db_url,
                pool_pre_ping=True,
                pool_recycle=3600,
                connect_args={"connect_timeout": timeout}
            )
            # Verify connectivity with an active connection probe
            with engine.connect() as conn:
                pass
            print(f"[DATABASE] Connected successfully to MySQL: {db_url.split('@')[-1]}")
            return engine
        else:
            return create_engine(db_url)
    except Exception as e:
        if settings.is_production:
            logger.critical(f"[DATABASE FATAL] Production MySQL connection failed: {e}")
            raise RuntimeError(
                f"Failed to connect to production MySQL database: {e}. "
                "Silent fallback to SQLite is strictly disabled in production to protect data integrity. "
                "Please verify that DATABASE_URL / MYSQL_URL is correctly set and the MySQL service is accessible."
            ) from e

        print(f"[DATABASE WARNING] Could not connect to MySQL ({e}).")
        print("[DATABASE NOTICE] Defaulting to SQLite ('sqlite:///./ott_share_scheduler.db') for zero-friction local execution.")
        print("[DATABASE NOTICE] To use MySQL, ensure MySQL server is running and database exists, or update DATABASE_URL in .env.")
        sqlite_url = "sqlite:///./ott_share_scheduler.db"
        return create_engine(sqlite_url, connect_args={"check_same_thread": False})

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """FastAPI Dependency for database session management"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
