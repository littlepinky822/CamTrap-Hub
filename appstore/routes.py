from appstore import app, engine, connection, celery
from flask import render_template, request, jsonify, send_file
from werkzeug.utils import secure_filename
import os, subprocess
import pandas as pd
from sqlalchemy import MetaData, Table
from sqlalchemy.sql import text
import json

@app.route('/')
@app.route('/home')
def home():
    return render_template('index.html')

@app.route('/zamba', methods=['GET', 'POST'])
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
@app.route('/zamba/process', methods=['POST'])
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

@celery.task(name='process_zamba_task')
def process_zamba_task(type, model, dryRun, outputClassname, data_dir='appstore/static/zamba/media'):
    print('Start processing (celery task)...')
    command = ['zamba', 'predict', '--data-dir', data_dir, '-y', '--model', model]
    # command.insert(0, 'PREDICT_ON_IMAGES=True') if type == 'image' else command.insert(0, 'PREDICT_ON_IMAGES=False')
    command.append('--dry-run') if dryRun == "true" else command.append('--no-dry-run')
    command.append('--output-class-names') if outputClassname == "true" else command.append('--no-output-class-names')
    
    env = os.environ.copy()
    env['PREDICT_ON_IMAGES'] = 'True' if type == 'image' else 'False'

    print('Command: ', command)
    print('Environment: ', env)

    result = subprocess.run(command, capture_output=True, text=True, env=env)
    if result.returncode == 0:
        data = {'message': 'Classification completed successfully', 'output': result.stdout}
        if dryRun == "false" and outputClassname == 'true':
            parseCSV('zamba_predictions.csv')
        if dryRun == "false":
            with open('process-result.json', 'w') as statusFile:
                json.dump(data, statusFile)  # Use json.dump to write JSON data to the file
        else:
            with open('process-result-dryrun.json', 'w') as statusFile:
                json.dump(data, statusFile)
        return data
    else:
        raise ValueError('Error processing the files', result.stderr)

def parseCSV(filePath):
    # Read CSV using pandas
    csvDataFrame = pd.read_csv(filePath)
    csvDataFrame.rename(columns={'0': 'classname'}, inplace=True)

    # Insert data into the database
    connection.execute(text("CREATE TABLE IF NOT EXISTS zamba_csv (filepath VARCHAR(255), classname VARCHAR(255))"))
    csvDataFrame.to_sql('zamba_csv', con=engine, index=False, if_exists='append')

@app.route('/zamba/result', methods=['GET'])
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

@app.route('/download')
def download():
    path = '../zamba_predictions.csv'
    return send_file(path, as_attachment=True)

# Training a model
@app.route('/zamba/train', methods=['GET', 'POST'])
def train():
    # Initialize variables to None or empty
    labelCsv = None
    videofiles = []

    if request.method == 'POST':
        # Handle label CSV
        labelCsv = request.files.get('label-file')
        if labelCsv and labelCsv.filename != '':
            labelCsvFilename = secure_filename(labelCsv.filename)
            labelCsv.save(os.path.join(os.path.abspath(os.path.dirname(__file__)), app.config['TRAIN_FOLDER'], labelCsvFilename))

        # Handle video files
        videofiles = request.files.getlist('training-video-file')
        for video in videofiles:
            if video.filename:  # Ensure there is a filename
                videoname = secure_filename(video.filename)
                video.save(os.path.join(os.path.abspath(os.path.dirname(__file__)), app.config['TRAIN_VIDEOS_FOLDER'], videoname))

    return render_template('zamba-train.html', labelCsv=labelCsv, videofiles=videofiles)

@app.route('/zamba/train/start', methods=['POST'])
def train_start():
    data = request.get_json()
    model = data.get('model')
    dryRun = data.get('dryRun')
    labels = 'appstore/' + app.config['TRAIN_FOLDER'] + '/' + data.get('labels')
    print('labels: ', labels)
    task = train_zamba_task.delay(model, dryRun, labels)
    return jsonify({'message': 'Training started', 'task_id': task.id}), 202

@celery.task(name='train_zamba_task')
def train_zamba_task(model, dryRun, labels, data_dir='appstore/static/zamba/train/videos'):
    command = ['zamba', 'train', '--data-dir', data_dir, '--labels', labels, '--model', model, '-y']
    command.append('--dry-run') if dryRun == "true" else command.append('--no-dry-run')
    print('Command: ', command)

    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode == 0:
        data = {
            'message': 'Training completed successfully',
            'output': result.stdout
        }
        if dryRun == "false":
            with open('train-result.json', 'w') as statusFile:
                json.dump(data, statusFile)  # Use json.dump to write JSON data to the file
        else:
            with open('train-result-dryrun.json', 'w') as statusFile:
                json.dump(data, statusFile)
        return data
    else:
        raise ValueError('Error processing the files', result.stderr)

# GET celery task status
@app.route('/task_status/<task_id>', methods=['GET'])
def task_status(task_id):
    task = celery.AsyncResult(task_id)
    data = {
        'task_id': task_id,
        'status': task.state,
        'result': task.result  # This could be None if task isn't finished
    }
    return jsonify(data)

if __name__ == '__main__':
    app.run()