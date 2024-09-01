import docker
import requests
from appstore import celery
import subprocess
import json
import os
import git
import pandas as pd
from sqlalchemy import text, types
from appstore import connection, engine
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

# functions
def create_app_metadata(app_metadata):
    with engine.connect() as connection:
        connection.execute(AppMetadata.__table__.insert().values(
            name=app_metadata.name,
            description=app_metadata.description,
            repository_url=app_metadata.repository_url,
            docker_compose_file=app_metadata.docker_compose_file,
            docker_image=app_metadata.docker_image,
            start_command=app_metadata.start_command,
            stop_command=app_metadata.stop_command
        ))

def get_app_metadata(app_name):
    with engine.connect() as connection:
        result = connection.execute(text("SELECT * FROM app_metadata WHERE name = :name"), {"name": app_name}).fetchone()
        return {
            "name": result[1],
            "description": result[2],
            "repository_url": result[3],
            "docker_compose_file": result[4],
            "docker_image": result[5],
            "start_command": result[6],
            "stop_command": result[7]
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
    connection.execute(text("CREATE TABLE IF NOT EXISTS zamba_csv (filepath VARCHAR(255), classname VARCHAR(255), timestamp TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"))
    
    # Convert timestamp to datetime before inserting into database
    csvDataFrame['timestamp'] = pd.to_datetime(csvDataFrame['timestamp'])
    
    csvDataFrame.to_sql('zamba_csv', con=engine, index=False, if_exists='append', dtype={'timestamp': types.DateTime()})

    # Verify that the data was inserted correctly
    result = connection.execute(text("SELECT * FROM zamba_csv LIMIT 5"))
    for row in result:
        print(row)