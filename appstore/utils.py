import docker
import requests
from appstore import celery
import subprocess
import json
import os
import pandas as pd
from sqlalchemy import text
from appstore import connection, engine

def is_container_running(service_name):
    client = docker.from_env()
    try:
        containers = client.containers.list(filters={'label': f'com.docker.compose.service={service_name}'})
        return any(container.status == 'running' for container in containers)
    except Exception as e:
        print(f"Error checking container status: {e}")
        return False

def is_trapper_ready(url, timeout=5):
    try:
        response = requests.get(url, timeout=timeout)
        return response.status_code == 200
    except requests.RequestException:
        return False

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