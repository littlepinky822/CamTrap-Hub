from flask import Blueprint, jsonify, send_from_directory, current_app, request, session
from appstore import app, celery, bcrypt, db, s3_client
from appstore.models import User, get_uuid, AppMetadata
from flask_login import login_user, logout_user, current_user, login_required
import os
import docker
from datetime import datetime
import pytz

bp = Blueprint('main', __name__)

@bp.route('/login', methods=['POST'])
def login():
    username = request.json['username']
    password = request.json['password']
    user = User.query.filter_by(username=username).first()

    if not user or not bcrypt.check_password_hash(user.password, password):
        return jsonify({'message': 'Invalid username or password'}), 401

    login_user(user)
    
    return jsonify({
        'status': 'success',
        'message': 'Login successful',
        'id': user.id,
        'username': user.username
    }), 200

@bp.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logout successful'}), 200

@bp.route('/register', methods=['POST'])
def register():
    formData = request.form
    username = formData['username']
    password = formData['password']
    email = formData['email']
    organisation = formData['organisation']
    hashed_password = bcrypt.generate_password_hash(password)

    user_exists = User.query.filter_by(username=username).first()
    if user_exists:
        return jsonify({'message': 'User already exists'}), 400
    
    new_user_id = get_uuid()  # Import get_uuid from models.py
    new_user = User(id=new_user_id, username=username, password=hashed_password, email=email, organisation=organisation)
    db.session.add(new_user)
    db.session.commit()

    session['user_id'] = new_user_id

    return jsonify({
        'message': 'Registration successful',
        'id': new_user_id,
        'username': username
    }), 200

@bp.route('/user', methods=['GET'])
@login_required
def get_user():
    if current_user.is_authenticated:
        return jsonify({
            'id': current_user.id,
            'username': current_user.username,
            'email': current_user.email,
            'organisation': current_user.organisation,
            'title': current_user.title
        }), 200
    else:
        return jsonify({'message': 'Not authenticated'}), 401   

@bp.route('/user/number', methods=['GET'])
def get_user_number():
    user_number = User.query.count()
    return jsonify({'user_number': user_number}), 200

@bp.route('/task_status/<task_id>', methods=['GET'])
def task_status(task_id):
    task = celery.AsyncResult(task_id)
    data = {
        'task_id': task_id,
        'status': task.state,
        'result': task.result  # This could be None if task isn't finished
    }
    return jsonify(data)

@bp.route('/profile/update', methods=['POST'])
@login_required
def update_user():
    data = request.json
    print('Data received: ', data)
    current_user.username = data.get('username', current_user.username)
    current_user.email = data.get('email', current_user.email)
    current_user.organisation = data.get('organisation', current_user.organisation)
    current_user.title = data.get('title', current_user.title)
    try:
        db.session.commit()
        return jsonify({'message': 'User updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating user: {str(e)}'}), 500

@bp.route('/apps', methods=['GET'])
def get_apps():
    apps = AppMetadata.query.all()
    apps_list = []
    for app in apps:
        apps_list.append({
            'id': app.id,
            'name': app.name,
            'display_name': app.display_name,
            'description': app.description,
            'full_description': app.full_description,
            'logo': app.logo,
            'image': app.image,
            'link': app.link,
            'tags': app.tags,
            'repository_url': app.repository_url
        })
    return jsonify(apps_list), 200

@bp.route('/apps/usage', methods=['GET'])
def get_apps_usage():
    client = docker.from_env()
    containers = client.containers.list(all=True)
    usage_data = {}
    total_runtime = 0

    def parse_docker_time(time_str):
        # Remove nanoseconds
        time_str = time_str.split('.')[0] + 'Z'
        return datetime.strptime(time_str, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=pytz.UTC)

    for container in containers:
        container_info = container.attrs
        labels = container_info['Config']['Labels']
        
        # Check if the container is part of a stack
        if 'com.docker.compose.project' in labels:
            app_name = labels['com.docker.compose.project']
        else:
            app_name = container_info['Name'].strip('/')

        state = container_info['State']

        if state['Status'] == 'running':
            start_time = parse_docker_time(state['StartedAt'])
            current_time = datetime.now(pytz.utc)
            runtime = (current_time - start_time).total_seconds()
        else:
            if state['FinishedAt'] != '0001-01-01T00:00:00Z':
                start_time = parse_docker_time(state['StartedAt'])
                end_time = parse_docker_time(state['FinishedAt'])
                runtime = (end_time - start_time).total_seconds()
            else:
                runtime = 0

        if app_name not in usage_data:
            usage_data[app_name] = {
                'runtime_seconds': 0,
                'status': 'running' if state['Status'] == 'running' else 'stopped'
            }

        usage_data[app_name]['runtime_seconds'] += runtime
        if state['Status'] == 'running':
            usage_data[app_name]['status'] = 'running'

        total_runtime += runtime

    # Convert dictionary to list for JSON serialization
    usage_list = [
        {
            'app_name': app_name,
            'runtime_seconds': data['runtime_seconds'],
            'status': data['status']
        } for app_name, data in usage_data.items()
    ]

    return jsonify({
        'usage_data': usage_list,
        'total_runtime': total_runtime
    }), 200

@bp.route('/data/number', methods=['GET'])
def get_s3_data_number():
    bucket_name = app.config['S3_BUCKET_NAME']
    s3_folder = 'uploads/'  # Default folder to check
    
    try:
        response = s3_client.list_objects_v2(Bucket=bucket_name, Prefix=s3_folder)
        file_count = sum(1 for obj in response.get('Contents', []) if obj['Key'] != s3_folder)
        
        return jsonify({
            'total_files': file_count
        }), 200
        
    except Exception as e:
        print(f"Error getting file count from S3: {str(e)}")
        return jsonify({'error': 'Failed to get file count from S3'}), 500