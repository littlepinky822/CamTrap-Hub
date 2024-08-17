from flask import Blueprint, jsonify
from appstore.utils import is_container_running, is_server_ready, get_app_metadata
import subprocess
import time
import docker
import git
import os
import shutil

bp = Blueprint('trapper', __name__, url_prefix='/trapper')

@bp.route('/start', methods=['POST'])
def start_trapper():
    start_trapper_endpoint()

    max_retries = 60
    retries = 0
    trapper_url = "http://0.0.0.0:8000/"
    while retries < max_retries:
        if is_container_running('trapper') and is_server_ready(trapper_url):
            return jsonify({'status': 'running', 'url': trapper_url}), 200
        time.sleep(5)
        retries += 1

    return jsonify({'error': 'Failed to start Trapper', 'status': 'timeout'}), 500

def start_trapper_endpoint():
    app_metadata = get_app_metadata("Trapper")
    repo_dir = f"/tmp/trapper"
    
    try:
        # clone the repository if doesn't exist
        print("Checking if repository exists")
        if not os.path.exists(repo_dir):
            print("Cloning repository")
            git.Repo.clone_from(app_metadata["repository_url"], repo_dir)
        print("Repository eixsts: ", repo_dir)
        os.chdir(repo_dir)

        # Check if .env file exists
        # TODO: amend Dockerfile.dev (add -o to line 53)
        if not os.path.exists(".env"):
            if os.path.exists("trapper.env"):
                shutil.copy("trapper.env", ".env")
                print("Created .env file from trapper.env")
            else:
                print("No trapper.env file found")
                return False
        else:
            print(".env file already exists")

        # Run the start command
        print("Current directory:", os.getcwd())
        command = app_metadata["start_command"].split()  # Split the command into a list
        print(f"Executing command: {' '.join(command)}")
        result = subprocess.Popen(command, cwd=repo_dir, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        print(f"Command exit code: {result.returncode}")
        print(f"Command stdout: {result.stdout}")
        print(f"Command stderr: {result.stderr}")
        
        if result.returncode != 0:
            return jsonify({'error': 'Trapper start command failed', 'details': result.stderr}), 500
        
        return jsonify({'message': 'Trapper start initiated'}), 202
    except Exception as e:
        print(f"Exception occurred: {str(e)}")
        return jsonify({'error': 'Failed to start Trapper', 'details': str(e)}), 500

@bp.route('/logs', methods=['GET'])
def get_trapper_log():
    client = docker.from_env()
    container = client.containers.get('trapper')
    logs = container.logs(tail=100)
    with open('trapper.log', 'wb') as logFile:
        logFile.write(logs)
    return logs.decode('utf-8')