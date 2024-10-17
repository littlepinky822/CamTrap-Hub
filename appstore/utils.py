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
import logging

# Set up logging at the beginning of your script
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# variables
trapper_metadata = AppMetadata(
    name="Trapper",
    display_name="Trapper",
    description="TRAPPER is an open-source, Python, Django and Docker-based web application designed to manage camera trapping projects.",
    full_description="""TRAPPER is an open-source, Python, Django and Docker-based web application designed to manage camera trapping projects.
                        \n• Open-source and free for use in research, academia, or wildlife conservation projects (GPLv3).
                        \n• Offers a spatially-enabled database backend.
                        \n• Capable of handling both pictures and videos.
                        \n• Features a flexible model for AI-based and expert-based classifications.
                        \n• Promotes the Camtrap DP standard and encourages data re-use.
                        \n• Supports collaborative work on a project.""",
    logo="https://gitlab.com/trapper-project/trapper/-/raw/master/trapper/trapper-project/trapper/apps/common/static/images/logo/logo.png",
    image="https://gitlab.com/trapper-project/trapper/-/raw/master/trapper/trapper-project/trapper/apps/common/static/images/logo/logo_text.png",
    link="http://localhost:8000/",
    tags=["Object Detection", "Filtering"],
    repository_url="https://gitlab.com/trapper-project/trapper.git",
    docker_compose_file="docker-compose.yml",
    start_command="./start.sh -pb dev",
    stop_command="./start.sh prod stop"
)
animl_metadata = AppMetadata(
    name="Animl",
    display_name="Animl",
    description="Animl is an open, extensible, cloud-based platform for managing camera trap data.",
    full_description="""Animl is an open, extensible, cloud-based platform for managing camera trap data. It provides:
                        \n• Ingest data from a variety of camera trap types (wireless, SD card based, IP, etc.)
                        \n• Systematically store and manage images in a single centralized, cloud-based repository
                        \n• Upload custom object detection and species clasification ML models and configure automated assisted-labeling pipelines
                        \n• Offer frontend web application to view images, review ML-assisted labels, perform manual labeling
                        \n• Offer an API for advanced querying and analysis of camera trap data
                        \n• Offer tools for exporting ML model training data""",
    logo='https://raw.githubusercontent.com/tnc-ca-geo/animl-frontend/d4b2542251007f7e01bb08956473d5b8f1c84314/public/favicon.ico',
    image='https://raw.githubusercontent.com/tnc-ca-geo/animl-frontend/main/src/assets/animl-logo.svg',
    link='/animl',
    tags=['Object Detection', 'Filtering'],
    repository_url="https://github.com/tnc-ca-geo/animl-frontend.git",
    docker_image="registry.git.cf.ac.uk/c22097859/c22097859_cmt403_dissertation/animl:latest",
    start_command="docker run -p 5173:5173 animl-container animl",
    stop_command="docker stop animl-container"
)
ecosecrets_metadata = AppMetadata(
    name="EcoSecrets",
    display_name="EcoSecrets",
    description='EcoSecrets is a web application enabling users to manage their camera traps data.',
    full_description="""ecoSecrets is an open-source web application that aims to facilitate biodiversity studies that use autonomous data collection devices such as camera traps. This web-application is in development and offers several features that meet the needs of biodiversity stakeholders:
                        \n• project management: to delimit the studies according to their context
                        \n• management of study sites: to identify spatial scope
                        \n• device management: to specify technical characteristics of the tools used in the field and their availability
                        \n• deployment management: to characterize spatio-temporal limits of data acquisition
                        \n• media management: to standardize and optimize the storage of collected data
                        \n• media processing: to enable the addition of annotations to the raw data""",
    logo='https://raw.githubusercontent.com/naturalsolutions/ecoSecrets/main/frontend/public/assets/ecosecrets-logo-icon.svg',
    image='https://raw.githubusercontent.com/naturalsolutions/ecoSecrets/main/frontend/public/assets/ecosecrets_logo_full_light.svg',
    link='http://localhost:8889/',
    tags=['Data management', 'Processing'],
    repository_url="https://github.com/naturalsolutions/ecoSecrets.git",
    docker_compose_file="docker-compose.yml",
    start_command="./scripts/docker.sh up -d",
    stop_command="./scripts/docker.sh down"
)
il2bb_metadata = AppMetadata(
    name="IL2BB",
    display_name="IL2BB",
    description='Image Level Label to Bounding Box Pipeline',
    full_description="""The Image Level Label to Bounding Box (IL2BB) pipeline automates the generation of labeled bounding boxes by leveraging an organization’s previous labeling efforts and Microsoft AI for Earth’s MegaDetector. The output of this pipeline are batches of images with annotation files that can be opened, reviewed, and modified with the Bounding Box Editor and Exporter (BBoxEE) to prepare training data for object detectors.
                        The IL2BB pipeline is especially useful for organizations that are hesitant or not permitted to use or store data on online services.""",
    logo='https://github.com/yan-tung-lam/il2bb/blob/main/logo.png?raw=true',
    image='https://github.com/yan-tung-lam/il2bb/blob/main/logo.png?raw=true',
    link='/il2bb',
    tags=['Classification'],
    repository_url="https://github.com/persts/IL2BB",
    docker_image="registry.git.cf.ac.uk/c22097859/c22097859_cmt403_dissertation/il2bb:latest",
    start_command="docker run il2bb-container il2bb",
    stop_command="docker stop il2bb-container"
)
cameratraptools_metadata = AppMetadata(
    name="CameraTrapTools",
    display_name="Camera Trap Tools",
    description='Camera Trap Tools is a collection of tools for managing camera trap data.',
    full_description="Camera Trap Tools is a collection of tools for managing camera trap data.",
    logo='https://github.com/yan-tung-lam/il2bb/blob/main/logo.png?raw=true',
    image='https://github.com/yan-tung-lam/il2bb/blob/main/logo.png?raw=true',
    link='/camera-trap-tools',
    tags=['Data management'],
    repository_url="https://github.com/persts/CameraTrapTools",
    docker_image="registry.git.cf.ac.uk/c22097859/c22097859_cmt403_dissertation/camera-trap-tools:latest",
    start_command="docker run camera-trap-tools-container camera-trap-tools",
    stop_command="docker stop camera-trap-tools-container"
)
wildcofaceblur_metadata = AppMetadata(
    name="WildCoFaceBlur",
    display_name="WildCo-FaceBlur",
    description='WildCo-FaceBlur is a tool for blurring faces in camera trap images.',
    full_description="""WildCo-FaceBlur is a tool for blurring faces in camera trap images.""",
    logo='https://github.com/yan-tung-lam/il2bb/blob/main/logo.png?raw=true',
    image='https://github.com/yan-tung-lam/il2bb/blob/main/logo.png?raw=true',
    link='/wildcofaceblur',
    tags=['Processing'],
    repository_url="https://github.com/mitch-fen/WildCo-FaceBlur.git",
    docker_image="registry.git.cf.ac.uk/c22097859/c22097859_cmt403_dissertation/wildco-faceblur:latest",
    start_command="docker run wildco-faceblur-container wildco-faceblur",
    stop_command="docker stop wildco-faceblur-container"
)
cameratrapworkflow_metadata = AppMetadata(
    name="CameraTrapWorkflow",
    display_name="Camera Trap Workflow",
    description='Camera Trap Workflow is a semi-automatic workflow to process camera trap images in R.',
    full_description="""Camera Trap Workflow is a semi-automatic workflow to process camera trap images in R. It includes:
                        \n• Extract metadata and rename images
                        \n• Automatic classification
                        \n• Quality check
                        \n• Manual classification
                        \n• Formatting""",
    logo='https://github.com/yan-tung-lam/il2bb/blob/main/logo.png?raw=true',
    image='https://github.com/yan-tung-lam/il2bb/blob/main/logo.png?raw=true',
    link='/camera-trap-workflow',
    tags=['Data management', 'Processing'],
    repository_url="https://github.com/hannaboe/camera_trap_workflow",
    docker_image="registry.git.cf.ac.uk/c22097859/c22097859_cmt403_dissertation/camera-trap-workflow:latest",
    start_command="docker run -p 3838:3838 --name camera-trap-workflow-container camera-trap-workflow",
    stop_command="docker stop camera-trap-workflow-container"
)

