from flask import Blueprint, jsonify, send_file, request
from appstore.utils import get_app_metadata, is_container_running_by_name
from appstore import app, s3_client
import docker
import io
import zipfile
import tarfile
import os
from botocore.exceptions import ClientError
import requests
import time

bp = Blueprint("camera_trap_workflow", __name__, url_prefix="/camera-trap-workflow")
client = docker.from_env()
BUCKET_NAME = app.config['S3_BUCKET_NAME']
S3_FOLDER = 'uploads'

@bp.route("/start", methods=["GET", "POST"])
def start():
    start_camera_trap_workflow_endpoint()
    max_retries = 120
    retries = 0
    while retries < max_retries:
        if is_container_running_by_name('camera-trap-workflow-container'):
            return jsonify({'status': 'running'}), 200
        time.sleep(5)
        retries += 1

    return jsonify({'error': 'Failed to start Camera Trap Workflow', 'status': 'timeout'}), 500

def start_camera_trap_workflow_endpoint():
    app_metadata = get_app_metadata("CameraTrapWorkflow")

    try:
        container = client.containers.get("camera-trap-workflow-container")
        if container.status != "running":
            container.start()
        print("Started existing camera-trap-workflow-container")
    except docker.errors.NotFound:
        print("No existing camera-trap-workflow-container found, creating a new one")
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
            name='camera-trap-workflow-container',
            ports={'3838/tcp': 3838},
            detach=True
        )

    return jsonify({"message": "Camera Trap Workflow started", "container_id": container.id}), 202

@bp.route("/upload", methods=["POST"])
def upload():
    container = client.containers.get("camera-trap-workflow-container")
    img_dest_path = '/app/data/raw_images'

    folder_paths = request.form.getlist('images')
    for folder_path in folder_paths:
        print('folder path: ', folder_path)
        
        # Create a in-memory tar archive
        tar_buffer = io.BytesIO()
        with tarfile.open(fileobj=tar_buffer, mode='w') as tar:
            try:
                # List objects in the S3 folder
                s3_objects = s3_client.list_objects_v2(Bucket=BUCKET_NAME, Prefix=f"{S3_FOLDER}/{folder_path}/")
                
                for obj in s3_objects.get('Contents', []):
                    file_key = obj['Key']
                    file_name = os.path.relpath(file_key, f"{S3_FOLDER}/{folder_path}")
                    
                    # Create a file-like object for the S3 file
                    file_obj = io.BytesIO()
                    s3_client.download_fileobj(BUCKET_NAME, file_key, file_obj)
                    file_obj.seek(0)
                    
                    # Add file to tar archive
                    info = tarfile.TarInfo(name=file_name)
                    info.size = len(file_obj.getvalue())
                    tar.addfile(info, file_obj)

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
        container.exec_run(f"mkdir -p {img_dest_path}/{folder_path}")
        container.put_archive(f"{img_dest_path}/{folder_path}", tar_buffer.getvalue())

    return jsonify({"message": "Upload completed"}), 200


@bp.route("/extract-metadata/process", methods=["POST"])
def extract_metadata():
    # OUTPUT: metadata file per site in metadata folder; renamed images in images_renamed folder
    container = client.containers.get("camera-trap-workflow-container")
    result = container.exec_run("Rscript /app/R/01_extract_metadata_rename_images.R")
    return jsonify({
        "status": "success" if result.exit_code == 0 else "error",
        "message": "Metadata extraction completed" if result.exit_code == 0 else "Metadata extraction failed",
        "output": result.output.decode('utf-8')
    }), 200 if result.exit_code == 0 else 500

@bp.route("/extract-metadata/download", methods=["GET"])
def download_metadata():
    container = client.containers.get("camera-trap-workflow-container")
    metadata_path = "/app/data/metadata"
    renamed_path = "/app/data/images_renamed"

    memory_file = io.BytesIO()
    with zipfile.ZipFile(memory_file, 'w') as zip_file:
        find_metadata = container.exec_run(f"find {metadata_path} -type f")
        find_renamed = container.exec_run(f"find {renamed_path} -type f")
        if find_metadata.exit_code != 0 or find_renamed.exit_code != 0:
            return jsonify({'error': 'Failed to list files in the container'}), 500

        metadata_files = find_metadata.output.decode('utf-8').split('\n')
        renamed_files = find_renamed.output.decode('utf-8').split('\n')
        print(f"Metadata files found: {metadata_files}")
        print(f"Renamed files found: {renamed_files}")

        for file_path in metadata_files + renamed_files:
            if file_path.strip():
                try:
                    file_data, _ = container.get_archive(file_path)
                    # Create a temporary BytesIO to hold the tar data
                    tar_data = io.BytesIO()
                    for chunk in file_data:
                        tar_data.write(chunk)
                    tar_data.seek(0)

                    # Extract the file from the tar archive
                    with tarfile.open(fileobj=tar_data, mode='r') as tar:
                        member = tar.next()  # Get the first (and only) file
                        file_content = tar.extractfile(member).read()

                    # add file to zip with proper path
                    if file_path.startswith(metadata_path):
                        zip_path = f"metadata/{file_path.replace(f'{metadata_path}/', '')}"
                    else:
                        zip_path = f"images_renamed/{file_path.replace(f'{renamed_path}/', '')}"
                    zip_file.writestr(zip_path, file_content)

                except docker.errors.NotFound:
                    print(f"File not found in the container: {file_path}")
                except docker.errors.APIError as e:
                    print(f"API error getting archive for {file_path}: {str(e)}")
                except Exception as e:
                    print(f"Error processing file {file_path}: {str(e)}")
    memory_file.seek(0)

    return send_file(
        memory_file,
        mimetype="application/zip",
        as_attachment=True,
        download_name='CameraTrapWorkload_metadata_renamed.zip'
    ), 202

