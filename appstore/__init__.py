from flask import Flask
from flask_cors import CORS
from sqlalchemy import create_engine
from celery import Celery

app = Flask(__name__)

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

# Import and register blueprints
from appstore.routes import main_bp, zamba_bp, trapper_bp, animl_bp

app.register_blueprint(main_bp)
app.register_blueprint(zamba_bp)
app.register_blueprint(trapper_bp)
app.register_blueprint(animl_bp)