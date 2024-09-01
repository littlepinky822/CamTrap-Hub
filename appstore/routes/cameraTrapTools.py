from flask import Blueprint, jsonify, request, send_file
from appstore.utils import get_app_metadata, is_container_running_by_name
from appstore import app
import docker
import os
import tarfile
import io
import time
import zipfile

bp = Blueprint("camera_trap_tools", __name__, url_prefix="/camera-trap-tools")
client = docker.from_env()

@bp.route("/start", methods=["GET", "POST"])
def start_camera_trap_tools():
    start_camera_trap_tools_endpoint()

    max_retries = 120
    retries = 0
    while retries < max_retries:
        if is_container_running_by_name('camera-trap-tools-container'):
            return jsonify({'status': 'running'}), 200
        time.sleep(5)
        retries += 1

    return jsonify({'error': 'Failed to start Camera Trap Tools', 'status': 'timeout'}), 500

def start_camera_trap_tools_endpoint():
    app_metadata = get_app_metadata("CameraTrapTools")

    try:
        container = client.containers.get("camera-trap-tools-container")
        if container.status != "running":
            container.start()
        print("Started existing camera-trap-tools-container")
    except docker.errors.NotFound:
        print("No existing camera-trap-tools-container found, creating a new one")
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
            name='camera-trap-tools-container',
            detach=True
        )

    return jsonify({"message": "Camera Trap Tools started", "container_id": container.id}), 202

@bp.route("/autocopy/upload", methods=["POST"])
def autocopy_upload():
    # example: python3 autocopy.py -c example_data/example.config
    container = client.containers.get("camera-trap-tools-container")
    img_src_path = os.path.join(os.path.dirname(__file__), '..', app.config['CAMERA_TRAP_TOOLS_UPLOAD_FOLDER'])
    img_dest_path = '/app/data/SD_Card_Images'

    # Save image files to local directory
    images = request.files.getlist('image-files')
    for image in images:
        image.save(os.path.join(img_src_path, image.filename))

    # Copy local files to container
    tar_stream = io.BytesIO()
    with tarfile.open(fileobj=tar_stream, mode='w') as tar:
        for filename in os.listdir(img_src_path):
            tar.add(os.path.join(img_src_path, filename), arcname=filename)
    tar_stream.seek(0)

    # Check if the directory exists in the container
    check_dir = container.exec_run(f"test -d {img_dest_path}")
    if check_dir.exit_code != 0:
        container.exec_run(f"mkdir -p {img_dest_path}")
    
    # Now we can safely put the archive in the directory
    container.put_archive(img_dest_path, tar_stream)

    return jsonify({
        "status": "success",
        "messgae": "Images uploaded"
    }), 202

@bp.route("/autocopy/process", methods=["POST"])
def autocopy_process():
    # use default config file (autocopy.config)
    container = client.containers.get("camera-trap-tools-container")
    animal_detection = request.json.get('animalDetection', False)
    if animal_detection:
        container.exec_run("python3 autocopy.py -c autocopy_detect.config")
    else:
        container.exec_run("python3 autocopy.py")
    print("Autocopy triggered")

    max_wait_time = 60
    start_time = time.time()
    while time.time() - start_time < max_wait_time:
        try:
            log_file = container.exec_run("cat /app/data/autocopy_errors.log")
            raw_img_folder = container.exec_run("ls /app/data/RawImages")
            if log_file.exit_code == 0 and raw_img_folder.exit_code == 0 and raw_img_folder.output:
                print("Autocopy completed successfully")
                return jsonify({"status": "success", "message": "Autocopy completed successfully", "log": log_file.output.decode('utf-8')}), 202
        except docker.errors.NotFound:
            pass
        time.sleep(2)
    
    print("Autocopy failed or timed out")
    return jsonify({"status": "error", "message": "Autocopy failed or timed out"}), 500

@bp.route("/create-video", methods=["POST"])
def create_video():
    container = client.containers.get("camera-trap-tools-container")
    container.exec_run("python3 create_video.py -f -c autocopy.config")
    print("Video creation triggered")

    max_wait_time = 60
    start_time = time.time()
    while time.time() - start_time < max_wait_time:
        try:
            video_folder = container.exec_run("ls /app/data/Video")
            if video_folder.exit_code == 0 and video_folder.output:
                print("Videos created successfully")
                return jsonify({"status": "success", "message": "Videos created successfully"}), 202
        except docker.errors.NotFound:
            pass
        time.sleep(2)
    
    print("Video creation failed or timed out")
    return jsonify({"status": "error", "message": "Video creation failed or timed out"}), 500

