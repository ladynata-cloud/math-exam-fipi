#!/usr/bin/env python3
"""Independent numeric and coordinate checks on unscaled authored task diagrams."""
import ast, importlib.util, json, math, operator
from pathlib import Path

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('ich_build',HERE/'build.py')
build=importlib.util.module_from_spec(spec);spec.loader.exec_module(build)

def calculate(text):
    operators={ast.Add:operator.add,ast.Sub:operator.sub,ast.Mult:operator.mul,ast.Div:operator.truediv}
    def run(node):
        if isinstance(node,ast.Expression):return run(node.body)
        if isinstance(node,ast.Constant) and type(node.value) in (int,float):return node.value
        if isinstance(node,ast.UnaryOp) and isinstance(node.op,ast.USub):return -run(node.operand)
        if isinstance(node,ast.BinOp) and type(node.op) in operators:return operators[type(node.op)](run(node.left),run(node.right))
        raise ValueError('Only arithmetic constants and + - * / are permitted')
    return run(ast.parse(text,mode='eval'))

def audit(cards):
    checked=0
    for card in cards:
        p=card['drawing']['points']
        def vector(edge):return [p[edge[1]][k]-p[edge[0]][k] for k in (0,1)]
        def length(edge):return math.hypot(*vector(edge))
        def near(a,b):return math.isclose(a,b,rel_tol=1e-7,abs_tol=1e-7)
        for c in card.get('checks',[]):
            checked+=1
            if 'expression' in c:ok=near(calculate(c['expression']),c['expected'])
            elif c['type']=='distance':ok=near(length(c['points']),c['value'])
            elif c['type']=='equal':ok=near(length(c['segments'][0]),length(c['segments'][1]))
            elif c['type'] in ('parallel','perpendicular'):
                u,v=map(vector,c['segments']);den=math.hypot(*u)*math.hypot(*v)
                value=(u[0]*v[1]-u[1]*v[0]) if c['type']=='parallel' else sum(a*b for a,b in zip(u,v))
                ok=den>0 and abs(value)/den<1e-7
            elif c['type']=='midpoint':
                a,m,b=map(p.get,c['points']);ok=all(near(m[k],(a[k]+b[k])/2) for k in (0,1))
            elif c['type']=='angle':
                a,b,d=c['points'];u,v=vector([b,a]),vector([b,d]);den=math.hypot(*u)*math.hypot(*v)
                angle=math.degrees(math.acos(max(-1,min(1,sum(x*y for x,y in zip(u,v))/den)))) if den else float('nan')
                ok=near(angle,c['value'])
            else:raise ValueError('Unknown check '+repr(c))
            if not ok:raise AssertionError(card['id']+' failed '+json.dumps(c,ensure_ascii=False))
        # Right-angle and equality markers make mathematical claims, even if no
        # explicit authored check was attached. Check every displayed view.
        views=[card['drawing'],*card['drawing'].get('views',{}).values(),*(s.get('drawing',{}) for s in card['steps'])]
        for view in views:
            for marker in view.get('rightAngles',[]):
                u,v=vector([marker['vertex'],marker['a']]),vector([marker['vertex'],marker['b']]);den=math.hypot(*u)*math.hypot(*v)
                assert den>0 and abs(sum(a*b for a,b in zip(u,v)))/den<1e-7,(card['id'],'false right-angle marker')
                checked+=1
            groups={}
            for marker in view.get('equalSegments',[]):groups.setdefault(marker.get('marks',1),[]).append(length([marker['a'],marker['b']]))
            for values in groups.values():
                assert all(near(x,values[0]) for x in values),(card['id'],'false equal-segment marker')
                checked+=len(values)
    return checked

if __name__=='__main__':
    cards,content_hash,files=build.authored()
    checks=audit(cards)
    print(json.dumps({'gate':'ICHENSKAYA_MATH_COORDINATES_OK','cards':len(cards),'checks':checks,'authoredSha256':content_hash}))
