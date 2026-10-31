import logging
import os
import ssl
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

logger = logging.getLogger(__name__)

# Base declarative class for SQLAlchemy models
Base = declarative_base()


def _normalize_db_url(raw_url: str) -> tuple[str, bool]:
    """
    Normalizes a MySQL connection URL for use with SQLAlchemy + PyMySQL:

    1. Rewrites mysql:// -> mysql+pymysql:// so the correct driver is selected.
    2. Strips SSL-related query parameters (ssl-mode, ssl_mode, sslmode,
       sslrootcert, ssl-ca) that PyMySQL does not accept as keyword arguments.
       SSL is configured separately via connect_args['ssl'] instead.

    Returns:
        (clean_url, had_ssl_flag)
        had_ssl_flag is True if any SSL query parameter was present, which is
        used as an additional signal to enable the SSL context even when the
        host is not obviously remote.
    """
    # Step 1: dialect rewrite
    if raw_url.startswith("mysql://"):
        raw_url = raw_url.replace("mysql://", "mysql+pymysql://", 1)

    # Step 2: strip SSL query parameters via proper URL parsing
    SSL_QUERY_PARAMS = {"ssl-mode", "ssl_mode", "sslmode", "ssl-ca", "sslrootcert"}
    parsed = urlparse(raw_url)
    params = parse_qs(parsed.query, keep_blank_values=True)

    had_ssl_flag = bool(params.keys() & SSL_QUERY_PARAMS)
    for key in SSL_QUERY_PARAMS:
        params.pop(key, None)

    new_query = urlencode({k: v[0] for k, v in params.items()})
    clean_url = urlunparse(parsed._replace(query=new_query))

    return clean_url, had_ssl_flag


def _build_ssl_context(ca_cert_env: str = None) -> ssl.SSLContext:
    """
    Builds a verified SSL context for remote MySQL connections.

    Resolution order for the CA certificate:
      1. Path to a PEM file supplied via AIVEN_CA_CERT / MYSQL_SSL_CA env var.
      2. Inline PEM content supplied via the same env var.
      3. System default trusted root CA store (sufficient for Aiven, which uses
         a globally trusted CA chain on current free plans).

    CERT_REQUIRED and check_hostname are always enforced.
    """
    if ca_cert_env and os.path.isfile(ca_cert_env):
        ctx = ssl.create_default_context(cafile=ca_cert_env)
    elif ca_cert_env and "-----BEGIN CERTIFICATE-----" in ca_cert_env:
        ctx = ssl.create_default_context()
        ctx.load_verify_locations(cadata=ca_cert_env)
    else:
        ctx = ssl.create_default_context()

    ctx.verify_mode = ssl.CERT_REQUIRED
    ctx.check_hostname = True
    return ctx


def get_engine():
    raw_url = settings.DATABASE_URL
    db_url, had_ssl_flag = _normalize_db_url(raw_url)

    # In production, require a MySQL URL scheme
    if settings.is_production and not (db_url.startswith("mysql+") or db_url.startswith("mysql:")):
        raise RuntimeError(
            f"Production environment requires a MySQL DATABASE_URL (mysql+pymysql://...). "
            f"Configured URL scheme: {db_url.split('://')[0] if '://' in db_url else db_url}"
        )

    try:
        if db_url.startswith("mysql"):
            timeout = 10 if settings.is_production else 3
            connect_args = {"connect_timeout": timeout}

            # Attach a verified SSL context for any remote (non-localhost) host
            # or whenever the original URL carried an ssl-mode flag.
            is_remote = not any(
                marker in db_url.lower()
                for marker in ("@localhost", "@127.0.0.1", "host=localhost")
            )
            if is_remote or had_ssl_flag:
                ca_cert = os.getenv("AIVEN_CA_CERT") or os.getenv("MYSQL_SSL_CA")
                connect_args["ssl"] = _build_ssl_context(ca_cert)

            engine = create_engine(
                db_url,
                pool_pre_ping=True,
                pool_recycle=3600,
                connect_args=connect_args,
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
