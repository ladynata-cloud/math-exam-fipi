"""Independent review of the recorded seeded book cases, never the trainer key.

Visible prompts/tables/SVG geometry are the evidence. Production task objects,
generators, checker functions and hidden answer parameters are never evaluated.
Only explicitly reviewed prompt+geometry fixtures may receive a PASS.
"""
import argparse, datetime, hashlib, json, math, pathlib, re, sys
import xml.etree.ElementTree as ET
from fractions import Fraction

ROOT = pathlib.Path(__file__).resolve().parent.parent
IDS = {'03','04','06','08','09','10','12','54','55','57','58','59','60','63','65','66','67','68','71'}
BOOK_BANNER = 'Книжная редакция · 31.10.2026 · v1. Результаты хранятся отдельно в этом браузере. Состав редакции'

def digest(data):
    return hashlib.sha256(data if isinstance(data, bytes) else data.encode()).hexdigest()

def stable(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'))

def plain(text):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', text)).strip()

def number(value):
    if isinstance(value, dict) and set(value) == {'n','d'}:
        return int(value['n']) / int(value['d'])
    return float(value)

def unbox(value):
    if isinstance(value, dict) and set(value) == {'answer'}:
        return value['answer']
    if isinstance(value, dict) and set(value) == {'n','d'}:
        return number(value)
    if isinstance(value, list) and len(value) == 1:
        return unbox(value[0])
    return value

def equal(a,b):
    a,b=unbox(a),unbox(b)
    if isinstance(a,bool) or isinstance(b,bool):return a is b
    if isinstance(a,dict) and isinstance(b,dict):return a.keys()==b.keys() and all(equal(a[k],b[k])for k in a)
    if isinstance(a,list) and isinstance(b,list):return len(a)==len(b) and all(equal(x,y)for x,y in zip(a,b))
    try:return abs(float(a)-float(b)) <= 1e-8
    except (TypeError,ValueError):return a==b

def geom(svgs):
    # Only visible coordinates and visible labels, never data-* semantic IDs.
    attrs={'x','y','x1','x2','y1','y2','cx','cy','r','width','height','d','points','viewBox'}
    rows=[]
    for s in svgs:
        if not s.get('svg'):continue
        node=ET.fromstring(s['svg'])
        rows.append([(n.tag.rsplit('}',1)[-1],{k:v for k,v in n.attrib.items() if k in attrs},n.text or '')for n in node.iter()])
    return digest(stable(rows))

def elems(record,kind,svg=0):
    root=ET.fromstring(record['visibleSvgLabels'][svg]['svg'])
    return [n for n in root.iter() if n.tag.rsplit('}',1)[-1]==kind]

def graph_mapping(record):
    order=[];details=[]
    for i,s in enumerate(record['visibleSvgLabels']):
        lines=elems(record,'polyline',i)
        pts=[[tuple(map(float,p.split(',')))for p in n.attrib['points'].split()]for n in lines]
        if len(pts)==2:
            kind='reciprocal'
        elif len(pts)==1 and max(abs(x+y-300)for x,y in pts[0])<.2:
            kind='linear'
        elif len(pts)==1 and min(abs(x-150)+abs(y-150)for x,y in pts[0])<.2 and all(y<=150.1 for x,y in pts[0]):
            kind='parabola'
        else:raise ValueError('Unreviewed graph shape')
        order.append(kind);details.append({'graph':i+1,'shape':kind,'visiblePolylineCount':len(pts),'points':sum(map(len,pts))})
    assert sorted(order)==['linear','parabola','reciprocal']
    return [order.index(k)+1 for k in ['linear','parabola','reciprocal']],details

def graph_atoms(expected):
    return sorted([('point',number(x['v'])) if x['type']=='point' else ('interval',number(x['lo']),number(x['hi']),x['loCl'],x['hiCl']) for x in expected])

def exact_reviewed_context(record, oracle, fixtures):
    """Replay is limited to the manually reviewed condition and visible geometry.

    Only the fixed edition banner may differ. The guard rejects arbitrary new
    prompts even if a keyed arithmetic fixture happens to produce the same answer.
    """
    fixture = fixtures.get(record['id'])
    if fixture is None:return False
    text = record['initialVisibleText']
    if record['prefix']:
        if text.startswith(BOOK_BANNER+' '):text = text[len(BOOK_BANNER)+1:]
        elif text.endswith(' '+BOOK_BANNER):text = text[:-len(BOOK_BANNER)-1]
        else:return False
    item={'prompt':oracle['prompt'], 'expected':oracle['expected']}
    if record['id']=='67':
        item['promptHtml']=oracle.get('promptHtml')
        if not oracle.get('promptHtml'):
            # The first case was also reviewed visually. Bind that observation
            # to the exact loaded public payload, not merely flattened text.
            route=record['prefix']+record['route']
            approved=fixture.get('firstVisualReviewPayloads',{}).get(route,{})
            actual=record.get('resources',{}).get(route,{})
            if not approved.get('sha256') or actual.get('sha256')!=approved['sha256']:return False
    return (text in [fixture['visibleText'], *fixture.get('alternativeVisibleTexts', [])] and
            geom(record.get('visibleSvgLabels', [])) == fixture['geometrySha256'] and
            item in fixture['oracles'])

def rendered_fraction(html):
    """Evaluate only the recorded, rendered expression HTML with exact rationals.

    Closed syntax: numeric spans, ordinary/nested/mixed fractions, parentheses,
    arithmetic signs and integer powers. No production functions or bank keys.
    The second return value is a fully parenthesized calculation for the report.
    """
    def numeric(text):
        text=text.strip().replace('−','-').replace(',','.')
        if not re.fullmatch(r'-?\d+(?:\.\d+)?',text):raise ValueError('Unsupported numeric literal')
        return (Fraction(text),text)

    def expression(tokens):
        cursor=0
        def expr(minimum=0):
            nonlocal cursor
            if cursor>=len(tokens):raise ValueError('Missing operand')
            token=tokens[cursor];cursor+=1
            if isinstance(token,tuple):left=token
            elif token in ('+','-'):
                arg=expr(25)
                left=(arg[0] if token=='+' else -arg[0], token+'('+arg[1]+')')
            elif token=='(':
                left=expr()
                if cursor>=len(tokens) or tokens[cursor]!=')':raise ValueError('Missing closing parenthesis')
                cursor+=1
            else:raise ValueError('Invalid prefix')
            while cursor<len(tokens):
                op=tokens[cursor]
                if not isinstance(op,str):break
                precedence={'+':10,'-':10,'*':20,'/':20,'^':30}.get(op)
                if precedence is None or precedence<minimum:break
                cursor+=1;right=expr(precedence if op=='^' else precedence+1)
                a,b=left[0],right[0]
                if op=='+':value=a+b
                elif op=='-':value=a-b
                elif op=='*':value=a*b
                elif op=='/':value=a/b
                else:
                    if b.denominator!=1 or abs(b.numerator)>100:raise ValueError('Unsupported exponent')
                    value=a**b.numerator
                left=(value,'('+left[1]+op+right[1]+')')
            return left
        result=expr()
        if cursor!=len(tokens):raise ValueError('Unconsumed expression tokens')
        return result

    def tokens(node):
        if node.tag not in ('root','span','sup','div'):raise ValueError('Unsupported rendered HTML element')
        classes=set(node.attrib.get('class','').split())
        if any(k!='class' for k in node.attrib):raise ValueError('Unexpected rendered HTML attribute')
        children=list(node)
        def child_tokens():
            out=[]
            if node.text and node.text.strip():out.append(numeric(node.text))
            for child in children:
                out.extend(tokens(child))
                if child.tail and child.tail.strip():out.append(numeric(child.tail))
            return out
        if node.tag=='root' or classes in ({'fn'},{'fd'},{'expr'}):return child_tokens()
        if node.tag=='sup':return ['^',*child_tokens()]
        if 'f' in classes and classes<= {'f','big'}:
            if len(children)!=2 or [c.attrib.get('class') for c in children]!=['fn','fd']:
                raise ValueError('Malformed displayed fraction')
            a=expression(tokens(children[0]));b=expression(tokens(children[1]))
            return [(a[0]/b[0],'('+a[1]+')/('+b[1]+')')]
        if classes=={'mx'}:
            if len(children)!=2:raise ValueError('Malformed mixed fraction')
            a=expression(tokens(children[0]));b=expression(tokens(children[1]))
            if a[0].denominator!=1 or a[0]<0 or not 0<b[0]<1:raise ValueError('Unsupported mixed fraction')
            return [(a[0]+b[0],'('+a[1]+'+'+b[1]+')')]
        if children:raise ValueError('Unexpected children in scalar/operator')
        text=node.text or ''
        if classes=={'mn'}:return [numeric(text)]
        if classes in ({'mo'},{'br'}):
            op=text.strip().replace('−','-').replace('·','*').replace(':','/')
            if op not in ('+','-','*','/','(',')'):raise ValueError('Unsupported operator')
            return [op]
        raise ValueError('Unsupported rendered expression class')

    root=ET.fromstring('<root>'+html+'</root>')
    return expression(tokens(root))

def fraction_evaluator_selftest():
    def n(x):return '<span class="mn">'+str(x)+'</span>'
    def o(x):return '<span class="mo">'+x+'</span>'
    def f(a,b):return '<span class="f"><span class="fn">'+a+'</span><span class="fd">'+b+'</span></span>'
    examples=[
      (n('0,1')+o('+')+n('0,2'),Fraction(3,10)),
      (f(n(1),f(n(1),n(30))+o('+')+f(n(1),n(42))),Fraction(35,2)),
      (n(2)+o('+')+n(3)+o('·')+n(4),Fraction(14)),
      (o('(')+n(2)+o('+')+n(3)+o(')')+o('·')+n(4),Fraction(20)),
      (n(8)+o(':')+n(2)+o(':')+n(2),Fraction(2)),
      (o('−')+n(2)+'<sup>'+n(2)+'</sup>',Fraction(-4)),
      (n(10)+'<sup>'+n('-2')+'</sup>',Fraction(1,100)),
      ('<span class="mx">'+n(2)+f(n(3),n(4))+'</span>',Fraction(11,4))]
    for html,expected in examples:
        if rendered_fraction(html)[0]!=expected:raise AssertionError('Independent fraction evaluator self-test failed')
    for html in ['<span class="unknown">2</span>',n(1)+n(2),f(n(1),n(0))]:
        try:rendered_fraction(html)
        except (ValueError,ZeroDivisionError):pass
        else:raise AssertionError('Unsupported expression must fail closed')

PRACTICAL = {
 '04': [
 ('2346','По видимому плану: вход в нижний Г-образный коридор №2; справа в конце коридора кладовая №3; справа от наибольшей гостиной №6 спальня №4. Порядок таблицы: 2,3,4,6.'),
 (math.ceil(12*13/14),'Шаг сетки 24 SVG units = 0,4 м. Гостиная: 288/24 × 312/24 = 12×13=156 клеток; доска 0,2×0,8=0,16 м² равна одной клетке. ceil(156/14)=12 упаковок.'),
 ((19*5+5*6)*.4**2,'Коридор состоит из прямоугольников 456×120 и 120×144 SVG units при клетке24: 19×5+5×6=125 клеток. 125×0,4²=20 м².'),
 ((10*3-4*5)/(4*5)*100,'Лоджия кухни 240×72/24²=30 клеток; кладовая96×120/24²=20. (30−20)/20×100=50%.'),
 (min(28000+1700,27000+1800),'Только А и К имеют вертикальную загрузку и высоту≤85см. Их полные цены29700 и28800; Е иЖ высотой89см не подходят. Минимум28800 ₽.')],
 '06': [
 ('3274','На видимом плане узкая теплица внутри верхнего левого огорода имеет№3, огород№2, верхний правый сарай№7, нижняя левая квадратная баня№4.'),
 (2*4*2**2,'Гараж справа внизу:56×112 SVG units при шаге28 = 2×4 клеток. Клетка2м×2м, площадь8×4=32 м².'),
 (math.ceil(2*5*4/3.5),'Отдельная схема площадки2×5 клеток по4 м²:40м². ceil(40/3,5)=12 упаковок.'),
 ((3*3-1*4)/(1*4)*100,'Баня84×84/28²=9 клеток; теплица28×112/28²=4 клетки. (9−4)/4×100=125%.'),
 (min(math.ceil(232*.6/5)*2400+400,math.ceil(232*.4/4)*2300+600),'Магазин1: ceil(232×0,6/5)=28 банок, 28×2400+400=67600. Магазин2: ceil(232×0,4/4)=24,24×2300+600=55800. Минимум55800 ₽.')],
 '08': [
 ('2431','В видимой таблице А0=1189×841 соответствует№2, А2=594×420 —№4, А3=420×297 —№3, А6=148×105 —№1. Получается2431.'),
 (2**(2-1),'Каждый следующий формат вдвое меньше по площади. Из А1 получается2^(2−1)=2 листаА2.'),
 (1000000/2**2,'Условие явно требует идеальную модельА0=1м². А2=1/4м²=250000мм²; произведение округлённых линейных размеров не используется.'),
 (round(297/420,1),'Вопрос просит меньшую сторонуА3 разделить на большую:297/420=0,707142…; до десятых0,7.'),
 (100*160/2**2,'А2=1/4м². Масса100 листов при160г/м²:100×160/4=4000г.')],
 '09': [
 ({'v0':4,'v1':2,'v2':1},'По видимым связям маршрутов: стартЛягушкино№4, промежуточнаяКуровка№1, поворотМарусино№3, конечноеВятское№2.'),
 (15+8,'Шаг сетки32SVGunits=1км; горизонтальный участок(547−67)/32=15км, вертикальный(323−67)/32=8км. Шоссе23км.'),
 (math.hypot(15,8),'Прямая соединяет концы перпендикулярных катетов15км и8км. sqrt(15²+8²)=17км.'),
 ((15+8)/25*60,'По шоссе23км при25км/ч:23/25×60=55,2мин.'),
 (min(3*26+2*360+3*16,3*28+2*350+3*15,3*35+2*330+3*22,3*25+2*400+3*17),'Наборы по видимой таблице стоят846,829,831,926 ₽. Минимум829 ₽ вВятском.')],
 '10': [
 ('4625','Рисунок и перечень просёлочных связей определяют: Ванютино№4 (прямой угол), Горюново№6, Егорка№2, Жилино№5. ОтАнтоновки№1 порядок на верхнем шоссе:Егорка№2,Доломино№3,Ванютино№4.'),
 (12-4,'По рисунку Егорка лежит междуАнтоновкой иДоломино; расстоянияА–Д12км иД–Е4км. А–Е=12−4=8км.'),
 (math.hypot(12,9),'Егорка–Ванютино12км иВанютино–Жилино9км образуют прямой угол. Е–Ж=sqrt(12²+9²)=15км.'),
 (25/30*60+6/50*60,'А–В=8+12=20км,В–Г=15км; А–Г=sqrt(20²+15²)=25км (просёлок). В–Б=9+12=21км,Г–Б=21−15=6км (шоссе). Время25/30×60+6/50×60=57,2мин.'),
 (6.8*(41-18)/17,'ЧерезВанютино всё шоссе20+21=41км. ЧерезДоломино–Горюново: шоссе12+6=18км, просёлокsqrt((20−12)²+15²)=17км. Равенство бензина6,8×41=6,8×18+x×17 даётx=9,2л/100км.')],
 '12': [
 ('10435','Из пунктирной линии и правой шкалы:3,25ГБ —месяц10,3,5 —4,0,75 —3,1,25 —5; строка10435.'),
 (350,'В декабре синяя линия200мин, пунктир2ГБ; оба внутри300мин/3ГБ. Счёт350 ₽ при отсутствии доплатыSMS; эта предпосылка должна быть явно дана.'),
 (4,'Оба лимита соблюдены вмесяцах2(225мин;0,5ГБ),3(150;0,75),6(300;2,75),12(200;2). Всего4.'),
 ((350-175)/175*100,'Прирост абонплаты(350−175)/175×100=100%.'),
 (440,'По видимым графикам месячные стандартные счета без доплатыSMS:530,350,350,440,650,350,530,575,425,440,500,350; сумма5490 ₽. Все месяцы≤400мин и≤4ГБ: новый440×12=5280 ₽, экономия210 ₽. Выбирается440 ₽.')]
}

def reviewed(record, oracle, index):
    ident=record['id'];p=plain(oracle['prompt']);q=oracle.get('question',index+1)
    if ident=='03':
        percent_cases={
          'Найдите 30% от числа 200.':(200*30/100,'30%=30/100; 200×30/100=60.'),
          'Товар стоил 800 руб и подорожал на 25%. Сколько он стал стоить?':(800*(1+25/100),'Новая цена составляет125% прежней:800×1,25=1000 ₽.'),
          'Найдите 75% от числа 400.':(400*75/100,'75%=3/4;400×3/4=300.'),
          'Всего потрачено 1 000 руб. канцелярия 150 руб спорт 250 руб продукты 600 руб Какой процент всех расходов приходится на «канцелярия»?':(150/1000*100,'Сумма категорий150+250+600=1000. Доля канцелярии150/1000=0,15=15%.'),
          'Цена изменилась с 120 руб до 180 руб. На сколько процентов она выросла?':((180-120)/120*100,'База сравнения — прежняя цена120 ₽. Прирост60 ₽;60/120×100=50%.'),
          'После снижения на 10% цена стала 720 руб. Какой была цена до изменения?':(720/(1-10/100),'720 ₽ составляет90% исходной цены:720/0,9=800 ₽.')}
        if p in percent_cases:
            value,calculation=percent_cases[p]
            return value,calculation,'PASS',None
    if ident in PRACTICAL:
        result,why=PRACTICAL[ident][q-1]
        if ident=='12' and q in (2,5) and not re.search(r'SMS.{0,90}(не превышал|не превыша|не было)|доплат.{0,30}SMS.{0,30}не было',record['initialVisibleText'],re.I):
            return result,why,'PENDING','Missing visible premise that monthly SMS usage remains within package.'
        return result,why,'PASS',None
    if ident=='54':
        result,details=graph_mapping(record)
        return result,'Независимое распознавание фактически отрисованных кривых: '+stable(details)+'. y=x — прямая через начало с положительным наклоном; y=x² — одна парабола с вершиной вначале; y=1/x — две отдельные ветви вI иIII четвертях.','PASS',None
    if ident=='55' and '15 коробок' in p and 'по 12 кг' in p:
        return 15*12,'Искомая масса M=m·n=12кг×15=180кг; цена90руб/кг не входит вформулу массы.','PASS',None
    if ident=='57' and '10 минут' in p and '3 минуты' in p and '5-й день' in p:
        return 10+(5-1)*3,'Арифметическая последовательность: первый день10мин, до5-го дня4 прибавления по3мин. a5=10+4×3=22мин.','PASS',None
    if ident=='58' and 'BP = 15, CP = 6, DP = 10' in p:
        return 15*10/6,'Для пересекающихся хорд AP·CP=BP·DP. AP=15×10/6=25.','PASS',None
    if ident=='59' and 'основанием AD равен 30°' in p and 'стороной CD — 80°' in p:
        return 180-(180-30-80),'В△ACD углыCAD=30°,ACD=80°, значитCDA=70°. В равнобедренной трапеции уголA=углуD=70°, аB дополнительный кA:180−70=110°.','PASS',None
    if ident=='60' and 'трапеция' in p and 'средней линии' in p:
        points=[tuple(map(float,s.split(',')))for s in elems(record,'polygon')[0].attrib['points'].split()]
        assert points==[(49,139),(79,49),(139,49),(169,139)],points
        return ((139-79)/30+(169-49)/30)/2,'Шаг видимой сетки30SVGunits=1. Основания по вершинам(79,49)–(139,49) и(49,139)–(169,139):2 и4 клетки. Средняя линия(2+4)/2=3.','PASS',None
    if ident=='63' and 'x² - 6x + 5 x ≤ 5 3 2 x + 3 x > 5' in p:
        result=[('point',-4.0),('interval',0.0,10.5,False,True)]
        why='Парабола y=(x−3)²−4 наx≤5: ниже−4 пересечений0, при−4 одно, на(−4;0] два, приm>0 одно (правый корень выходит за5). Линейная ветвьy=3x/2+3 наx>5 даёт одно пересечение только приm>21/2; при21/2 точкаx=5 исключена. Итого ровно одно: m=−4 или0<m≤21/2. Проверены все открытые диапазоны и критические границы−4,0,21/2.'
        return result,why,'PASS',None
    if ident=='65' and 'На средней линии трапеции ABCD' in p:
        why='Пусть основанияb=BC,a=AD, высотаh. Средняя линия лежит на расстоянииh/2 от каждого основания: это следует, например, из линейности координаты высоты вдоль боковых сторон и определения их середин. Поэтому для любойE на ней S(BEC)=b·h/4 иS(AED)=a·h/4. Сумма(a+b)h/4 равна половине S(ABCD)=(a+b)h/2. Все четыре предъявленных шага последовательно устанавливают именно эти факты; обе лишние карточки ошибочно заменяютh/2 наh.'
        assert len(oracle['expected'])==4
        return 'proof-chain-valid',why,'PASS',None
    if ident=='65' and 'Внутренняя общая касательная касается их в точках M и N' in p:
        why='Независимое доказательство. Радиусы PM и QN перпендикулярны общей касательной MN. Она пересекает отрезок PQ в T; прямоугольные треугольники PMT и QNT имеют равные вертикальные углы при T, поэтому подобны по двум углам. Соответствие P↔Q,M↔N,T↔T даёт PM/QN=PT/TQ=a/b. Удвоение обоих радиусов не меняет отношения. Все четыре предъявленных шага проверены в этом порядке. Здесь подтверждена основная цепочка; исправление отдельно найденного объяснения ловушки t15 проверяется своим UI regression.'
        assert len(oracle['expected'])==4
        return 'proof-chain-valid',why,'PASS',None
    if ident=='65' and 'Биссектрисы углов C и D параллелограмма ABCD' in p:
        why='Независимое доказательство. Биссектриса DL даёт ∠ADL=∠LDC. Из AB∥DC и L∈AB получаем ∠LDC=∠DLA как накрест лежащие. Поэтому в△ADL равны углы при D и L, откуда AL=AD. Для второй стороны биссектриса CL даёт ∠BCL=∠LCD, а параллельность даёт ∠LCD=∠CLB; следовательно BL=BC. Поскольку AD=BC, получаем AL=BL и L середина AB. Все пять основных шагов логически верны. Здесь подтверждена основная цепочка; исправление отдельно найденной пары накрест лежащих углов в объяснении ловушки t3 проверяется своим UI regression.'
        assert len(oracle['expected'])==5
        return 'proof-chain-valid',why,'PASS',None
    if ident=='65' and 'Окружности с центрами I и J пересекаются в точках A и B' in p:
        why='Независимое доказательство. IA=IB и JA=JB как радиусы соответствующих окружностей. Геометрическое место точек, равноудалённых от A и B, — серединный перпендикуляр к AB; значит I и J лежат на нём. Для двух различных пересекающихся окружностей центры различны: при одинаковом центре разные радиусы не пересекаются, а одинаковые дают совпавшие окружности, а не две точки пересечения. Поэтому единственная прямая IJ совпадает с серединным перпендикуляром и IJ⊥AB. Условие о стороне от AB не мешает доказательству. Все четыре основные карточки верны.'
        assert len(oracle['expected'])==4
        return 'proof-chain-valid',why,'PASS',None
    if ident=='65' and 'ABCDEF — правильный шестиугольник с центром O' in p:
        why='Независимое доказательство. В правильном шестиугольнике соседние радиусы описанной окружности образуют центральный угол60°. Вершины A и D разделены тремя сторонами, поэтому ∠AOD=180° и AD — диаметр. Вершина B лежит на этой же окружности. По теореме о вписанном угле ∠ABD опирается на полуокружность AD и равен180°/2=90°. Поэтому△ABD прямоугольный. Все четыре основные карточки верны; обе ловушки правильно различают угол ABC=120°, длину диагонали и необходимый признак диаметра.'
        assert len(oracle['expected'])==4
        return 'proof-chain-valid',why,'PASS',None
    if ident=='66' and 'биссектриса BE и медиана AD перпендикулярны' in p:
        m=float(re.search(r'длину, равную (\d+)',p)[1])
        why='Независимое координатное доказательство. Пусть B=(0,0), BE лежит наосиx, A=(u·cosθ,u·sinθ),C=(v·cosθ,−v·sinθ),u=AB,v=BC. Из AD⊥BE иD=C/2 получаемu=v/2. Затем AD=2u·sinθ=m. Теорема биссектрисы даётAE:EC=u:v=1:2, поэтомуE=(2A+C)/3 иBE=4u·cosθ/3=m. Отсюдаu²=(m/2)²+(3m/4)²=13m²/16; AB=m√13/4,BC=m√13/2. Разность координатC−A=(3m/4,−3m/2), значитAC=3m√5/4. Дляm='+str(m)+'.'
        return [m*math.sqrt(13)/4,m*math.sqrt(13)/2,3*m*math.sqrt(5)/4],why,'PASS',None
    if ident=='67':
        if not oracle.get('promptHtml'):
            if p=='1 5 - 41 50':
                value=Fraction(1,5)-Fraction(41,50)
                return str(value.numerator)+'/'+str(value.denominator),'Первая задача отдельно просмотрена на сохранённом initial screenshot: 1/5 − 41/50 = 10/50 − 41/50 = −31/50. Для следующих задач используются полные отрисованные HTML-выражения.','PASS',None
            return None,'Nested fractions cannot be reconstructed unambiguously from flattened text.','PENDING','Missing recorded rendered expression HTML.'
        value,expression=rendered_fraction(oracle['promptHtml'])
        result=str(value.numerator)+'/'+str(value.denominator)
        return result,'Независимый разбор фактически отрисованного HTML выражения, без TASKS.n/d или native checker: '+expression+' = '+result+'. Все операции выполнены над точными рациональными числами с учётом вложенных дробей, скобок и приоритета действий.','PASS',None
    if ident=='68':
        ts={n.text:float(n.attrib['x'])for n in elems(record,'text')if n.text in ['0','1','a']}
        a=(ts['a']-ts['0'])/(ts['1']-ts['0']);assert abs(a+4.5)<1e-8
        return 3,'Координата точки из видимых позиций меток: (154,3294118−455,0352941)/(521,8588235−455,0352941)=−4,5. Тогдаa+4=−0,5>0 ложно;a+5=0,5<0 ложно;2−a=6,5>0 истинно;3−a=7,5<0 ложно. Ответ3.','PASS',None
    if ident=='71' and p=='В любом ромбе диагонали равны.':
        return False,'Контрпример: вершины(2,0),(0,1),(−2,0),(0,−1) образуют ромб со сторонами√5, но диагонали4 и2 не равны.','PASS',None
    if ident=='71' and p=='Если при пересечении двух прямых секущей накрест лежащие углы равны, то прямые параллельны.':
        return True,'Это обратный признак параллельности по накрест лежащим углам. Проведённая через точку второй прямой параллель первой образует тот же накрест лежащий угол; единственность луча с данным углом даёт совпадение со второй прямой.','PASS',None
    return None,'Новый точный вопрос ещё не прошёл независимое математическое рассмотрение.','PENDING','Unreviewed exact prompt.'

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root',type=pathlib.Path,default=ROOT)
    parser.add_argument('--reports-root',default='artifacts/book-audit-exam')
    parser.add_argument('--fixture',default='tools/fixtures/oge-book-exam-math.json')
    parser.add_argument('--output',default='artifacts/book-audit-exam/independent-math-review.json')
    parser.add_argument('--summary-output',default='artifacts/book-audit-exam/independent-math-summary.json')
    parser.add_argument('--variants',nargs='+',choices=['source','frozen'],default=['source','frozen'])
    parser.add_argument('--widths',nargs='+',type=int,default=[320,390,1280])
    parser.add_argument('--allow-pending',action='store_true',help='Exploratory local use only; CI must omit this flag.')
    args=parser.parse_args();root=args.root.resolve()
    def path(name):
        result=(root/name).resolve()
        result.relative_to(root)  # Reports and recorded paths must be portable within the repo.
        return result
    fixture_path=path(args.fixture);fixture_bytes=fixture_path.read_bytes()
    fixtures=json.loads(fixture_bytes)['fixtures']
    fraction_evaluator_selftest()
    records=[];inputs=[];coverage=[];unreviewed=[]
    for variant in args.variants:
        aggregate=path(args.reports_root)/variant/'results.json'
        data=json.loads(aggregate.read_text())
        if data.get('schemaVersion')!=2:raise ValueError('Expected exam report schemaVersion 2')
        inputs.append({'reportFile':str(aggregate.relative_to(root)),'reportSha256':digest(aggregate.read_bytes()),
                       'testScriptSha256':data['testScriptSha256'],'generatedAt':data.get('generatedAt')})
        found=set()
        for r in data['reports']:
            if r['width'] not in args.widths:continue
            for i,o in enumerate(r.get('oracles',[])):
                if r['id'] not in IDS and 'source-derived' in o.get('method',''):
                    unreviewed.append({'id':r['id'],'width':r['width'],'prefix':r['prefix'],'oracle':i,'prompt':o['prompt']})
            if r['id'] not in IDS:continue
            if (r['id'],r['width']) in found:raise ValueError('Duplicate report ID/width')
            found.add((r['id'],r['width']))
            source=aggregate.parent/(r['id']+'-'+str(r['width'])+'.json')
            raw=source.read_bytes()
            if json.loads(raw)!=r:raise ValueError('Aggregate/individual evidence mismatch')
            evidence={'reportFile':str(source.relative_to(root)),'reportSha256':digest(raw),
                      'approvedFixtureSha256':digest(fixture_bytes),'testScriptSha256':r['testScriptSha256'],
                      'randomSeed':r.get('randomSeed'),'visibleGeometrySha256':geom(r.get('visibleSvgLabels',[])),
                      'visibleTextSha256':digest(r['initialVisibleText'])}
            for i,o in enumerate(r['oracles']):
                try:
                    if exact_reviewed_context(r,o,fixtures):
                        result,calc,verdict,reason=reviewed(r,o,i)
                    else:
                        result,calc,verdict,reason=None,'Exact prompt, visible condition or rendered geometry differs from independently reviewed fixture.','PENDING','New condition requires independent review; no answer-key fallback.'
                    if verdict=='PASS':
                        match=(graph_atoms(o['expected'])==sorted(result)) if r['id']=='63' else True if result=='proof-chain-valid' else equal(o['expected'],result)
                        if not match:verdict='FAIL';reason='Independent result differs from submitted/checker answer.'
                except (ValueError,AssertionError,ZeroDivisionError,ET.ParseError) as exc:
                    result,calc,verdict,reason=None,'Independent evaluation could not establish this exact case.','PENDING',str(exc)
                item={'id':r['id'],'width':r['width'],'prefix':r['prefix'],'prompt':o['prompt'],'expected':o['expected'],
                      'method':'independent calculation',
                      'calculation':calc,'independentResult':result,'verdict':verdict,'reason':reason,'evidence':evidence}
                if o.get('promptHtml'):item['renderedExpressionSha256']=digest(o['promptHtml'])
                records.append(item)
        missing=sorted({(ident,width) for ident in IDS for width in args.widths}-found)
        coverage.append({'variant':variant,'reportsReviewed':len(found),'missingReports':[{'id':ident,'width':width}for ident,width in missing]})
    totals={v:sum(x['verdict']==v for x in records)for v in ['PASS','PENDING','FAIL']}
    summary={'schemaVersion':1,'generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),
      'scope':'Only the exact recorded prompt/expected/width/prefix/report combinations listed here. Does not approve all modes, generators, future questions, or automatically assess student written proofs.',
      'methodDefinition':'Independent mathematical calculation or proof from visible conditions, tables and rendered SVG/HTML. Production generator/checker answers are read only after calculation for comparison, never as mathematical inputs.',
      'reviewScriptFile':str(pathlib.Path(__file__).resolve().relative_to(root)),
      'reviewScriptSha256':digest(pathlib.Path(__file__).read_bytes()),'fixtureFile':str(fixture_path.relative_to(root)),
      'fixtureSha256':digest(fixture_bytes),'inputs':inputs,'coverage':coverage,'reviewedIds':sorted(IDS),
      'widths':args.widths,'totals':totals,'records':records,'unreviewedSourceDerivedOracles':unreviewed,
      'fractionEvaluatorSelfTest':'PASS: exact decimals, nested/mixed fractions, signs, precedence, integer powers and fail-closed malformed expressions.'}
    output=path(args.output);output.parent.mkdir(parents=True,exist_ok=True)
    # One complete record per line keeps the detailed evidence below 1 MB while
    # preserving every prompt, answer, calculation and exact report binding.
    header=json.dumps({k:v for k,v in summary.items() if k!='records'},ensure_ascii=False,indent=2)
    detail=header[:-2]+',\n  "records": [\n'+',\n'.join('    '+json.dumps(r,ensure_ascii=False,separators=(',',':')) for r in records)+'\n  ]\n}\n'
    output.write_text(detail)
    thin={k:v for k,v in summary.items() if k not in ['records','unreviewedSourceDerivedOracles']}
    thin.update({'detailedReviewFile':str(output.relative_to(root)),'detailedReviewSha256':digest(output.read_bytes()),
      'pending':[{'id':x['id'],'width':x['width'],'prefix':x['prefix'],'reason':x['reason']}for x in records if x['verdict']!='PASS'],
      'unreviewedSourceDerivedOracles':unreviewed,
      'reproduce':'python tools/oge-book-exam-math.py (after both browser suites have produced source/frozen individual and aggregate reports)'})
    thin_output=path(args.summary_output);thin_output.parent.mkdir(parents=True,exist_ok=True)
    thin_output.write_text(json.dumps(thin,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'totals':totals,'missingReports':sum(len(c['missingReports'])for c in coverage),
                      'unreviewedSourceDerivedOracles':len(unreviewed),'detailedReview':str(output.relative_to(root))}))
    if not args.allow_pending and (totals['PENDING'] or totals['FAIL'] or unreviewed or any(c['missingReports']for c in coverage)):
        return 1
    return 0

if __name__=='__main__':sys.exit(main())
