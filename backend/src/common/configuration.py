from configparser import ConfigParser
import os.path
from psycopg2 import connect, DatabaseError
from psycopg2.pool import SimpleConnectionPool
from psycopg2.extensions import connection
from contextlib import contextmanager

class PostgresDB:
    def __init__(self):
        self.app = None
        self.pool = None

    def init_app(self, app):
        self.app = app
        self.connect()

    def connect(self):
        params = configDb(filename=os.environ['DB_CONFIG'])
        self.pool = SimpleConnectionPool(**params, minconn=os.environ["DB_minconn"], maxconn=os.environ["DB_maxconn"])
        return self.pool

    @contextmanager
    def get_cursor(self):
        if self.pool is None:
            self.connect()
        con: connection = self.pool.getconn()
        try:
            yield con.cursor()
            con.commit()
        finally:
            self.pool.putconn(con)

    @contextmanager
    def get_connection(self):
        if self.pool is None:
            self.connect()
        con: connection = self.pool.getconn()
        try:
            yield con
            con.commit()
        finally:
            self.pool.putconn(con)

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
        params = configDb(filename=os.environ['DB_CONFIG'])
        conn = connect(**params)
        return conn

    except (Exception, DatabaseError) as error:
        print(error)
        return None


def close_db_conn(conn):
    if conn is not None:
        conn.close()

pgdb = PostgresDB()