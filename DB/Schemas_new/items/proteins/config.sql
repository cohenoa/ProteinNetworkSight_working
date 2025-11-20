CREATE TABLE items.proteins (
    protein_id integer,
    protein_external_id varchar(50),
    species_id integer,
    protein_checksum varchar(16),
    protein_size integer,
    annotation varchar(600),
    preferred_name varchar(50),
    annotation_word_vectors tsvector
);



