from flask import Blueprint, request, render_template, jsonify, send_file, send_from_directory, current_app
from appstore import app, s3_client
from megadetector.detection.run_detector_batch import load_and_run_detector_batch, write_results_to_file
from megadetector.postprocessing.postprocess_batch_results import process_batch_results, PostProcessingOptions
from megadetector.utils import path_utils
import os
import subprocess

bp = Blueprint('megadetector', __name__, url_prefix='/megadetector')
BUCKET_NAME = app.config['S3_BUCKET_NAME']
S3_FOLDER = 'uploads'

@bp.route('/upload', methods=['POST'])
def megadetector_upload():
    if not request.form:
        return jsonify({'error': 'Missing required files'}), 400
    
    image_paths = request.form.getlist('image')
    upload_folder = os.path.join(os.path.dirname(__file__), '..', app.config['MEGADETECTOR_UPLOAD_FOLDER'])
    
    uploaded_files = []
    for s3_path in image_paths:
        try:
            # Extract the filename from the S3 path
            filename = os.path.basename(s3_path)
            local_file_path = os.path.join(upload_folder, filename)
            print("Local file path: ", local_file_path)
            
            # Download the file from S3
            s3_client.download_file(BUCKET_NAME, s3_path, local_file_path)
            
            if os.path.exists(local_file_path):
                uploaded_files.append(filename)
            else:
                return jsonify({"status": "error", "message": f"Failed to download {filename} from S3"})
        except Exception as e:
            return jsonify({"status": "error", "message": f"Error processing {s3_path}: {str(e)}"})
    
    if len(uploaded_files) == len(image_paths):
        return jsonify({"status": "success", "message": "Images downloaded from S3", "files": uploaded_files})
    else:
        return jsonify({"status": "partial_success", "message": "Some images failed to download from S3", "files": uploaded_files})

@bp.route('/run/batch', methods=['POST'])
def megadetector_run_batch():
    # Pick a folder to run MD on recursively, and an output file
    image_folder = os.path.join(os.path.dirname(__file__), '..', app.config['MEGADETECTOR_UPLOAD_FOLDER'])
    output_file = os.path.join(os.path.dirname(__file__), '..', app.config['MEGADETECTOR_MAIN_FOLDER'], 'output.json')
    model = request.form.get('model')
    print("Model: ", model)

    # Install TensorFlow using pip if the model is MDV4 - may break things now
    if model == 'MDV4':
        subprocess.check_call([os.sys.executable, '-m', 'pip', 'install', 'tensorflow'])

    image_file_names = path_utils.find_images(image_folder, recursive=True)

    # Run the detector
    results = load_and_run_detector_batch(model, image_file_names)
    write_results_to_file(results,
                        output_file,
                        relative_path_base=image_folder)

    # Postprocess the results into a HTML report
    postprocess_results(output_file, image_folder)

    return jsonify({"status": "success", "message": "Batch processing completed"})

def postprocess_results(output_file, image_folder):
    # Setup options
    options = PostProcessingOptions()
    options.md_results_file = output_file
    options.image_base_dir = image_folder
    options.output_dir = os.path.join(os.path.dirname(__file__), '..', 'templates', 'megadetector-results')

    # Run the postprocessing and generate a HTML report
    process_batch_results(options)

@bp.route('/report')
def megadetector_report():
    # return render_template('megadetector-results/index.html')
    with open(os.path.join(current_app.root_path, 'templates', 'megadetector-results', 'index.html'), 'r') as file:
        html_content = file.read()
    return jsonify({"html_content": html_content})

@bp.route('/detections_animal.html')
def megadetector_detections_animal_report():
    # return render_template('megadetector-results/detections_animal.html')
    with open(os.path.join(current_app.root_path, 'templates', 'megadetector-results', 'detections_animal.html'), 'r') as file:
        html_content = file.read()
    return jsonify({"html_content": html_content})

@bp.route('/detections_animal/<path:filename>')
def serve_detections_animal(filename):
    # Serve from the templates directory
    return send_from_directory(os.path.join(current_app.root_path, 'templates', 'megadetector-results', 'detections_animal'), filename)

@bp.route('/static/megadetector/images/<path:filename>')
def serve_megadetector_images(filename):
    # Serve from the static directory
    return send_from_directory(os.path.join(current_app.root_path, 'static', 'megadetector', 'images'), filename)

@bp.route('/Users/<path:filepath>')
def serve_user_files(filepath):
    # This route handles the absolute paths in the HTML
    if 'static' in filepath:
        relative_path = filepath.split('static/')[-1]
        return send_from_directory(os.path.join(current_app.root_path, 'static'), relative_path)
    elif 'templates' in filepath:
        relative_path = filepath.split('templates/')[-1]
        return send_from_directory(os.path.join(current_app.root_path, 'templates'), relative_path)
    return "File not found", 404