from flask import Flask, jsonify

app = Flask(__name__)


@app.route("/", methods=["GET"]) 
@app.route('/<path:_>', methods=['GET'])
def health(_=""):
    return jsonify({"name": "TatScope", "status": "ok"})

