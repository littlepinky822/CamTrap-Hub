from flask import Blueprint, jsonify, send_file, request
from appstore import app, s3_client
from appstore.utils import get_app_metadata, is_container_running_by_name
import docker
import io
import tarfile
import zipfile
import os
import time
from botocore.exceptions import ClientError

bp = Blueprint('wildCoFaceBlur', __name__, url_prefix='/wildCoFaceBlur')
client = docker.from_env()

@bp.route('/start', methods=['POST'])
def start():
    start_wildcofaceblur_endpoint()
    max_retries = 120
    retries = 0
    while retries < max_retries:
        if is_container_running_by_name('wildco-faceblur-container'):
            return jsonify({'status': 'running'}), 200
        time.sleep(5)
        retries += 1

    return jsonify({'error': 'Failed to start WildCo-FaceBlur', 'status': 'timeout'}), 500

def start_wildcofaceblur_endpoint():
    app_metadata = get_app_metadata("WildCoFaceBlur")

    try:
        container = client.containers.get("wildco-faceblur-container")
        if container.status != "running":
            container.start()
        print("Started existing wildco-faceblur-container")
    except docker.errors.NotFound:
        print("No existing wildco-faceblur-container found, creating a new one")
        # Login to GitLab container registry
        client.login(
            username=app.config['GITLAB_REGISTRY_USERNAME'],
            password=app.config['GITLAB_ACCESS_TOKEN'],
            registry=app.config['GITLAB_REGISTRY_URL']
        )
        # Pull and run the latest image
        image = client.images.pull(app_metadata['docker_image'])
        container = client.containers.run(
            image.id,
            name='wildco-faceblur-container',
            detach=True
        )

    return jsonify({"message": "WildCo-FaceBlur started", "container_id": container.id}), 202

@bp.route('/trigger_script', methods=['POST'])
def trigger_script():
    data = request.json
    date_folders = data.get('dateFolders', 'false')
    blur_level = data.get('blurLevel', '7')
    conf_threshold = data.get('confThreshold', '0.25')

    container = client.containers.get("wildco-faceblur-container")
    command = container.exec_run(f"Rscript WildCoFaceBlur.R {date_folders} {blur_level} {conf_threshold}")
    result = command.output.decode('utf-8')
    print("result", result)
    return jsonify({"result": result, "message": "WildCo-FaceBlur script triggered"}), 202

@bp.route('/download', methods=['GET'])
def download():
    container = client.containers.get("wildco-faceblur-container")
    target_path = "/app/output"

    memory_file = io.BytesIO()
    with zipfile.ZipFile(memory_file, 'w') as zip_file:
        exec_result = container.exec_run(f"find {target_path} -type f")
        if exec_result.exit_code != 0:
            return jsonify({'error': 'Failed to list files in the container'}), 500
        
        files = exec_result.output.decode('utf-8').split('\n')

        for file_path in files:
            if file_path.strip():
                try:
                    file_data, _ = container.get_archive(file_path)
                    file_content = io.BytesIO()
                    for chunk in file_data:
                        file_content.write(chunk)
                    file_content.seek(0)

                    # add file to zip
                    zip_file.writestr(file_path.replace(f"{target_path}/", ""), file_content.getvalue())
                except docker.errors.NotFound:
                    print(f"File not found in the container: {file_path}")
                except docker.errors.APIError as e:
                    print(f"API error getting archive for {file_path}: {str(e)}")

    memory_file.seek(0)

    return send_file(
        memory_file,
        mimetype="application/zip",
        as_attachment=True,
        download_name='WildCoFaceBlur_output.zip'
    ), 202

@bp.route('/upload', methods=['POST'])
def upload():
    if not request.form or not request.files:
        return jsonify({'error': 'Missing required files'}), 400
    print("Form data:", request.form)
    print("Files:", request.files)

    container = client.containers.get("wildco-faceblur-container")
    bucket_name = app.config['S3_BUCKET_NAME']
    s3_folder = 'uploads'
    megadetector_file = request.files.get('megadetector-file')

    if 'folders' in request.form:
        folder_paths = request.form.getlist('folders')
        for folder_path in folder_paths:
            print('folder path: ', folder_path)
            
            # Create a in-memory tar archive
            tar_buffer = io.BytesIO()
            with tarfile.open(fileobj=tar_buffer, mode='w') as tar:
                try:
                    # List objects in the S3 folder
                    s3_objects = s3_client.list_objects_v2(Bucket=bucket_name, Prefix=f"{s3_folder}/{folder_path}/")
                    
                    for obj in s3_objects.get('Contents', []):
                        file_key = obj['Key']
                        file_name = os.path.relpath(file_key, f"{s3_folder}/{folder_path}")
                        
                        # Create a file-like object for the S3 file
                        file_obj = io.BytesIO()
                        s3_client.download_fileobj(bucket_name, file_key, file_obj)
                        file_obj.seek(0)
                        
                        # Add file to tar archive
                        info = tarfile.TarInfo(name=file_name)
                        info.size = len(file_obj.getvalue())
                        tar.addfile(info, file_obj)

                        # Debug print
                        print(f"Added to tar archive: {file_name}")

                    # After the loop, print out what's been saved to docker
                    print("Files saved to Docker:")
                    for member in tar.getmembers():
                        print(f" - {member.name}")
                
                except ClientError as e:
                    print(f"Error accessing S3: {e}")
                    return jsonify({'error': 'Failed to access S3'}), 500

            # Reset buffer to the beginning
            tar_buffer.seek(0)
            
            # Stream the tar archive to Docker
            container.exec_run(f"mkdir -p /app/input/{folder_path}")
            container.put_archive(f"/app/input/{folder_path}", tar_buffer.getvalue())

    if megadetector_file:
        # Create a file-like object for the megadetector file
        megadetector_buffer = io.BytesIO(megadetector_file.read())
        megadetector_buffer.seek(0)
        
        # Create a tar archive for the megadetector file
        tar_buffer = io.BytesIO()
        with tarfile.open(fileobj=tar_buffer, mode='w') as tar:
            info = tarfile.TarInfo(name=megadetector_file.filename)
            info.size = len(megadetector_buffer.getvalue())
            tar.addfile(info, megadetector_buffer)
        
        # Reset buffer to the beginning
        tar_buffer.seek(0)
        
        # Stream the tar archive to Docker
        if folder_paths:
            first_folder = folder_paths[0]
            container.put_archive(f"/app/input/{first_folder}", tar_buffer.getvalue())
            print(f"Megadetector file saved to Docker in folder: {first_folder}")
        else:
            container.put_archive('/app/input', tar_buffer.getvalue())
            print("Megadetector file saved to Docker in root input folder")

    return jsonify({'message': 'Uploaded files'}), 202