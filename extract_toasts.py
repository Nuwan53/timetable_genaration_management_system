import glob
import re

files = glob.glob('frontend/src/**/*.jsx', recursive=True)
output = []
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        lines = file.readlines()
        for i, line in enumerate(lines):
            if 'toast.' in line:
                output.append(f"{f}:{i+1}:{line.strip()}")

with open('toast_usages.txt', 'w', encoding='utf-8') as out:
    out.write('\n'.join(output))
