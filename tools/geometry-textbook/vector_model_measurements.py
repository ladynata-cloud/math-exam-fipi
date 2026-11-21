"""Measure authored vector diagrams, including the arrowheads of each selectable view."""
from math import isclose
import re


def close(a,b):return isclose(a,b,rel_tol=1e-8,abs_tol=1e-7)


def eq(a,b):return all(close(x,y) for x,y in zip(a,b,strict=True))


def plus(a,b):return (a[0]+b[0],a[1]+b[1])


def neg(a):return (-a[0],-a[1])


def minus(a,b):return plus(a,neg(b))


def determinant(a,b):return a[0]*b[1]-a[1]*b[0]


def dot(a,b):return a[0]*b[0]+a[1]*b[1]


def measurements(model,key):
    view=model['views'][key];raw=model['points']
    pts={x.split('__v')[0]:tuple(raw[x][:2]) for x in view['points']}
    unit=minus(pts['V'],pts['U']);assert unit[0]>0 and close(unit[1],0)
    heads=[(a,b) for a,b in view['segments'] if b.startswith('head_') and b.endswith('_l')]
    shafts=[(a,b) for a,b in view['segments'] if not b.startswith('head_')][-len(heads):] if heads else []
    for (tip,left),(start,end) in zip(heads,shafts,strict=True):
        right=left[:-1]+'r'
        assert tip==end and [tip,right] in view['segments']
        direction=minus(raw[tip][:2],raw[start][:2]);l=minus(raw[left][:2],raw[tip][:2]);r=minus(raw[right][:2],raw[tip][:2])
        assert close(determinant(direction,l),-determinant(direction,r))
        assert abs(determinant(direction,l))>1e-8 and dot(direction,l)<0
    def vector(names):
        a,b=re.findall(r'[A-Z][₁₂]?',names)
        return tuple(v/unit[0] for v in minus(pts[b],pts[a]))
    return vector,[a.split('__v')[0]+b.split('__v')[0] for a,b in shafts]
