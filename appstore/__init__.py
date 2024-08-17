from flask import Flask
from flask_cors import CORS
from sqlalchemy import create_engine
from celery import Celery
from appstore.models import Base, AppMetadata

# app = Flask(__name__, static_folder='static', template_folder='templates')
app = Flask(__name__, static_folder='../frontend', static_url_path='/')

# Enable CORS for all routes
CORS(app)

# Load configuration from config.py
app.config.from_object('appstore.config')

# Celery configuration
celery = Celery(app.name, broker=app.config['CELERY_BROKER_URL'], backend=app.config['CELERY_RESULT_BACKEND'])
celery.conf.update(app.config)

# Database connection
engine = create_engine(app.config['DATABASE_URI'], echo=True)
connection = engine.connect()
Base.metadata.create_all(engine)

# Import and register blueprints
from appstore.routes import main_bp, zamba_bp, trapper_bp, animl_bp, megadetector_bp

app.register_blueprint(main_bp)
app.register_blueprint(zamba_bp)
app.register_blueprint(trapper_bp)
app.register_blueprint(animl_bp)
app.register_blueprint(megadetector_bp)

# Import utils after app initialization
from appstore.utils import trapper_metadata, create_app_metadata, animl_metadata
from sqlalchemy import text

# Create Trapper metadata if it doesn't exist
for app_name in ['Trapper', 'Animl']:
    result = connection.execute(text("SELECT * FROM app_metadata WHERE name = :name"), {"name": app_name}).fetchone()
    if not result:
        app_metadata = globals()[f"{app_name.lower()}_metadata"]
        create_app_metadata(app_metadata)