@bp.route("/auto-classify", methods=["POST"])
def auto_classify():
    # OUTPUT: automatic_classification folder
    container = client.containers.get("camera-trap-workflow-container")
    result = container.exec_run("Rscript /app/R/02_classify_images_automatically.R")
    return jsonify({
        "status": "success" if result.exit_code == 0 else "error",
        "message": "Automatic classification completed" if result.exit_code == 0 else "Automatic classification failed",
        "output": result.output.decode('utf-8')
    }), 200 if result.exit_code == 0 else 500

@bp.route("/auto-classify/download", methods=["GET"])
def download_auto_classify():
    container = client.containers.get("camera-trap-workflow-container")
    target_path = "/app/data/automatic_classification"

    memory_file = io.BytesIO()
    with zipfile.ZipFile(memory_file, 'w') as zip_file:
        find_files = container.exec_run(f"find {target_path} -type f")
        if find_files.exit_code != 0:
            return jsonify({'error': 'Failed to list files in the container'}), 500

        files = find_files.output.decode('utf-8').split('\n')
        print(f"Files found: {files}")

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
        download_name='CameraTrapWorkload_auto_classification.zip'
    ), 202

@bp.route("/quality-check", methods=["POST"])
def quality_check():
    # OUTPUT: A file with labels in quality_check folder
    container = client.containers.get("camera-trap-workflow-container")
    container.exec_run("Rscript /app/R/03_quality_check_app.R 3838")
    shiny_url = "http://0.0.0.0:3838"
    # Check if Shiny app is ready
    max_retries = 30
    retry_interval = 2
    for _ in range(max_retries):
        try:
            response = requests.get(shiny_url, timeout=5, verify=False)
            if response.status_code == 200:
                return jsonify({
                    "status": "success",
                    "message": "Quality check Shiny app is ready",
                    "shiny_url": shiny_url
                }), 200
        except requests.RequestException:
            pass
        time.sleep(retry_interval)
    # If we've exhausted all retries, return an error
    return jsonify({
        "status": "error",
        "message": "Failed to start Quality check Shiny app",
    }), 500

@bp.route("/quality-check/download", methods=["GET"])
def download_quality_check():
    container = client.containers.get("camera-trap-workflow-container")
    target_path = "/app/data/quality_check"

    memory_file = io.BytesIO()
    with zipfile.ZipFile(memory_file, 'w') as zip_file:
        find_files = container.exec_run(f"find {target_path} -type f")
        if find_files.exit_code != 0:
            return jsonify({'error': 'Failed to list files in the container'}), 500

        files = find_files.output.decode('utf-8').split('\n')
        print(f"Files found: {files}")

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
        download_name='CameraTrapWorkload_quality_check.zip'
    ), 202

@bp.route("/modal-evaluation", methods=["POST"])
def modal_evaluation():
    container = client.containers.get("camera-trap-workflow-container")
    result = container.exec_run("Rscript /app/R/04_model_evaluation.R")
    return jsonify({
        "status": "success" if result.exit_code == 0 else "error",
        "message": "Modal evaluation completed" if result.exit_code == 0 else "Modal evaluation failed",
        "output": result.output.decode('utf-8')
    }), 200 if result.exit_code == 0 else 500

@bp.route("/manual-classify", methods=["POST"])
def manual_classify():
    # OUTPUT: manual_classification folder
    container = client.containers.get("camera-trap-workflow-container")
    container.exec_run("Rscript /app/R/05_correct_model_labels_app.R 3838")
    shiny_url = "http://0.0.0.0:3838"
    # Check if Shiny app is ready
    max_retries = 30
    retry_interval = 2
    for _ in range(max_retries):
        try:
            response = requests.get(shiny_url, timeout=5, verify=False)
            if response.status_code == 200:
                return jsonify({
                    "status": "success",
                    "message": "Manual classification Shiny app is ready",
                    "shiny_url": shiny_url
                }), 200
        except requests.RequestException:
            pass
        time.sleep(retry_interval)
    return jsonify({
        "status": "error",
        "message": "Failed to start Manual classification Shiny app",
    }), 500

@bp.route("/formatting", methods=["POST"])
def formatting():
    # OUTPUT: formatted_data folder
    container = client.containers.get("camera-trap-workflow-container")
    result = container.exec_run("Rscript /app/R/06_format_final_data_file.R")
    return jsonify({
        "status": "success" if result.exit_code == 0 else "error",
        "message": "Final formatting completed" if result.exit_code == 0 else "Final formatting failed",
        "output": result.output.decode('utf-8')
    }), 200 if result.exit_code == 0 else 500

@bp.route("/formatting/download", methods=["GET"])
def download_formatting():
    container = client.containers.get("camera-trap-workflow-container")
    target_path = "/app/data/formatted_data"

    memory_file = io.BytesIO()
    with zipfile.ZipFile(memory_file, 'w') as zip_file:
        find_files = container.exec_run(f"find {target_path} -type f")
        if find_files.exit_code != 0:
            return jsonify({'error': 'Failed to list files in the container'}), 500

        files = find_files.output.decode('utf-8').split('\n')
        print(f"Files found: {files}")

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
        download_name='CameraTrapWorkload_final_formatting.zip'
    ), 202