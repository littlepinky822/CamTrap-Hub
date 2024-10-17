from flask import Blueprint, request, jsonify, send_file
from appstore import celery, app, s3_client
from appstore.utils import process_zamba_task, train_zamba_task
from sqlalchemy import MetaData, Table
from appstore import db
from werkzeug.utils import secure_filename
import os

bp = Blueprint('zamba', __name__, url_prefix='/zamba')
BUCKET_NAME = app.config['S3_BUCKET_NAME']
S3_FOLDER = 'uploads'

@bp.route('/upload', methods=['POST'])
def zamba_upload():
    if not request.form:
        return jsonify({'error': 'Missing required files'}), 400
    file_paths = request.form.getlist('file')
    upload_folder = os.path.join(os.path.dirname(__file__), '..', app.config['UPLOAD_FOLDER'])

    uploaded_files = []
    for s3_path in file_paths:
        try:
            # Extract the filename from the S3 path
            filename = os.path.basename(s3_path)
            local_file_path = os.path.join(upload_folder, filename)
            print("Local file path: ", local_file_path)
            
            # Download the file from S3
            s3_client.download_file(BUCKET_NAME, s3_path, local_file_path)
            
            if os.path.exists(local_file_path):
                uploaded_files.append(filename)
            else:
                return jsonify({"status": "error", "message": f"Failed to download {filename} from S3"})
        except Exception as e:
            return jsonify({"status": "error", "message": f"Error processing {s3_path}: {str(e)}"})
    
    if len(uploaded_files) == len(file_paths):
        return jsonify({"status": "success", "message": "Images downloaded from S3", "files": uploaded_files})
    else:
        return jsonify({"status": "partial_success", "message": "Some images failed to download from S3", "files": uploaded_files})

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
    metadata = MetaData(bind=db.engine)
    zamba_csv = Table('zamba_csv', metadata, autoload=True)

    # get results from the database
    query = zamba_csv.select()
    result = db.session.execute(query)
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
    uploaded_videos = []
    upload_folder = os.path.join(os.path.dirname(__file__), '..', app.config['TRAIN_FOLDER'])
    upload_videos_folder = os.path.join(os.path.dirname(__file__), '..', app.config['TRAIN_VIDEOS_FOLDER'])
    
    # Handle label CSV
    labelCsv = request.files.get('labelCsv')
    if labelCsv and labelCsv.filename != '':
        labelCsvFilename = secure_filename(labelCsv.filename)
        labelCsv.save(os.path.join(upload_folder, labelCsvFilename))

    # Handle video files
    videofile_paths = request.form.getlist('videos')
    for s3_path in videofile_paths:
        try:
            # Extract the filename from the S3 path
            filename = os.path.basename(s3_path)
            local_file_path = os.path.join(upload_videos_folder, filename)
            print("Local file path: ", local_file_path)
            
            # Download the file from S3
            s3_client.download_file(BUCKET_NAME, s3_path, local_file_path)
            
            if os.path.exists(local_file_path):
                uploaded_videos.append(filename)
            else:
                return jsonify({"status": "error", "message": f"Failed to download {filename} from S3"})
        except Exception as e:
            return jsonify({"status": "error", "message": f"Error processing {s3_path}: {str(e)}"})
    
    if len(uploaded_videos) == len(videofile_paths):
        return jsonify({"status": "success", "message": "Images downloaded from S3", "files": uploaded_videos})
    else:
        return jsonify({"status": "partial_success", "message": "Some images failed to download from S3", "files": uploaded_videos})

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