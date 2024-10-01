import docker
import requests
from appstore import celery
import subprocess
import json
import os
import git
import pandas as pd
from sqlalchemy import text, types
from appstore import db
from appstore.models import AppMetadata

# variables
trapper_metadata = AppMetadata(
    name="Trapper",
    description="Trapper Expert - core web application for camera trap data management",
    repository_url="https://gitlab.com/trapper-project/trapper.git",
    docker_compose_file="docker-compose.yml",
    start_command="./start.sh -pb dev",
    stop_command="./start.sh prod stop"
)
animl_metadata = AppMetadata(
    name="Animl",
    description="Animl - core web application for animal detection",
    repository_url="https://github.com/tnc-ca-geo/animl-frontend.git",
    docker_image="registry.git.cf.ac.uk/c22097859/c22097859_cmt403_dissertation/animl:latest",
    start_command="docker run -p 5173:5173 animl-container animl",
    stop_command="docker stop animl-container"
)
ecosecrets_metadata = AppMetadata(
    name="EcoSecrets",
    description="EcoSecrets - core web application for camera trap data management",
    repository_url="https://github.com/naturalsolutions/ecoSecrets.git",
    docker_compose_file="docker-compose.yml",
    start_command="./scripts/docker.sh up -d",
    stop_command="./scripts/docker.sh down"
)
il2bb_metadata = AppMetadata(
    name="IL2BB",
    description="IL2BB - a pipeline automates the generation of labeled bounding boxes",
    repository_url="https://github.com/persts/IL2BB",
    docker_image="registry.git.cf.ac.uk/c22097859/c22097859_cmt403_dissertation/il2bb:latest",
    start_command="docker run il2bb-container il2bb",
    stop_command="docker stop il2bb-container"
)
cameratraptools_metadata = AppMetadata(
    name="CameraTrapTools",
    description="Camera Trap Tools - a collection of tools for camera trap data management",
    repository_url="https://github.com/persts/CameraTrapTools",
    docker_image="registry.git.cf.ac.uk/c22097859/c22097859_cmt403_dissertation/camera-trap-tools:latest",
    start_command="docker run camera-trap-tools-container camera-trap-tools",
    stop_command="docker stop camera-trap-tools-container"
)
wildcofaceblur_metadata = AppMetadata(
    name="WildCoFaceBlur",
    description="WildCoFaceBlur - a pipeline for face blurring",
    repository_url="https://github.com/mitch-fen/WildCo-FaceBlur.git",
    docker_image="registry.git.cf.ac.uk/c22097859/c22097859_cmt403_dissertation/wildco-faceblur:latest",
    start_command="docker run wildco-faceblur-container wildco-faceblur",
    stop_command="docker stop wildco-faceblur-container"
)

# functions
def create_app_metadata(app_metadata):
    db.session.add(app_metadata)
    db.session.commit()

def get_app_metadata(app_name):
    result = AppMetadata.query.filter_by(name=app_name).first()
    if result is None:
        return None  # or raise an exception if you prefer
    return {
        "name": result.name,
        "description": result.description,
        "repository_url": result.repository_url,
        "docker_compose_file": result.docker_compose_file,
        "docker_image": result.docker_image,
        "start_command": result.start_command,
        "stop_command": result.stop_command
    }

def is_container_exist(container_name):
    client = docker.from_env()
    try:
        containers = client.containers.list(filters={'name': container_name})
        return any(container.status == 'running' for container in containers)
    except Exception as e:
        print(f"Error checking container status: {e}")
        return False

def is_container_running_by_name(container_name):
    client = docker.from_env()
    try:
        container = client.containers.get(container_name)
        return container.status == 'running'
    except docker.errors.NotFound:
        return False
    except Exception as e:
        print(f"Error checking container status: {e}")
        return False

def is_container_running(service_name):
    client = docker.from_env()
    try:
        containers = client.containers.list(filters={'label': f'com.docker.compose.service={service_name}'})
        return any(container.status == 'running' for container in containers)
    except Exception as e:
        print(f"Error checking container status: {e}")
        return False

def is_server_ready(url, timeout=5):
    try:
        response = requests.get(url, timeout=timeout)
        return response.status_code == 200
    except requests.RequestException:
        return False

# celery tasks
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
    csvDataFrame['timestamp'] = pd.Timestamp.now()

    # Insert data into the database
    db.session.add(csvDataFrame)
    db.session.commit()    
    
    # Convert timestamp to datetime before inserting into database
    csvDataFrame['timestamp'] = pd.to_datetime(csvDataFrame['timestamp'])
    
    csvDataFrame.to_sql('zamba_csv', con=db.engine, index=False, if_exists='append', dtype={'timestamp': types.DateTime()})

    # Verify that the data was inserted correctly
    result = db.session.execute(text("SELECT * FROM zamba_csv LIMIT 5"))
    for row in result:
        print(row)