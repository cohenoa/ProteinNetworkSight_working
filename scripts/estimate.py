import struct

def get_uncompressed_size_gzip(filepath):
    with open(filepath, 'rb') as f:
        f.seek(-4, 2)  # Go to the last 4 bytes
        size_bytes = f.read(4)
        return struct.unpack('<I', size_bytes)[0]  # Little endian

size = get_uncompressed_size_gzip('G:/programming/db/protein.links.v12.0.txt.gz')
print(f"Estimated uncompressed size: {size / (1024**3):.2f} GB")