@bp.route("/create-annotation", methods=["POST"])
def create_annotation():
    container = client.containers.get("camera-trap-tools-container")
    container.exec_run("python3 create_annotations.py -c autocopy_detect.config")
    print("Craeting annotation")

    max_wait_time = 60
    start_time = time.time()
    while time.time() - start_time < max_wait_time:
        try:
            annotations_folder = container.exec_run("ls /app/data/Annotations")
            if annotations_folder.exit_code == 0 and annotations_folder.output:
                print("Annotation created successfully")
                return jsonify({"status": "success", "message": "Annotation created successfully"}), 202
        except docker.errors.NotFound:
            pass
        time.sleep(2)
    
    print("Annotation creation failed or timed out")
    return jsonify({"status": "error", "message": "Annotation creation failed or timed out"}), 500

@bp.route("/create-annotation/report", methods=["POST"])
def annotation_report():
    container = client.containers.get("camera-trap-tools-container")
    result = container.exec_run("python3 annotation_report.py -c autocopy_detect.config -o data/annotation_report.csv")
    if result.exit_code != 0:
        return jsonify({"status": "error", "message": "Annotation report creation failed"}), 500
    print("Annotation report created")
    return jsonify({"status": "success", "message": "Annotation report created successfully"}), 202

@bp.route("/capture-report", methods=["POST"])
def capture_report():
    form_data = request.form
    month = form_data.get("capture-report-month")
    container = client.containers.get("camera-trap-tools-container")
    result = container.exec_run(f"python3 capture_report.py -c autocopy_detect.config -m {month}")
    if result.exit_code != 0:
        return jsonify({"status": "error", "message": "Capture report creation failed"}), 500
    print("Capture report created")
    return jsonify({"status": "success", "message": "Capture report created successfully"}), 202


# Download results - needs tidy up
@bp.route("/autocopy/download", methods=["GET"])
def autocopy_download():
    container = client.containers.get("camera-trap-tools-container")
    target_path = "/app/data"

    memory_file = io.BytesIO()
    with zipfile.ZipFile(memory_file, 'w') as zip_file:
        find_files = container.exec_run(f"find {target_path} -type f -not -path '*/SD_Card_Images/*'")
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
        download_name='CameraTrapTools_autocopy_result.zip'
    ), 202

@bp.route("/create-video/download", methods=["GET"])
def create_video_download():
    container = client.containers.get("camera-trap-tools-container")
    target_path = "/app/data/Video"

    memory_file = io.BytesIO()
    with zipfile.ZipFile(memory_file, 'w') as zip_file:
        find_video = container.exec_run(f"find {target_path} -type f")
        if find_video.exit_code != 0:
            return jsonify({'error': 'Failed to list files in the container'}), 500

        files = find_video.output.decode('utf-8').split('\n')
        print(f"Videos found: {files}")

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
        download_name='CameraTrapTools_createvideos_result.zip'
    ), 202

@bp.route("/create-annotation/download", methods=["GET"])
def create_annotation_download():
    container = client.containers.get("camera-trap-tools-container")
    target_path = "/app/data/Annotations"

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
        download_name='CameraTrapTools_annotation_files.zip'
    ), 202

@bp.route("/create-annotation/report/download", methods=["GET"])
def annotation_report_download():
    container = client.containers.get("camera-trap-tools-container")

    memory_file = io.BytesIO()
    try:
        report_content, _ = container.get_archive("/app/data/annotation_report.csv")
        for chunk in report_content:
            memory_file.write(chunk)
    except docker.errors.NotFound:
        return jsonify({'error': 'File not found in the container'}), 404
    except docker.errors.APIError as e:
        return jsonify({'error': f'API error: {str(e)}'}), 500

    memory_file.seek(0)
    
    return send_file(
        memory_file,
        mimetype="text/csv",
        as_attachment=True,
        download_name='CameraTrapTools_annotation_report.csv'
    ), 202

@bp.route("/capture-report/download", methods=["POST"])
def capture_report_download():
    container = client.containers.get("camera-trap-tools-container")
    month = request.json['capture-report-month']
    print(f"Downloading capture report for {month}")
    memory_file = io.BytesIO()
    try:
        report_content, _ = container.get_archive(f"/app/capture_report_{month}.csv")
        for chunk in report_content:
            memory_file.write(chunk)
    except docker.errors.NotFound:
        return jsonify({'error': 'File not found in the container'}), 404
    except docker.errors.APIError as e:
        return jsonify({'error': f'API error: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500

    memory_file.seek(0)

    return send_file(
        memory_file,
        mimetype="text/csv",
        as_attachment=True,
        download_name=f'CameraTrapTools_capture_report_{month}.csv'
    ), 202