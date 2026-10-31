import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

logger = logging.getLogger(__name__)

# Base declarative class for SQLAlchemy models
Base = declarative_base()

def get_engine():
    db_url = settings.DATABASE_URL
    try:
        if db_url.startswith("mysql"):
            # Test connecting with a short timeout to see if MySQL is alive
            engine = create_engine(
                db_url,
                pool_pre_ping=True,
                pool_recycle=3600,
                connect_args={"connect_timeout": 3}
            )
            # Try a test connection
            with engine.connect() as conn:
                pass
            print(f"[DATABASE] Connected successfully to MySQL: {db_url.split('@')[-1]}")
            return engine
        else:
            return create_engine(db_url)
    except Exception as e:
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
