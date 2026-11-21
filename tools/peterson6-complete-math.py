#!/usr/bin/env python3
"""Independent Fraction oracle for every authored expression and calculation."""
from fractions import Fraction
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]


def number(value):
    text = str(value).strip().replace(',', '.').replace('−', '-')
    m = re.fullmatch(r'([+-]?)(\d+)\s+(\d+)/(\d+)', text)
    if m:
        sign, whole, num, den = m.groups()
        return (-1 if sign == '-' else 1) * (Fraction(whole) + Fraction(int(num), int(den)))
    return Fraction(text)


def evaluate(node):
    if not isinstance(node, dict):
        return number(node)
    a, b = evaluate(node['left']), evaluate(node['right'])
    return {'add': lambda: a + b, 'subtract': lambda: a - b,
            'multiply': lambda: a * b, 'divide': lambda: a / b}[node['op']]()


def rounded(value, places):
    scale = Fraction(10) ** places
    scaled = abs(value) * scale
    integer, rem = divmod(scaled.numerator, scaled.denominator)
    if rem * 2 >= scaled.denominator:
        integer += 1
    return (-1 if value < 0 else 1) * Fraction(integer) / scale


def main():
    expressions = calculations = 0
    for file in sorted((ROOT / 'school/peterson6/textbook/content').glob('*.json')):
        for exercise in json.loads(file.read_text())['exercises']:
            for part in exercise['parts']:
                if part['kind'] == 'expression':
                    actual = evaluate(part['expression'])
                    if 'rounding' in part:
                        actual = rounded(actual, part['rounding']['places'])
                    assert actual == number(part['answer']), (part['id'], actual, part['answer'])
                    expressions += 1
                for i, step in enumerate(part.get('steps', [])):
                    if 'calculation' in step:
                        actual = evaluate(step['calculation'])
                        assert actual == number(step['answer']), (part['id'], i, actual, step['answer'])
                        calculations += 1
    print(json.dumps({'independentFractionExpressions': expressions,
                      'independentStepCalculations': calculations}))


if __name__ == '__main__':
    main()
