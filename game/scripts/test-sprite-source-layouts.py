"""Regression tests for crop ownership, including the previously missed source cuts."""
import importlib.util
import json
import unittest
from pathlib import Path
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('packer',ROOT/'scripts/build-sprite-quality-assets.py')
packer=importlib.util.module_from_spec(spec);spec.loader.exec_module(packer)

class SourceLayoutTests(unittest.TestCase):
    def test_output_padding_cannot_hide_an_incorrect_source_cut(self):
        source=Image.new('RGBA',(100,40))
        draw=ImageDraw.Draw(source)
        draw.rectangle((5,8,35,31),fill='red')
        draw.rectangle((42,8,85,31),fill='blue')
        job={'id':'fixture','matte':'alpha'}
        # The old equal split cuts the second actor, even if output is padded.
        with self.assertRaisesRegex(ValueError,'crosses frame boundary'):
            packer.source_cells(source,job,{'frames':[[[0,0,50,40],[50,0,100,40]]]})
        cells,_=packer.source_cells(source,job,{'frames':[[[0,0,39,40],[39,0,100,40]]]})
        self.assertEqual(sum(c.getchannel('A').histogram()[255] for c in cells[0]),source.getchannel('A').histogram()[255])

    def test_every_reviewed_source_retains_uncut_frames(self):
        jobs=json.loads(packer.RECIPE.read_text(encoding='utf-8'))
        layouts=json.loads(packer.LAYOUTS.read_text(encoding='utf-8'))
        total=0
        for job in jobs:
            with self.subTest(sheet=job['id']):
                raw=Image.open(packer.SOURCE/job.get('sourceFile',job['id']+'.png'))
                layout=layouts.get(job['id'])
                if layout is None:
                    self.assertTrue(job.get('hero'))
                    layout={'frames':[[[c*raw.width//8,r*raw.height//8,(c+1)*raw.width//8,(r+1)*raw.height//8] for c in range(8)] for r in range(8)]}
                cells,_=packer.source_cells(raw,job,layout)
                self.assertEqual(len(cells),job['rows'])
                total+=sum(len(row) for row in cells)
        self.assertEqual(total,905)

if __name__=='__main__':unittest.main()
