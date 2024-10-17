from flask import Flask
from flask_cors import CORS
from flask_login import LoginManager
from flask_bcrypt import Bcrypt
from celery import Celery
from flask_sqlalchemy import SQLAlchemy
import boto3

app = Flask(__name__, static_folder='static', template_folder='templates')

# Enable CORS for all routes
CORS(app, supports_credentials=True)

# Load configuration from config.py
app.config.from_object('appstore.config')

# AWS S3 client
s3_client = boto3.client(
    's3',
    aws_access_key_id=app.config['AWS_ACCESS_KEY_ID'],
    aws_secret_access_key=app.config['AWS_SECRET_ACCESS_KEY'],
    region_name=app.config['AWS_REGION']
)

# Database connection
db = SQLAlchemy(app)
from appstore.models import AppMetadata, User

# Initialise LoginManager
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'main.login'

# Initialise Bcrypt
bcrypt = Bcrypt(app)

# Celery configuration
celery = Celery(app.name, broker=app.config['CELERY_BROKER_URL'], backend=app.config['CELERY_RESULT_BACKEND'])
celery.conf.update(app.config)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(user_id)

# Import and register blueprints
from appstore.routes import main_bp, zamba_bp, trapper_bp, animl_bp, megadetector_bp, ecosecrets_bp, il2bb_bp, camera_trap_tools_bp, wildCoFaceBlur_bp, dataSpace_bp, cameraTrapWorkflow_bp

app.register_blueprint(main_bp)
app.register_blueprint(zamba_bp)
app.register_blueprint(trapper_bp)
app.register_blueprint(animl_bp)
app.register_blueprint(megadetector_bp)
app.register_blueprint(ecosecrets_bp)
app.register_blueprint(il2bb_bp)
app.register_blueprint(camera_trap_tools_bp)
app.register_blueprint(wildCoFaceBlur_bp)
app.register_blueprint(dataSpace_bp)
app.register_blueprint(cameraTrapWorkflow_bp)
# Import utils after app initialization
from appstore.utils import create_app_metadata, trapper_metadata, animl_metadata, ecosecrets_metadata, il2bb_metadata, cameratraptools_metadata, wildcofaceblur_metadata, cameratrapworkflow_metadata, zamba_metadata, megadetector_metadata

# Create app metadata if it doesn't exist
def create_initial_metadata():
    for app_name in ['Trapper', 'Animl', 'EcoSecrets', 'IL2BB', 'CameraTrapTools', 'WildCoFaceBlur', 'CameraTrapWorkflow', 'Zamba', 'MegaDetector']:
        existing = AppMetadata.query.filter_by(name=app_name).first()
        if not existing:
            app_metadata = globals()[f"{app_name.lower()}_metadata"]
            create_app_metadata(app_metadata)

with app.app_context():
    db.create_all()
    create_initial_metadata()