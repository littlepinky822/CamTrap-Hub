from flask import Blueprint, request, render_template, jsonify, send_file, send_from_directory, current_app
from appstore import app
from megadetector.detection.run_detector_batch import load_and_run_detector_batch, write_results_to_file
from megadetector.postprocessing.postprocess_batch_results import process_batch_results, PostProcessingOptions
from megadetector.utils import path_utils
import os
import subprocess

bp = Blueprint('megadetector', __name__, url_prefix='/megadetector')

@bp.route('/upload', methods=['POST'])
def megadetector_upload():
    # images = request.files.getlist('image')
    images = request.form.getlist('image')
    for image in images:
        image.save(os.path.join(os.path.dirname(__file__), '..', app.config['MEGADETECTOR_UPLOAD_FOLDER'], image.filename))
    return jsonify({"status": "success", "message": "Images uploaded"})

@bp.route('/run/batch', methods=['POST'])
def megadetector_run_batch():
    # Pick a folder to run MD on recursively, and an output file
    image_folder = os.path.join(os.path.dirname(__file__), '..', app.config['MEGADETECTOR_UPLOAD_FOLDER'])
    output_file = os.path.join(os.path.dirname(__file__), '..', app.config['MEGADETECTOR_MAIN_FOLDER'], 'output.json')
    model = request.form.get('model')

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