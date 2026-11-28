"""Build the numbered midpoint and area unit for printed page 219."""
import argparse
import json
from build_area_lessons import BOOK, ROOT, lesson
from midpoint_lessons import lessons
from construction_followup import following
from menelaus_ceva_lessons import ratios
from concurrency_lessons import section

if __name__ == '__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--check',action='store_true')
    args=parser.parse_args()
    target=ROOT/'geometry-course/textbook/data/midpoint-lessons.json'
    content={'bookId':BOOK,'lessons':[lesson(item) for item in lessons()+following()+ratios()+section()]}
    serialized=json.dumps(content,ensure_ascii=False,separators=(',',':'))+'\n'
    if args.check:
        assert target.read_text()==serialized
    else:
        target.write_text(serialized)
