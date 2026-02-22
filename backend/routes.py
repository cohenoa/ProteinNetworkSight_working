from flask import Flask, request
from src.validate import cal_string_id
from src.graph_data import clean_data, build_Network
from src.organism_list import get_organism_list
from src.names import cal_string_suggestions
from src.common.configuration import pgdb
from flask_cors import CORS, cross_origin
from io import StringIO
import json
# import logging

# logging.basicConfig(
#     level=logging.INFO,
#     format="%(asctime)s | %(levelname)s | %(message)s"
# )

# logging.info("Flask app started")

app = Flask(__name__)
pgdb.init_app(app)
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


@app.route("/api/graphs", methods=["POST"])
@cross_origin(origin='*',headers=['Content-Type','Authorization'])
def cal_graph_data():
    request_data = request.get_json()
    values_map = request_data["values_map"]
    thresh_pos = request_data["thresh_pos"]
    thresh_neg = request_data["thresh_neg"]
    score_thresh = request_data["score_thresh"]

    proteins = request_data["proteins"]
    string_names = request_data["string_names"]
    ids = request_data["ids"]

    clean_ids, id_to_nodes = clean_data(proteins, ids, string_names, values_map, thresh_pos, thresh_neg)

    with pgdb.get_connection() as con:
        with con.cursor() as cur:
            cur.execute("CREATE TEMP TABLE temp_ids(idx serial, id integer)")

            buf = StringIO("\n".join(str(id) for id in clean_ids))
            sql = "COPY temp_ids (id) FROM STDIN WITH (FORMAT text);"
            cur.copy_expert(sql, buf)

        nodes_list, links_list = build_Network(con, id_to_nodes, score_thresh)

        with con.cursor() as cur:
            cur.execute("DROP TABLE temp_ids;")
    
    return json.dumps(
        {
            "nodes": [ob.__dict__ for ob in nodes_list],
            "links": [ob.__dict__ for ob in links_list],
        }
    )

@app.route("/api/saveGraphs", methods=["POST"])
@cross_origin(origin='*',headers=['Content-Type','Authorization'])
def calc_all_graph_data():
    allGraphs = {}
    request_data = request.get_json()
    headers_data = request_data["headers_data"]

    proteins = request_data["proteins"]
    string_names = request_data["string_names"]
    ids = request_data["ids"]
    score_thresh = request_data["score_thresh"]

    with pgdb.get_connection() as con:

        for key, data in headers_data.items():
            values_map = data["values_map"]
            thresh_pos = data["thresh_pos"]
            thresh_neg = data["thresh_neg"]

            clean_ids, id_to_nodes = clean_data(proteins, ids, string_names, values_map, thresh_pos, thresh_neg)
            with con.cursor() as cur:
                cur.execute("CREATE TEMP TABLE temp_ids(idx serial, id integer)")

                buf = StringIO("\n".join(str(id) for id in clean_ids))
                sql = "COPY temp_ids (id) FROM STDIN WITH (FORMAT text);"
                cur.copy_expert(sql, buf)

            nodes_list, links_list = build_Network(con, id_to_nodes, score_thresh)

            with con.cursor() as cur:
                cur.execute("DROP TABLE temp_ids;")

            allGraphs[key] = {
                "nodes": [ob.__dict__ for ob in nodes_list],
                "links": [ob.__dict__ for ob in links_list],
            }
    
    return json.dumps(allGraphs)



if __name__ == '__main__':
    app.run(host="0.0.0.0" ,port=5000)
