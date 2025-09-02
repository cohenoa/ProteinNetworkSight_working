from DB.updateDB_tools import *

# configFileName = 'DB/database.example.ini'
# conn: connection = open_conn(configFileName)



tables = {'items.proteins': None,
          'items.proteins_names': None,
          'items.species': None,
          }

stream_gzip_to_postgres(url='https://stringdb-downloads.org/download/items_schema.v12.0.sql.gz',
                        table_insert_map=tables,
                        max_test_lines=500,
                        batch_size=1000
                        )

# conn.close()