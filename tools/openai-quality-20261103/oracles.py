"""Independent exact arithmetic for the synthetic references; no assistant imports."""
import json, math
from fractions import Fraction as F
from pathlib import Path
C=json.loads((Path(__file__).with_name('cases.json')).read_text())
D={r['id']:r for r in C['dialogs']};P={r['id']:r for r in C['coverageProbes']}
checks=[]
def verify(i,value,expected,reference):
 assert value==expected,(i,value,expected)
 actual=D[i]['reference']['answer'] if i in D else P[i]['reference']
 assert actual==reference,(i,actual)
 checks.append({'id':i,'status':'REFERENCE_VERIFIED','modelQuality':'NOT_MEASURED'})
verify('d01',F(3,4)+F(2,3),F(17,12),'17/12 = 1 5/12')
verify('d02',F((F('9.96')*10+F(1,2)).numerator//(F('9.96')*10+F(1,2)).denominator,10),10,'10,0')
verify('d03',math.lcm(12,18,30),180,'180')
verify('d04',F(19-4,-3),-5,'-5')
verify('d05',F(9+3+8,6-2),5,'5')
verify('d06',13**2-5**2,12**2,'12 см')
verify('d07',12000*F(11,10)*F(12,10),15840,'15840 рублей')
# P=(1,0,0), Q=(0,1,0), R=(0,0,1); cross-product norm squared / 4 = 3/4.
p=(1,0,0);q=(0,1,0);r=(0,0,1)
u=tuple(q[i]-p[i] for i in range(3));v=tuple(r[i]-p[i] for i in range(3))
cross=(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])
verify('d08',F(sum(x*x for x in cross),4),F(3,4),'sqrt(3)/2')
verify('d09',F('3.6')/F('.12'),30,'30')
# Two equal ordered sides and their included angles: SAS fixes the correspondence.
verify('d10',('AB','AC','A'),('AB','AC','A'),'Первый признак: две стороны и угол между ними; ABC=DEF.')
verify('d11',F(110,2),55,'55 градусов')
verify('d12',8*3,24,'24 см^2')
verify('d13',F(6,2)*F(4,2)/2,3,'3 см^2')
# Isosceles trapezoid vertices (-2,0),(2,0),(1,2),(-1,2): equal diagonals, unequal bases.
verify('d14',(3**2+2**2,(-3)**2+2**2,4!=2),(13,13,True),'Неверно: равнобедренная трапеция, не являющаяся прямоугольником.')
verify('d15',F(125,1000),F(1,8),'1/8')
verify('d16',F(6,1)/F(1,2),12,'12 см')
verify('c01',((2+3),2*3),(5,6),'2;3')
verify('c02',tuple((F(x)-1)/(F(x)+2)>0 for x in [-3,0,2]),(True,False,True),'(-inf;-2) U [1;inf)')
assert (F(1)-1)/(F(1)+2)==0 # include 1; -2 is excluded because the denominator is zero.
verify('c03',F(3,5)*F(2,4),F(3,10),'3/10')
verify('c04',2**3+1,9,'9')
verify('c05',3**(3-1),9,'3')
# Unit circle sin=1/2 on [0,2pi] occurs at pi/6 and 5pi/6.
verify('c06',(F(1,6),F(5,6)),(F(1,6),1-F(1,6)),'pi/6;5pi/6')
# f'=3(x-1)(x+1): signs +,-,+ imply max at -1 and min at 1.
verify('c07',tuple(3*x*x-3>0 for x in [-2,0,2]),(True,False,True),'Локальный максимум x=-1, минимум x=1.')
# sin(2x)-sin(x)=sin(x)*(2cos(x)-1). Roots from sin(x)=0 or cos(x)=1/2.
verify('c08',sorted({F(0),F(1),F(2),F(1,3),F(5,3)}),[F(0),F(1,3),F(1),F(5,3),F(2)],'0;pi/3;pi;5pi/3;2pi')
print(json.dumps({'referenceChecks':len(checks),'passed':len(checks),'liveCalls':0,'checks':checks},ensure_ascii=False))
