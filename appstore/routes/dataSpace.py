from flask import Blueprint, jsonify, request
from appstore import app, s3_client
from botocore.exceptions import ClientError
import mimetypes

bp = Blueprint('dataSpace', __name__, url_prefix='/dataSpace')

@bp.route('/upload', methods=['POST'])
def upload():
    bucket_name = app.config['S3_BUCKET_NAME']
    s3_folder = 'uploads/' if not request.form.get('folder') else 'uploads/' + request.form.get('folder')  # Get folder from request, default to 'uploads/'
    files = request.files.getlist('files')
    print('Files to upload: ', files)

    uploaded_files = []
    try:
        for file in files:
            if file.filename == '':
                continue
            
            file_key = s3_folder + file.filename
            print('Uploading file: ', file_key)
            s3_client.upload_fileobj(file, bucket_name, file_key)
            uploaded_files.append(file_key)
        
        return jsonify({
            'message': 'Files uploaded successfully to S3',
            'uploaded_files': uploaded_files
        }), 200
    
    except ClientError as e:
        print(f"Error uploading to S3: {str(e)}")
        return jsonify({'error': 'Failed to upload files to S3'}), 500

def get_s3_file_structure(bucket_name, prefix=''):
    file_structure = {}
    try:
        response = s3_client.list_objects_v2(Bucket=bucket_name, Prefix=prefix, Delimiter='/')
        if 'CommonPrefixes' in response:
            for folder in response['CommonPrefixes']:
                folder_name = folder['Prefix'].split('/')[-2]
                file_structure[folder_name] = get_s3_file_structure(bucket_name, folder['Prefix'])
        if 'Contents' in response:
            file_structure['files'] = [{'name': obj['Key'].split('/')[-1], 'url': f"https://{bucket_name}.s3.amazonaws.com/{obj['Key']}", 'path': obj['Key']} for obj in response['Contents'] if obj['Key'] != prefix]
        return file_structure
    except ClientError as e:
        print(f"Error fetching file structure from S3: {str(e)}")
        return {}
        
@bp.route('/list_files', methods=['GET'])
def list_files():
    bucket_name = app.config['S3_BUCKET_NAME']
    s3_folder = 'uploads/'

    try:
        file_structure = get_s3_file_structure(bucket_name, s3_folder)
        response = s3_client.list_objects_v2(Bucket=bucket_name, Prefix=s3_folder)
        files = []
        for obj in response.get('Contents', []):
            file_url = f"https://{bucket_name}.s3.amazonaws.com/{obj['Key']}"
            file_name = obj['Key'].replace(s3_folder, '')
            file_extension = file_name.split('.')[-1].lower()
            
            # Determine the MIME type
            mime_type, _ = mimetypes.guess_type(file_name)
            if mime_type:
                file_category = mime_type.split('/')[0]  # This will give 'image', 'video', etc.
            else:
                # Fallback to a simple check based on extension
                if file_extension in ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff']:
                    file_category = 'image'
                elif file_extension in ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv']:
                    file_category = 'video'
                else:
                    file_category = 'other'

            file_content = s3_client.generate_presigned_url('get_object', Params={'Bucket': bucket_name, 'Key': obj['Key']}, ExpiresIn=3600)
            file_upload_date = obj['LastModified']
            files.append({
                'name': file_name, 
                'url': file_url, 
                'type': file_extension.upper(),  # Original file type for display
                'category': file_category,  # New field for grouping
                'extension': file_extension,
                'content': file_content, 
                'uploadDate': file_upload_date, 
                'path': obj['Key']
            })

        return jsonify({'files': files, 'file_structure': file_structure}), 200

    except ClientError as e:
        print(f"Error listing files from S3: {str(e)}")
        return jsonify({'error': 'Failed to list files from S3'}), 500
    
@bp.route('/delete', methods=['DELETE'])
def delete_file():
    bucket_name = app.config['S3_BUCKET_NAME']
    file_path = request.args.get('path')
    if not file_path:
        return jsonify({'error': 'No file path provided'}), 400

    try:
        s3_client.delete_object(Bucket=bucket_name, Key=file_path)
        return jsonify({'message': f'File {file_path} deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# In Data Space page
# 1. Receive images from UI and upload to S3
# 2. Fetch files from S3
# 3. Delete files from S3
# 4. Move files between folders / Upload files to a specific folder

# In each application
# 1. Open window/popup for images selection (from Data Space)
# 2. Get images from S3