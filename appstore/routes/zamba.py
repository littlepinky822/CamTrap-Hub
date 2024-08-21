from flask import Blueprint, render_template, request, jsonify, send_file
from appstore import celery, app
from appstore.utils import process_zamba_task, train_zamba_task
from sqlalchemy import MetaData, Table
from appstore import engine, connection
from werkzeug.utils import secure_filename
import os

bp = Blueprint('zamba', __name__, url_prefix='/zamba')

@bp.route('/upload', methods=['POST'])
def zamba_upload():
    files = request.files.getlist('file')
    uploaded_files = []
    for file in files:
        if file:
            filename = secure_filename(file.filename)
            file.save(os.path.join(os.path.abspath(os.path.dirname(__file__)), '..', app.config['UPLOAD_FOLDER'], filename))
            uploaded_files.append(filename)
    return jsonify({
        "status": "success", 
        "message": "Images/Videos uploaded",
        "files": uploaded_files
    })

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

    return jsonify(result_list)

@bp.route('/download')
def download():
    filename = 'zamba_predictions.csv'
    file_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), '../..', filename)
    print('file path: ', file_path)
    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=True, download_name=filename)
    else:
        return jsonify({"error": "File not found"}), 404

# Training a model
@bp.route('/train/upload', methods=['POST'])
def train_upload():
    # Initialize variables to None or empty
    labelCsv = None
    videofiles = []
    
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

    return jsonify({
        'message': 'Training files uploaded',
        'labelCsv': labelCsv.filename,
        'videofiles': [video.filename for video in videofiles]
    }), 202

@bp.route('/train/start', methods=['POST'])
def train_start():
    data = request.get_json()
    model = data.get('model')
    dryRun = data.get('dryRun')
    labels = data.get('labels')
    
    if not labels:
        return jsonify({'error': 'No label file specified'}), 400
    
    labels_path = os.path.join('appstore/', app.config['TRAIN_FOLDER'], labels)
    
    print('labels:', labels_path, 'model:', model, 'dryRun:', dryRun)
    task = train_zamba_task.delay(model, dryRun, labels_path)
    return jsonify({'message': 'Training started', 'task_id': task.id}), 202