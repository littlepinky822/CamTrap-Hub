from flask import Blueprint, jsonify
from appstore.utils import is_container_running, is_server_ready, get_app_metadata
import subprocess
import time
import docker
import git
import os
import shutil
import logging
import socket
from pathlib import Path

bp = Blueprint('trapper', __name__, url_prefix='/trapper')

# Set up logging at the beginning of your script
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@bp.route('/start', methods=['POST'])
def start_trapper():
    internal_url = "http://trapper:8000/"
    external_url = "http://localhost:8000/"
    if is_server_ready(internal_url) or is_container_running('trapper'):
        return jsonify({'status': 'running', 'url': external_url}), 200
    
    print("Starting Trapper")
    start_trapper_endpoint()

    max_retries = 60
    retries = 0
    while retries < max_retries:
        if is_container_running('trapper') and is_server_ready(internal_url):
            return jsonify({'status': 'running', 'url': external_url}), 200
        time.sleep(5)
        retries += 1

    return jsonify({'error': 'Failed to start Trapper', 'status': 'timeout'}), 500

def start_trapper_endpoint():
    client = docker.from_env()
    app_metadata = get_app_metadata("Trapper")
    trapper_dir = Path('/app/appstore/repos/trapper')
    # trapper_dir = os.path.join(os.path.dirname(__file__), '..', 'repos', 'trapper') # for local testing
    logger.info(f"Trapper directory: {trapper_dir}")
    
    if not os.path.exists(trapper_dir):
        logger.error(f"Trapper directory not found: {trapper_dir}")
        return jsonify({'error': 'Trapper directory not found'}), 500
    
    os.chdir(trapper_dir)
    
    # Ensure .env file exists
    if not os.path.exists(".env"):
        if os.path.exists("trapper.env"):
            shutil.copy("trapper.env", ".env")
            logger.info("Created .env file from trapper.env")
        else:
            logger.error("No .env or trapper.env file found")
            return jsonify({'error': 'No .env file found'}), 500
    
    # Build and start Trapper services
    command = app_metadata['start_command'].split()
    logger.info(f"Executing command: {' '.join(command)}")
    
    result = subprocess.run(command, cwd=trapper_dir, capture_output=True, text=True)
    
    logger.info(f"Command exit code: {result.returncode}")
    logger.info(f"Command stdout: {result.stdout}")
    logger.info(f"Command stderr: {result.stderr}")
    
    if result.returncode != 0:
        return jsonify({'error': 'Trapper start command failed', 'details': result.stderr}), 500
    
    return jsonify({'message': 'Trapper start initiated'}), 202

@bp.route('/logs', methods=['GET'])
def get_trapper_log():
    client = docker.from_env()
    container = client.containers.get('trapper')
    logs = container.logs(tail=100)
    with open('trapper.log', 'wb') as logFile:
        logFile.write(logs)
    return logs.decode('utf-8')
