import os
import time
import json
import tqdm
import psycopg2
from configparser import ConfigParser

def run_tests(cur, dir_path):
    config_json_path = os.path.join(dir_path, "./testSchemas/test_config_5000.json")
    with open(config_json_path, "r") as file:
        config_json = json.load(file)
    
    total_time = 0
    max_time = 0
    total_res_size = 0
    max_size = 0
    with tqdm.tqdm(total=len(config_json["data"]["batches"]), desc="Processing Batches", unit=" batches") as pbar:
        for batch in config_json["data"]["batches"]:
            t, l = time_test(cur, batch["ids"])
            total_time += t
            max_time = max(max_time, t)
            batch["time"] = t

            total_res_size += l
            max_size = max(max_size, l)
            batch["res_size"] = l
            pbar.update(1)

    config_json["statistics"]["postgres"]["average_batches"]["average_time"] = total_time / len(config_json["data"]["batches"])
    config_json["statistics"]["postgres"]["average_batches"]["max_time"] = max_time
    config_json["statistics"]["postgres"]["average_batches"]["average_res_size"] = total_res_size / len(config_json["data"]["batches"])
    config_json["statistics"]["postgres"]["average_batches"]["max_res_size"] = max_size

    total_time = 0
    max_time = 0
    total_res_size = 0
    max_size = 0
    with tqdm.tqdm(total=len(config_json["data"]["batches"]), desc="Processing Cache Batches", unit=" batches") as pbar:
        for batch in config_json["data"]["batches"]:
            t, l = time_test(cur, batch["ids"])
            total_time += t
            max_time = max(max_time, t)
            batch["time"] = t

            total_res_size += l
            max_size = max(max_size, l)
            batch["res_size"] = l
            pbar.update(1)

        
    config_json["statistics"]["postgres"]["cached_batches"]["average_time"] = total_time / len(config_json["data"]["batches"])
    config_json["statistics"]["postgres"]["cached_batches"]["max_time"] = max_time
    config_json["statistics"]["postgres"]["cached_batches"]["average_res_size"] = total_res_size / len(config_json["data"]["batches"])
    config_json["statistics"]["postgres"]["cached_batches"]["max_res_size"] = max_size

    with open(config_json_path, "w") as json_file:
        json.dump(config_json, json_file, indent=4)

def time_test(cur, ids):
    start_time = time.time()

    sql = """
        SELECT * 
        FROM network.physical_links 
        WHERE (protein1 IN %s AND protein2 IN %s) OR (protein2 IN %s AND protein1 IN %s)
    """
    cur.execute(sql, (tuple(ids), tuple(ids), tuple(ids), tuple(ids)))
    records = cur.fetchall()

    end_time = time.time()
    return (end_time - start_time), len(records)

if __name__ == "__main__":
    
    section = "postgresql"
    filename = "DB.ini"

    base_dir = os.path.dirname(os.path.abspath(__file__ + "/../"))
    file_path = os.path.join(base_dir, filename)

    # create a parser
    parser = ConfigParser(interpolation=None)
    # read config file
    parser.read(file_path)

    # get section, default to postgresql
    db = {}
    if parser.has_section(section):
        params = parser.items(section)
        for param in params:
            db[param[0]] = param[1]
    else:
        raise Exception('Section {0} not found in the {1} file'.format(section, filename))

    # Connect to PostgreSQL
    conn = psycopg2.connect(**db)
    cur = conn.cursor()

    run_tests(cur, base_dir)
    
    conn.commit()
    cur.close()
    conn.close()