"""Production WSGI entrypoint. Used by gunicorn: `gunicorn wsgi:application`."""
from app import create_app

application = create_app()
