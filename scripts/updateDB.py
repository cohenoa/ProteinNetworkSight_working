import requests
import gzip
from tqdm import tqdm
import typing
import psycopg2
import os
from configparser import ConfigParser

class Link(typing.TypedDict):
    url: str
    table_name: str

class Linker(typing.TypedDict):
    links: Link
    species: Link
    proteins: Link
    proteins_aliases: Link

response = requests.api.request('GET', 'https://string-db.org/api/json/version')

version = response.json()[0]['string_version']

print(version)

def stream_gzip_to_postgres(url, insert_fn, max_test_lines=None):
    """
    Stream-download a .gz file, decompress line-by-line,
    and call insert_fn(decoded_line) for each line.
    """
    with requests.get(url, stream=True) as r:
        r.raise_for_status()
        with gzip.GzipFile(fileobj=r.raw, mode='rb') as gz:
            # wrap the gz iterator in tqdm
            for i, raw_line in enumerate(tqdm(gz, desc='Lines inserted', unit=' lines')):
                line = raw_line.decode('utf-8').rstrip('\n')
                if max_test_lines:
                    print(line)
                    if i + 1 >= max_test_lines:
                        break
                else:
                    insert_fn(line)
                # if max_test_lines and i + 1 >= max_test_lines:
                #     break

        r.close()


def clear_table(conn, table_name, reset_identity=True, cascade=False):
    """
    Remove all rows from `table_name`.
    
    Parameters:
    - conn: an open psycopg2 connection (with autocommit=True or you'll need to conn.commit())
    - table_name: str, name of the table to clear
    - reset_identity: bool, whether to RESTART IDENTITY (reset serial columns)
    - cascade: bool, whether to CASCADE to dependent tables
    """
    options = []
    if reset_identity:
        options.append("RESTART IDENTITY")
    if cascade:
        options.append("CASCADE")
    opts_sql = " ".join(options)
    
    sql = f"TRUNCATE TABLE {table_name} {opts_sql};"
    with conn.cursor() as cur:
        cur.execute(sql)
    # if you aren't in autocommit mode, uncomment the next line:
    # conn.commit()

def insert_fn_factory(conn, table_name):
    """
    Returns a function that takes a line of text (one record),
    splits it into columns, and inserts into Postgres.
    """
    def insert_line(line):
        cols = line.split()  # or split('\t') etc. based on your format
        # build your INSERT SQL; e.g.:
        placeholders = ','.join(['%s'] * len(cols))
        sql = f"INSERT INTO {table_name} VALUES ({placeholders})"
        with conn.cursor() as cur:
            cur.execute(sql, cols)
        # you might batch commits or use executemany for speed!
    return insert_line

def configDb(filename='database.ini', section='postgresql'):
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



if __name__ == '__main__':
    # 1) Get the version as you already do…
    version = requests.get('https://string-db.org/api/json/version').json()[0]['string_version']

    # 2) Build your URL
    linker: Linker = {
        'links': {
            'url': f'https://stringdb-downloads.org/download/protein.links.v{version}.txt.gz',
            'table_name': 'network.node_node_links'
        },
        'species': {
            'url': f'https://stringdb-downloads.org/download/species.v{version}.txt',
            'table_name': 'items.species'
        },
        'proteins': {
            'url': f'https://stringdb-downloads.org/download/protein.info.v{version}.txt.gz',
            'table_name': 'items.proteins'
        },
        'proteins_aliases': {
            'url': f'https://stringdb-downloads.org/download/protein.aliases.v{version}.txt.gz',
            'table_name': 'items.proteins_names'
        }
    }

    # 3) Open Postgres connection
    params = configDb(filename='../backend/database.ini', section='postgresql')
    conn = psycopg2.connect(**params)
    conn.autocommit = True

    

    # 4) Stream and insert
    insert_fn = insert_fn_factory(conn, 'protein_links')
    stream_gzip_to_postgres(linker['links']['url'], None, max_test_lines=10)

    # 5) add indexes

    # conn.close()