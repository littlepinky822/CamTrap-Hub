from flask import Blueprint, jsonify
import subprocess

bp = Blueprint('animl', __name__, url_prefix='/animl')

@bp.route('/start', methods=['POST'])
def start_animl_detection():
    command = ['npm', 'start']
    process = subprocess.Popen(command, cwd='../animl-frontend', stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    return jsonify({'message': 'Animl started'}), 202