from flask import Blueprint, render_template, request, jsonify, send_file
from appstore import celery, app
from appstore.utils import process_zamba_task, train_zamba_task
from sqlalchemy import MetaData, Table
from appstore import engine, connection
from werkzeug.utils import secure_filename
import os

bp = Blueprint('zamba', __name__, url_prefix='/zamba')

@bp.route('/', methods=['GET', 'POST'])
def zamba():
    models = ["blank_nonblank", "slowfast", "european"]
    if request.method == 'POST':
        files = request.files.getlist('file')
        for file in files:
            filename = secure_filename(file.filename)
            file.save(os.path.join(os.path.abspath(os.path.dirname(__file__)), app.config['UPLOAD_FOLDER'], filename))
        return render_template('zamba.html', models=models, files=files)
    return render_template('zamba.html', models=models)

# Classifying unlabeled videos
@bp.route('/process', methods=['POST'])
def process():
    # get model selection
    data = request.get_json()
    type = data.get('type')
    model = data.get('model')
    dryRun = data.get('dryRun')
    outputClassname = data.get('outputClassname')
    print('dryRun: ', dryRun, '/n outputClassname: ', outputClassname)

    # Trigger the Celery task
    task = process_zamba_task.delay(type, model, dryRun, outputClassname)
    return jsonify({'message': 'Processing started', 'task_id': task.id}), 202

@bp.route('/result', methods=['GET'])
def display_result():
    result = get_result()
    return render_template('zamba-result.html', result=result)

def get_result():
    print('start get result')
    metadata = MetaData(bind=engine)
    zamba_csv = Table('zamba_csv', metadata, autoload=True)

    # get results from the database
    query = zamba_csv.select()
    result = connection.execute(query)
    print('result: ', result)

    # Convert the SQL result to a list of dictionaries
    result_list = [dict(row) for row in result]
    print('result list: ', result_list)
    # connection.close()

    return result_list

@bp.route('/download')
def download():
    path = '../zamba_predictions.csv'
    return send_file(path, as_attachment=True)

# Training a model
@bp.route('/train', methods=['GET', 'POST'])
def train():
    # Initialize variables to None or empty
    labelCsv = None
    videofiles = []

    if request.method == 'POST':
        # Handle label CSV
        labelCsv = request.files.get('label-file')
        if labelCsv and labelCsv.filename != '':
            labelCsvFilename = secure_filename(labelCsv.filename)
            labelCsv.save(os.path.join(os.path.abspath(os.path.dirname(__file__)), '..', app.config['TRAIN_FOLDER'], labelCsvFilename))

        # Handle video files
        videofiles = request.files.getlist('training-video-file')
        for video in videofiles:
            if video.filename:  # Ensure there is a filename
                videoname = secure_filename(video.filename)
                video.save(os.path.join(os.path.abspath(os.path.dirname(__file__)), '..', app.config['TRAIN_VIDEOS_FOLDER'], videoname))

    return render_template('zamba-train.html', labelCsv=labelCsv, videofiles=videofiles)

@bp.route('/train/start', methods=['POST'])
def train_start():
    data = request.get_json()
    model = data.get('model')
    dryRun = data.get('dryRun')
    labels = 'appstore/' + app.config['TRAIN_FOLDER'] + '/' + data.get('labels')
    print('labels: ', labels)
    task = train_zamba_task.delay(model, dryRun, labels)
    return jsonify({'message': 'Training started', 'task_id': task.id}), 202