from flask import Blueprint, render_template, jsonify, send_from_directory, current_app, request, session
from appstore import celery, bcrypt, db
from appstore.models import User, get_uuid
from flask_login import login_user, logout_user, current_user, login_required
from sqlalchemy import text
import os

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
            'email': current_user.email
        }), 200
    else:
        return jsonify({'message': 'Not authenticated'}), 401    

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

# TEST: Render JSON reponse for the frontend
@bp.route('/test')
def test():
    return jsonify({'message': 'Render successful!'})