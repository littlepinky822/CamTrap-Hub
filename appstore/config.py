import os

# Flask settings
SECRET_KEY = 'your_secret_key_here'
DEBUG = True

# AWS S3 settings
AWS_ACCESS_KEY_ID = 'AKIA2FXAD64WVBFK572X'
AWS_SECRET_ACCESS_KEY = '462VZngMjz4n2gfAJBeJAB9G5jVtFFC42UBpRYrY'
# AWS_SECRET_ACCESS_KEY = 'randomsecretkeyidonhavemoneytopay'
AWS_REGION = 'eu-west-1'
S3_BUCKET_NAME = 'camtrap-appstore'

# Zamba file upload settings
UPLOAD_FOLDER = 'static/zamba/media'
TRAIN_FOLDER = 'static/zamba/train'
TRAIN_VIDEOS_FOLDER = 'static/zamba/train/videos'

# Megadetector file upload settings
MEGADETECTOR_UPLOAD_FOLDER = 'static/megadetector/images'
MEGADETECTOR_MAIN_FOLDER = 'static/megadetector'

# IL2BB file upload settings
IL2BB_MAIN_FOLDER = 'static/il2bb'
IL2BB_UPLOAD_FOLDER = 'static/il2bb/images'

# Camera Trap Tools file upload settings
CAMERA_TRAP_TOOLS_MAIN_FOLDER = 'static/camera-trap-tools'
CAMERA_TRAP_TOOLS_UPLOAD_FOLDER = 'static/camera-trap-tools/images'

# WildCo-FaceBlur file upload settings
WILDCO_FACEBLUR_MAIN_FOLDER = 'static/wildco-faceblur'
WILDCO_FACEBLUR_UPLOAD_FOLDER = 'static/wildco-faceblur/images'

# Celery settings
CELERY_BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'

# Database settings
SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://c22097859:Masterdata822!@csmysql.cs.cf.ac.uk:3306/c22097859_dissertation'
SQLALCHEMY_TRACK_MODIFICATIONS = False

# GitLab container registry settings
GITLAB_REGISTRY_URL = 'registry.git.cf.ac.uk'
GITLAB_REGISTRY_USERNAME = 'c22097859'
GITLAB_ACCESS_TOKEN = 'Ye4xAmRLMarzafBBYznx' # READ_WRITE_REGISTRY