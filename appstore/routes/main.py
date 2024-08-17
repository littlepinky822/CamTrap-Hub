from flask import Blueprint, render_template, jsonify, send_from_directory, current_app
from appstore import celery
import os

bp = Blueprint('main', __name__)

@bp.route('/')
@bp.route('/home')
def home():
    return render_template('index.html')

@bp.route('/task_status/<task_id>', methods=['GET'])
def task_status(task_id):
    task = celery.AsyncResult(task_id)
    data = {
        'task_id': task_id,
        'status': task.state,
        'result': task.result  # This could be None if task isn't finished
    }
    return jsonify(data)

# uncatergorised routes
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