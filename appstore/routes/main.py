from flask import Blueprint, render_template, jsonify
from appstore import celery

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