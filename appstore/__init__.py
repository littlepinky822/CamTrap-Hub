from flask import Flask
from sqlalchemy import create_engine
from celery import Celery

app = Flask(__name__)
app.config['SECRET_KEY'] = 'topsecretkey'
app.config['UPLOAD_FOLDER'] = 'static/zamba/media'
app.config['TRAIN_FOLDER'] = 'static/zamba/train'
app.config['TRAIN_VIDEOS_FOLDER'] = 'static/zamba/train/videos'

celery = Celery(app.name, broker='redis://localhost:6379/0', backend='redis://localhost:6379/0')

# Database connection
connection_string = 'mysql+pymysql://c22097859:Masterdata822!@csmysql.cs.cf.ac.uk:3306/c22097859_dissertation'
engine = create_engine(connection_string, echo=True)
connection = engine.connect()

from appstore import routes