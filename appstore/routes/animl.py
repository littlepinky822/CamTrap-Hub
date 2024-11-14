from flask import Blueprint, jsonify
from appstore.utils import get_app_metadata, is_container_running, is_container_running_by_name, is_server_ready, is_container_exist
from appstore import app
import subprocess
import docker
import time

bp = Blueprint('animl', __name__, url_prefix='/animl')

@bp.route('/start', methods=['POST'])
def start_animl():
    response, status_code = start_animl_endpoint()
    if status_code != 202:
        return response, status_code

    max_retries = 60
    retries = 0
    internal_url = "http://animl-container:5173/"  # for Docker
    external_url = "http://localhost:5173/"  # This is the URL that the frontend will use
    while retries < max_retries:
        if is_container_running_by_name('animl-container'):
            if is_server_ready(external_url):
                return jsonify({'status': 'running', 'url': external_url}), 200
        time.sleep(5)
        retries += 1

    return jsonify({'error': 'Failed to start Animl', 'status': 'timeout'}), 500

def start_animl_endpoint():
    client = docker.from_env()
    app_metadata = get_app_metadata('Animl')

    try:
        container = client.containers.get('animl-container')
        if container.status != 'running':
            container.start()
        print("Started existing animl-container")
    except docker.errors.NotFound:
        print("No existing animl-container found, creating new one")
        # Login to GitLab container registry
        client.login(
            username=app.config['GITLAB_REGISTRY_USERNAME'],
            password=app.config['GITLAB_ACCESS_TOKEN'],
            registry=app.config['GITLAB_REGISTRY_URL']
        )

        # Pull the latest image
        image = client.images.pull(app_metadata['docker_image'])

        # Run the image
        container = client.containers.run(
            image.id,
            name='animl-container',
            ports={'5173/tcp': 5173},
            detach=True,
            network='appstore_network'
        )

    # Ensure the container is connected to the appstore_network
    appstore_network = client.networks.get('appstore_network')
    try:
        appstore_network.connect(container)
    except docker.errors.APIError as e:
        if 'already exists' not in str(e):
            raise

    return jsonify({'message': 'Animl started', 'container_id': container.id}), 202
