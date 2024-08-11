from flask import Blueprint, jsonify
from appstore.utils import is_container_running, is_trapper_ready
import subprocess
import time
import docker

bp = Blueprint('trapper', __name__, url_prefix='/trapper')

@bp.route('/start', methods=['POST'])
def start_trapper():
    start_trapper_endpoint()

    max_retries = 60  # Increased to allow more time
    retries = 0
    trapper_url = "http://0.0.0.0:8000/"
    while retries < max_retries:
        if is_container_running('trapper') and is_trapper_ready(trapper_url):
            return jsonify({'status': 'running', 'url': trapper_url}), 200
        time.sleep(5)
        retries += 1

    return jsonify({'error': 'Failed to start Trapper', 'status': 'timeout'}), 500

def start_trapper_endpoint():
    trapper_start_path = '../trapper'
    command = ['./start.sh', '-pb', 'dev']

    try:
        # Start the process and do not wait for it to complete
        process = subprocess.Popen(command, cwd=trapper_start_path, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        return jsonify({'message': 'Trapper start initiated'}), 202
    except Exception as e:
        return jsonify({'error': 'Failed to start Trapper', 'details': str(e)}), 500

@bp.route('/logs', methods=['GET'])
def get_trapper_log():
    client = docker.from_env()
    container = client.containers.get('trapper')
    logs = container.logs(tail=100)
    with open('trapper.log', 'wb') as logFile:
        logFile.write(logs)
    return logs.decode('utf-8')