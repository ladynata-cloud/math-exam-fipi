"""Build the second numbered supplement independently of the approved first twelve."""
import argparse,json
from area_similarity_lessons import later
from build_area_lessons import ROOT, BOOK, card, step, drawing, edges, mid, intersection, F, lesson

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--check',action='store_true')
    args=parser.parse_args()
    rows=[lesson(c) for c in later(card,step,drawing,edges,mid,intersection)]
    text=json.dumps(dict(bookId=BOOK,lessons=rows),ensure_ascii=False,separators=(',',':'))+'\n'
    target=ROOT/'geometry-course/textbook/data/area-similarity-lessons.json'
    if args.check: assert target.read_text()==text
    else: target.write_text(text)
