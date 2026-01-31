"""Firebase Authentication utilities"""
import logging
import os
from typing import Optional
from functools import lru_cache

from app.core.config import settings

logger = logging.getLogger(__name__)

# Firebase Admin SDK - initialized lazily
_firebase_app = None


def get_firebase_config() -> dict:
    """
    Get Firebase configuration matching frontend settings.
    This can be exposed via an API endpoint for frontend configuration.
    """
    return {
        "apiKey": settings.FIREBASE_API_KEY,
        "authDomain": settings.FIREBASE_AUTH_DOMAIN,
        "projectId": settings.FIREBASE_PROJECT_ID,
        "storageBucket": settings.FIREBASE_STORAGE_BUCKET,
        "messagingSenderId": settings.FIREBASE_MESSAGING_SENDER_ID,
        "appId": settings.FIREBASE_APP_ID,
    }


def get_firebase_app():
    """Get or initialize Firebase Admin app"""
    global _firebase_app

    if _firebase_app is not None:
        return _firebase_app

    try:
        import firebase_admin
        from firebase_admin import credentials

        # Check if already initialized
        try:
            _firebase_app = firebase_admin.get_app()
            return _firebase_app
        except ValueError:
            pass

        # Initialize with credentials file
        if settings.FIREBASE_CREDENTIALS_PATH:
            # Try multiple paths for credentials file
            cred_paths = [
                settings.FIREBASE_CREDENTIALS_PATH,
                os.path.join("src", settings.FIREBASE_CREDENTIALS_PATH),
                os.path.join(os.path.dirname(__file__), "..", "..", "..", settings.FIREBASE_CREDENTIALS_PATH),
            ]

            cred_path = None
            for path in cred_paths:
                if os.path.exists(path):
                    cred_path = path
                    break

            if cred_path:
                cred = credentials.Certificate(cred_path)
                _firebase_app = firebase_admin.initialize_app(cred)
                logger.info(f"Firebase Admin SDK initialized with credentials from: {cred_path}")
                return _firebase_app
            else:
                logger.warning(f"Firebase credentials file not found: {settings.FIREBASE_CREDENTIALS_PATH}")

        # Fallback: Use project ID only (for environments with default credentials)
        if settings.FIREBASE_PROJECT_ID:
            _firebase_app = firebase_admin.initialize_app(options={
                'projectId': settings.FIREBASE_PROJECT_ID
            })
            logger.info(f"Firebase Admin SDK initialized with project ID: {settings.FIREBASE_PROJECT_ID}")
            return _firebase_app

        logger.warning("Firebase credentials not configured. Firebase auth disabled.")
        return None

    except ImportError:
        logger.warning("firebase-admin package not installed. Firebase auth disabled.")
        return None
    except Exception as e:
        logger.error(f"Failed to initialize Firebase: {e}")
        return None


def verify_firebase_token(token: str) -> Optional[dict]:
    """
    Verify a Firebase ID token and return the decoded token data.

    Args:
        token: Firebase ID token from the frontend

    Returns:
        Decoded token dict with user info (uid, email, etc.) or None if invalid
    """
    app = get_firebase_app()
    if not app:
        return None

    try:
        from firebase_admin import auth

        # Verify the token
        decoded_token = auth.verify_id_token(token, check_revoked=True)

        return {
            "uid": decoded_token.get("uid"),
            "email": decoded_token.get("email"),
            "email_verified": decoded_token.get("email_verified", False),
            "name": decoded_token.get("name"),
            "picture": decoded_token.get("picture"),
            "provider": decoded_token.get("firebase", {}).get("sign_in_provider"),
        }

    except Exception as e:
        logger.warning(f"Firebase token verification failed: {e}")
        return None


def get_firebase_user(uid: str) -> Optional[dict]:
    """
    Get Firebase user by UID.

    Args:
        uid: Firebase user UID

    Returns:
        User info dict or None
    """
    app = get_firebase_app()
    if not app:
        return None

    try:
        from firebase_admin import auth

        user = auth.get_user(uid)
        return {
            "uid": user.uid,
            "email": user.email,
            "email_verified": user.email_verified,
            "display_name": user.display_name,
            "photo_url": user.photo_url,
            "disabled": user.disabled,
            "provider_data": [
                {"provider_id": p.provider_id, "email": p.email}
                for p in user.provider_data
            ] if user.provider_data else []
        }

    except Exception as e:
        logger.warning(f"Failed to get Firebase user: {e}")
        return None


def create_firebase_user(email: str, password: str, display_name: str = None) -> Optional[dict]:
    """
    Create a new Firebase user.

    Args:
        email: User email
        password: User password
        display_name: Optional display name

    Returns:
        Created user info dict or None if failed
    """
    app = get_firebase_app()
    if not app:
        logger.warning("Firebase not initialized, cannot create user")
        return None

    try:
        from firebase_admin import auth

        user = auth.create_user(
            email=email,
            password=password,
            display_name=display_name,
            email_verified=False
        )

        logger.info(f"Created Firebase user: {user.uid} ({email})")

        return {
            "uid": user.uid,
            "email": user.email,
            "display_name": user.display_name,
        }

    except Exception as e:
        logger.error(f"Failed to create Firebase user: {e}")
        return None


def delete_firebase_user(uid: str) -> bool:
    """
    Delete a Firebase user.

    Args:
        uid: Firebase user UID

    Returns:
        True if deleted, False otherwise
    """
    app = get_firebase_app()
    if not app:
        return False

    try:
        from firebase_admin import auth
        auth.delete_user(uid)
        logger.info(f"Deleted Firebase user: {uid}")
        return True

    except Exception as e:
        logger.error(f"Failed to delete Firebase user: {e}")
        return False


def get_firebase_user_by_email(email: str) -> Optional[dict]:
    """
    Get Firebase user by email.

    Args:
        email: User email

    Returns:
        User info dict or None
    """
    app = get_firebase_app()
    if not app:
        return None

    try:
        from firebase_admin import auth

        user = auth.get_user_by_email(email)
        return {
            "uid": user.uid,
            "email": user.email,
            "email_verified": user.email_verified,
            "display_name": user.display_name,
            "disabled": user.disabled,
        }

    except Exception as e:
        logger.warning(f"Failed to get Firebase user by email: {e}")
        return None
