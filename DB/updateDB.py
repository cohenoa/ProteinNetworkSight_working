
from DB.updateDB_tools import *

configFileName = 'DB/database.prod.ini'
conn: connection = open_conn(configFileName)

tables = {
    'network.node_node_links': {
        'insert_function': insert_rows_copy_from_factory(conn, 'network.node_node_links'),
        'keep_columns': ['node_id_a', 'node_id_b', 'combined_score']
    },
}

# tables = {
#     'items.proteins': {
#         'insert_function': insert_rows_copy_from_factory(conn, 'items.proteins'),
#         'keep_columns': ['protein_id', 'protein_external_id', 'species_id', 'protein_checksum', 'protein_size', 'annotation', 'preferred_name', 'annotation_word_vectors']
#     },
#     'items.proteins_names': {
#         'insert_function': insert_rows_copy_from_factory(conn, 'items.proteins_names'),
#         'keep_columns': ['protein_name', 'protein_id', 'species_id', 'source', 'is_preferred_name']
#     },
#     'items.species': {
#         'insert_function': insert_rows_copy_from_factory(conn, 'items.species'),
#         'keep_columns': ['species_id', 'official_name', 'compact_name', 'kingdom', 'type', 'protein_count']
#     }
# }

# reset_tables(conn, tables)


# proccess_dump_file(url='https://stringdb-downloads.org/download/items_schema.v12.0.sql.gz',
#                         table_insert_map=tables,
#                         batch_size=10000
#                         )

apply_indexes(conn, tables)


conn.close()