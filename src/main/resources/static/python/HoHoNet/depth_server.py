from flask import Flask, request, jsonify
import subprocess

app = Flask(__name__)

@app.route('/depth_estimate', methods=['POST'])
def depth_estimate():
    data = request.get_json()
    image_dir = data['image_dir']
    image_name = data['image_name']

    command = f"python infer_depth.py --inp {image_dir}/{image_name} --out {image_dir}"
    result = subprocess.run(command, shell=True, stdout=subprocess.PIPE, capture_output=True)

    return jsonify({"status": "completed", "output": result.stdout.decode()})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
