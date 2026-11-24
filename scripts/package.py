#!/usr/bin/env python3
"""Create the independent source delivery. Does not publish or contact a server."""
from pathlib import Path
from hashlib import sha256
from zipfile import ZipFile, ZIP_DEFLATED
import sys

root = Path(__file__).resolve().parents[1]
output = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else root.parent / 'ono-finclip-source-v1.0.1.zip'
excluded = {'node_modules', '.git', '__pycache__', '.DS_Store'}

def allowed(p):
    rel = p.relative_to(root)
    return (
        p.is_file() and not p.is_symlink()
        and not any(part in excluded for part in rel.parts)
        and rel.as_posix() != '.env'
        and not p.name.endswith(('.sqlite', '.sqlite-wal', '.sqlite-shm', '.log', '.pem', '.key'))
        and not rel.as_posix().startswith('backend/data/')
    )

files = sorted(p for p in root.rglob('*') if allowed(p) and p.name != 'CHECKSUMS.sha256')
(root / 'CHECKSUMS.sha256').write_text(''.join(
    sha256(p.read_bytes()).hexdigest() + '  ' + p.relative_to(root).as_posix() + '\n'
    for p in files
))
files.append(root / 'CHECKSUMS.sha256')
output.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(output, 'w', ZIP_DEFLATED, compresslevel=9) as z:
    for p in sorted(files):
        z.write(p, 'ono-finclip/' + p.relative_to(root).as_posix())
print(str(output))
print(f'{len(files)} files; {output.stat().st_size} bytes')
print('SHA256: ' + sha256(output.read_bytes()).hexdigest())
