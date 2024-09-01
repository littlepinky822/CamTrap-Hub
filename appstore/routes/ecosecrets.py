from flask import Blueprint, jsonify
from appstore.utils import get_app_metadata, is_container_running, is_server_ready
import os
import git
import shutil
import subprocess
import time

bp = Blueprint('ecosecrets', __name__, url_prefix='/ecosecrets')

@bp.route('/start', methods=['GET', 'POST'])
def start_ecosecrets():
    start_ecosecrets_endpoint()

    max_retries = 100
    retries = 0
    ecosecrets_url = "http://localhost:8889/"
    while retries < max_retries:
        if is_container_running('traefik') and is_server_ready(ecosecrets_url):
            return jsonify({'status': 'running', 'url': ecosecrets_url}), 200
        time.sleep(5)
        retries += 1

    return jsonify({'status': 'timeout'}), 500

def start_ecosecrets_endpoint():
    app_metadata = get_app_metadata("EcoSecrets")
    repo_dir = os.path.join(os.path.dirname(__file__), '..', 'repos', 'ecosecrets')

    try:
        # clone the repository if doesn't exist
        if not os.path.exists(repo_dir):
            git.Repo.clone_from(app_metadata["repository_url"], repo_dir)
        os.chdir(repo_dir)

        # check if .env file exists
        if not os.path.exists("docker/.env"):
            if os.path.exists("docker/.env.sample"):
                shutil.copy("docker/.env.sample", "docker/.env")
                print("Created .env file from .env.sample")
            else:
                print("No .env.sample file found")
                return False
        else:
            print(".env file already exists")

        # run the start command
        command = app_metadata["start_command"].split()
        print(f"Executing command: {' '.join(command)}")
        result = subprocess.Popen(command, cwd=repo_dir, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        print(f"Command exit code: {result.returncode}")
        print(f"Command stdout: {result.stdout}")
        print(f"Command stderr: {result.stderr}")

        if result.returncode != 0:
            return jsonify({'error': 'EcoSecrets start command failed', 'details': result.stderr}), 500
        
        return jsonify({'message': 'EcoSecrets start initiated'}), 202

    except Exception as e:
        return jsonify({'error': 'Failed to start EcoSecrets', 'details': str(e)}), 500