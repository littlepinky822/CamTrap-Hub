from flask import Blueprint, jsonify, request, send_file
from werkzeug.utils import secure_filename
from appstore import app, s3_client
from appstore.utils import get_app_metadata, is_container_running_by_name, is_server_ready
import docker
import os
import tarfile
import io
import time
import zipfile

bp = Blueprint("il2bb", __name__, url_prefix="/il2bb")
client = docker.from_env()
BUCKET_NAME = app.config['S3_BUCKET_NAME']
S3_FOLDER = 'uploads'

@bp.route("/start", methods=["GET", "POST"])
def start_l2bb():
    start_il2bb_endpoint()

    max_retries = 60
    retries = 0
    # il2bb_url = "http://127.0.0.1:3001/il2bb"
    while retries < max_retries:
        if is_container_running_by_name('il2bb-container'):
            return jsonify({'status': 'running'}), 200
        time.sleep(5)
        retries += 1

    return jsonify({'error': 'Failed to start IL2BB', 'status': 'timeout'}), 500

def start_il2bb_endpoint():
    app_metadata = get_app_metadata("IL2BB")

    try:
        container = client.containers.get("il2bb-container")
        if container.status != "running":
            container.start()
        print("Started existing il2bb-container")
    except docker.errors.NotFound:
        print("No existing il2bb-container found, creating a new one")
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
            name='il2bb-container',
            detach=True
        )

    return jsonify({"message": "IL2BB started", "container_id": container.id}), 202

@bp.route("/upload", methods=["POST"])
def upload_il2bb():
    container = client.containers.get("il2bb-container")
    img_src_path = os.path.join(os.path.dirname(__file__), '..', app.config['IL2BB_UPLOAD_FOLDER'])
    img_dest_path = '/app/data/images'
    mapping_src_path = os.path.join(os.path.dirname(__file__), '..', app.config['IL2BB_MAIN_FOLDER'])
    mapping_dest_path = '/app/data'

    # Save mapping CSV file to local directory
    mappingCsv = request.files.get('mappingFile')
    mappingCsvFilename = None
    if mappingCsv and mappingCsv.filename != '':
        mappingCsvFilename = secure_filename(mappingCsv.filename)
        mappingCsv.save(os.path.join(mapping_src_path, mappingCsvFilename))

    # Save image files to local directory
    uploaded_images = []
    image_paths = request.form.getlist('images')
    for s3_path in image_paths:
        try:
            # Extract the filename from the S3 path
            filename = os.path.basename(s3_path)
            local_file_path = os.path.join(img_src_path, filename)
            print("Local file path: ", local_file_path)
            
            # Download the file from S3
            s3_client.download_file(BUCKET_NAME, s3_path, local_file_path)
            
            if os.path.exists(local_file_path):
                uploaded_images.append(filename)
            else:
                return jsonify({"status": "error", "message": f"Failed to download {filename} from S3"})
        except Exception as e:
            return jsonify({"status": "error", "message": f"Error processing {s3_path}: {str(e)}"})
    
    if len(uploaded_images) == len(image_paths):
        print("Images downloaded from S3")
    else:
        print("Some images failed to download from S3. Files: ", uploaded_images)
    
    # Create a tar archive of the uploaded files
    tar_stream = io.BytesIO()
    with tarfile.open(fileobj=tar_stream, mode='w') as tar:
        for filename in os.listdir(img_src_path):
            tar.add(os.path.join(img_src_path, filename), arcname=filename)
    tar_stream.seek(0)

    tar_stream_2 = io.BytesIO()
    with tarfile.open(fileobj=tar_stream_2, mode='w') as tar:
        tar.add(os.path.join(mapping_src_path, mappingCsvFilename), arcname=mappingCsvFilename)
    tar_stream_2.seek(0)
    
    # Copy the tar archive to the container
    container.put_archive(img_dest_path, tar_stream)
    container.put_archive(mapping_dest_path, tar_stream_2)
    return jsonify({
        "status": "success",
        "message": "Images and mapping CSV file uploaded",
        }), 202

@bp.route("/trigger_stage1", methods=["POST"])
def trigger_stage1():
    # Stage 1: Create images batches
    labelMap = request.get_data(as_text=True) # get filename

    container = client.containers.get("il2bb-container")

    stage1_result = container.exec_run("python stage1_batch.py ./data/" + labelMap + " ./data/images ./data/batches")
    print(f"Stage 1 result: {stage1_result.output.decode('utf-8')}")

    # Check if the stage1_batch.py script has finished and batches created
    max_wait_time = 60
    start_time = time.time()
    while time.time() - start_time < max_wait_time:
        try:
            batch_content = container.exec_run("ls ./data/batches/batch_001")
            if batch_content.exit_code == 0 and batch_content.output:
                print("Stage 1 completed, now starting Stage 2")
                # trigger_stage2()
                return jsonify({'status': 'success', 'message': 'Stage 1 completed.'}), 202
        except docker.errors.NotFound:
            time.sleep(2)
    
    return jsonify({'status': 'error', 'message': 'Failed to trigger Stage 1.'}), 500

@bp.route("/trigger_stage2", methods=["POST"])
def trigger_stage2():
    # Stage 2: Create bounding boxes
    # sample command: python ../stage2_gen_bbox.py batches/batch_001/
    container = client.containers.get("il2bb-container")
    stage2_result = container.exec_run("python stage2_gen_bbox.py ./data/batches/batch_001/")
    print(f"Stage 2 result: {stage2_result.output.decode('utf-8')}")

    max_wait_time = 180
    start_time = time.time()
    while time.time() - start_time < max_wait_time:
        try:
            # output = container.get_archive("./data/batches/batch_001/batch_001_il2bb.bbx")
            output = container.exec_run("ls -l ./data/batches/batch_001")
            if 'batch_001_il2bb.bbx' in output.output.decode('utf-8'):
                return jsonify({'status': 'success', 'message': 'Stage 2 completed.'}), 202
        except docker.errors.NotFound:
            time.sleep(2)
    
    return jsonify({'status': 'error', 'message': 'Failed to trigger Stage 2.'}), 202

@bp.route("/download", methods=["GET"])
def download():
    container = client.containers.get("il2bb-container")
    target_path = "/app/data/batches/batch_001"

    memory_file = io.BytesIO()
    with zipfile.ZipFile(memory_file, 'w') as zip_file:
        exec_result = container.exec_run(f"find {target_path} -type f")
        if exec_result.exit_code != 0:
            return jsonify({'error': 'Failed to list files in the container'}), 500
        
        files = exec_result.output.decode('utf-8').split('\n')
        print(f"Files found: {files}")  # Debug print

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
        download_name='IL2BB_batch_result.zip'
    ), 202