zamba_metadata = AppMetadata(
    name="Zamba",
    display_name="Zamba",
    description="Zamba is a tool built in Python that uses machine learning and computer vision to automatically detect and classify animals in camera trap videos.",
    full_description="""Zamba Cloud uses machine learning to automatically detect and classify animals in camera trap videos. You can use Zamba Cloud to:
                        \n• Classify which species appear in a video
                        \n• Identify blank videos
                        \n• Train a custom model with your own labeled data to identify species in your habitat
                        \n• Estimate the distance between animals in the frame and the camera
                        \n• And more!""",
    logo="https://drivendata-prod-public.s3.amazonaws.com/images/drivendata-logo.58f94dd407ef.svg",
    image="https://drivendata-prod-public.s3.amazonaws.com/images/drivendata-logo.58f94dd407ef.svg",
    link="/zamba",
    tags=["Classification", "Train Model"],
    repository_url="https://github.com/drivendataorg/zamba",
)

megadetector_metadata = AppMetadata(
    name='MegaDetector',
    display_name='MegaDetector',
    description='MegaDetector is an AI model that identifies animals, people, and vehicles in camera trap images.',
    full_description="""Conservation biologists invest a huge amount of time reviewing camera trap images, and a huge fraction of that time is spent reviewing images they aren't interested in. This primarily includes empty images, but for many projects, images of people and vehicles are also "noise", or at least need to be handled separately from animals.
                        Machine learning can accelerate this process, letting biologists spend their time on the images that matter.
                        To this end, this page hosts a model we've trained - called "MegaDetector" - to detect animals, people, and vehicles in camera trap images. It does not identify animals to the species level, it just finds them.""",
    logo='https://camo.githubusercontent.com/1ee7509ad47f8cbc02dd27f8405b8064ce3507fd454f187c7fb7e22da36ed0a3/68747470733a2f2f692e696d6775722e636f6d2f464354627147482e706e67',
    image='https://camo.githubusercontent.com/1ee7509ad47f8cbc02dd27f8405b8064ce3507fd454f187c7fb7e22da36ed0a3/68747470733a2f2f692e696d6775722e636f6d2f464354627147482e706e67',
    link='/megadetector',
    tags=['Object Detection', 'Filtering'],
    repository_url="https://github.com/agentmorris/MegaDetector/",
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
        logger.debug(f"Checking if service '{service_name}' is running")
        containers = client.containers.list(filters={'label': f'com.docker.compose.service={service_name}'})
        logger.debug(f"Found {len(containers)} containers for service '{service_name}'")
        
        for container in containers:
            logger.debug(f"Container {container.name} status: {container.status}")
        
        is_running = any(container.status == 'running' for container in containers)
        logger.debug(f"Service '{service_name}' running status: {is_running}")
        return is_running
    except Exception as e:
        logger.error(f"Error checking container status for service '{service_name}': {e}")
        return False

def is_server_ready(url, timeout=5):
    try:
        response = requests.get(url, timeout=timeout)
        return response.status_code == 200
    except requests.RequestException as e:
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