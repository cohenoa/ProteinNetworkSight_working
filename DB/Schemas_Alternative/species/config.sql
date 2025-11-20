CREATE TABLE items.species (
    taxon_id int PRIMARY KEY,
    string_type varchar(10),
    string_name_compact varchar(100),
    official_name_ncbi varchar(100),
    domain varchar(15)
);

