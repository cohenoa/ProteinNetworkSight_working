from flask import Flask, request,redirect
from src.validate import cal_string_id
from src.graph_data import make_graph_data
from src.organism_list import get_organism_list
from src.user_register import register_user
from src.names import cal_string_suggestions
import json
import uuid
from flask_cors import CORS, cross_origin

app = Flask(__name__)
cors = CORS(app, resources={r"/api/": {"origins": "*"}})
app.config['CORS_HEADERS'] = 'Content-Type'
app.config['EXECUTOR_TYPE'] = 'thread'
app.config['EXECUTOR_MAX_WORKERS'] = 6
@app.route('/api/', methods=["GET"])
@cross_origin(origin='*',headers=['Content-Type','Authorization'])
def index():
    return 'Welcome to the backend server.'


@app.route("/api/organism", methods=["GET"])
@cross_origin(origin='*',headers=['Content-Type','Authorization'])
def cal_organism_list():
    organism_list = get_organism_list()

    return json.dumps(
        {"organisms":  [ob.__dict__ for ob in organism_list]}
    )


@app.route("/api/names", methods=["POST"])
@cross_origin(origin='*',headers=['Content-Type','Authorization'])
def cal_matching_list():
    request_data = request.get_json()

    org_names = request_data["org_names"]
    organism = request_data["organism"]

    matching_list = cal_string_suggestions(org_names, organism)

    return json.dumps(matching_list)


@app.route("/api/validate", methods=["POST"])
@cross_origin(origin='*',headers=['Content-Type','Authorization'])
def validate_name():
    request_data = request.get_json()

    name = request_data["name"]
    organism = request_data["organism"]

    matching_id = cal_string_id(name, organism)

    return json.dumps(matching_id)


@app.route("/api/user", methods=["POST"])
@cross_origin(origin='*',headers=['Content-Type','Authorization'])
def create_user_table():
    request_data = request.get_json()
    proteins = request_data["proteins"]
    string_names = request_data["string_names"]
    ids = request_data["ids"]
    user_id = str(uuid.uuid4()).replace("-", "")
    register_user(proteins, ids, user_id, string_names)
    return json.dumps({"uuid": user_id})


@app.route("/api/graphs", methods=["POST"])
@cross_origin(origin='*',headers=['Content-Type','Authorization'])
def cal_graph_data():
    request_data = request.get_json()
    user_id = request_data["user_id"]
    values_map = request_data["values_map"]
    thresh_pos = request_data["thresh_pos"]
    thresh_neg = request_data["thresh_neg"]
    score_thresh = request_data["score_thresh"]
    nodes_list, links_list = make_graph_data(user_id, values_map, thresh_pos, thresh_neg, score_thresh)
    return json.dumps(
        {
            "nodes": [ob.__dict__ for ob in nodes_list],
            "links": [ob.__dict__ for ob in links_list],
        }
    )

@app.route("/api/saveGraphs", methods=["POST"])
@cross_origin(origin='*',headers=['Content-Type','Authorization'])
def calc_all_graph_data():
    request_data = request.get_json()
    user_id = request_data["user_id"]
    
    headers_data = request_data["headers_data"]

    allGraphs = {}

    for key, data in headers_data.items():
        values_map = data["values_map"]
        thresh_pos = data["thresh_pos"]
        thresh_neg = data["thresh_neg"]
        score_thresh = data["score_thresh"]
        nodes_list, links_list = make_graph_data(user_id, values_map, thresh_pos, thresh_neg, score_thresh)

        allGraphs[key] = {
            "nodes": [ob.__dict__ for ob in nodes_list],
            "links": [ob.__dict__ for ob in links_list],
        }
    
    return json.dumps(allGraphs)



if __name__ == '__main__':
    app.run(host="0.0.0.0" ,port=5000)
