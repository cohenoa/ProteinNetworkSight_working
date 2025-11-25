from configparser import ConfigParser
import os.path
from psycopg2 import connect, DatabaseError

def configDb(filename='database.prod.ini', section='postgresql'):
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(BASE_DIR, filename)

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

    return db


def open_db_conn():
    try:
        params = configDb()
        conn = connect(**params)
        return conn

    except (Exception, DatabaseError) as error:
        print(error)
        return None


def close_db_conn(conn):
    if conn is not None:
        conn.close()