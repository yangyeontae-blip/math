"""Make local WOFF2 subsets from OFL Noto fonts; writes only public/fonts/.

Example: python scripts/generate-design-fonts.py --sans C:/Windows/Fonts/NotoSansKR-VF.ttf --serif C:/Windows/Fonts/NotoSerifKR-VF.ttf
Requires fontTools and Node (Node provides Brotli, so no Python Brotli install is needed).
"""
import argparse
import subprocess
import sys
import types
from pathlib import Path


def brotli(data, mode=0, decompress=False):
    operation = 'brotliDecompressSync' if decompress else 'brotliCompressSync'
    options = '' if decompress else ',{params:{[z.constants.BROTLI_PARAM_MODE]:Number(process.argv[1]),[z.constants.BROTLI_PARAM_QUALITY]:9}}'
    code = "const z=require('node:zlib'),chunks=[];process.stdin.on('data',c=>chunks.push(c));process.stdin.on('end',()=>process.stdout.write(z." + operation + "(Buffer.concat(chunks)" + options + ")));"
    return subprocess.run(['node', '-e', code, str(mode)], input=data, capture_output=True, check=True).stdout


shim = types.ModuleType('brotli')
shim.MODE_FONT = 2
shim.MODE_TEXT = 1
shim.compress = brotli
shim.decompress = lambda data: brotli(data, decompress=True)
sys.modules['brotli'] = shim
from fontTools.ttLib import TTFont
from fontTools.subset import Options, Subsetter
from fontTools.varLib.instancer import instantiateVariableFont

args = argparse.ArgumentParser()
args.add_argument('--sans', required=True)
args.add_argument('--serif', required=True)
args = args.parse_args()
destination = Path(__file__).resolve().parents[1] / 'public' / 'fonts'
destination.mkdir(parents=True, exist_ok=True)


def make(source, family, filename, unicodes, weight=None):
    font = TTFont(source, recalcTimestamp=False)
    options = Options()
    options.name_IDs = ['*']
    options.name_legacy = True
    options.name_languages = ['*']
    subset = Subsetter(options=options)
    subset.populate(unicodes=unicodes)
    subset.subset(font)
    if weight is not None and 'fvar' in font:
        font = instantiateVariableFont(font, {'wght': weight}, inplace=True)
    for record in list(font['name'].names):
        if record.nameID in (1, 4, 6, 16):
            value = family.replace(' ', '') if record.nameID == 6 else family
            font['name'].setName(value, record.nameID, record.platformID, record.platEncID, record.langID)
    font.flavor = 'woff2'
    path = destination / filename
    font.save(path)
    print(filename, path.stat().st_size, 'bytes')


body = set(range(0x20, 0x100)) | set(range(0x1100, 0x1200)) | set(range(0x2000, 0x2070)) | set(range(0x3000, 0x3040)) | set(range(0x3130, 0x3190)) | set(range(0xAC00, 0xD7A4)) | set(range(0xFF00, 0xFFF0)) | {0x20A9, 0x2212, 0x2713, 0x2715}
make(args.sans, 'Berry Forest Sans', 'berry-forest-sans.woff2', body)
make(args.serif, 'Berry Notebook Serif', 'berry-notebook-serif.woff2', set(map(ord, '베리숲모험학교 BERRY FOREST0123456789')), 700)
