"""Original basic probability/statistics packs, aligned to open MCNMO books.

The official books are source references for scope and methods, not copied tasks.
All variants use the same task structure; only small numerical data vary.
"""
from fractions import Fraction as F
from statistics import median
from math import factorial, comb

PDF_79 = "https://ptlab.mccme.ru/sites/ptlab.mccme.ru/files/uchebnoe_posobie_teoriya_veroyatnostey_i_statistika_tyurin_2011.pdf"
PDF_1011 = "https://ptlab.mccme.ru/sites/ptlab.mccme.ru/files/eksperimentalnoe_uchebnoe_posobie_dlya_10_i_11_klassov_2014.pdf"
BOOK_79 = "Тюрин, Макаров, Высоцкий, Ященко. Теория вероятностей и статистика. 7–9 классы. 2011"
BOOK_1011 = "Тюрин, Макаров, Высоцкий, Ященко. Теория вероятностей и статистика. 10–11 классы. 2014"
# The class assignments follow the class appendix already recorded in each
# source reference. A topic shared by the two books is not a grade-7 topic
# merely because one source is a combined 7–9 book.
GRADES_79 = {
    "statistics": [7],
    "elementary": [8], "events": [8], "independence": [8],
    "binomial": [9], "random-variable": [9], "success-moments": [9],
    "frequency": [8], "data-variance": [7], "counting-product": [8],
    "permutations": [8], "combinations": [8], "geometric": [9],
}


def grade_label(grades):
    """Format exact grade sets without silently filling a gap such as grade 9."""
    runs = []
    for grade in grades:
        if runs and grade == runs[-1][-1] + 1:
            runs[-1].append(grade)
        else:
            runs.append([grade])
    label = ', '.join(str(run[0]) if len(run) == 1 else f'{run[0]}–{run[-1]}'
                      for run in runs)
    return label + (' класс' if len(grades) == 1 else ' классы')


def val(x):
    x = F(x)
    return str(x.numerator) if x.denominator == 1 else f"{x.numerator}/{x.denominator}"


def expr(x):
    x = F(x)
    return str(x.numerator) if x.denominator == 1 else f"({x.numerator}/{x.denominator})"


def task(q, answer, solution, calculation):
    return {"q": q, "a": val(answer), "solution": solution,
            "points": 2,
            "check": {"kind": "expression", "expr": calculation,
                      "expected": val(answer)}}


def number_list(xs):
    return "; ".join(map(str, xs))


def pack(pid, title, sections79, sections1011, maker):
    refs = []
    books = []
    book_grades = {}
    if sections79:
        books.append(BOOK_79)
        book_grades[BOOK_79] = GRADES_79[pid].copy()
        refs.append({"path": "school/textbooks.js", "sections": f"Источник 113: {sections79}", "url": PDF_79})
    if sections1011:
        books.append(BOOK_1011)
        book_grades[BOOK_1011] = [10, 11]
        refs.append({"path": "school/textbooks.js", "sections": f"Источник 114: {sections1011}", "url": PDF_1011})
    variants = []
    for v in range(4):
        sr = maker(v, False)
        kr = maker(v, True)
        assert len(sr) == 4 and len(kr) == 5
        for t, score in zip(sr, [1, 1, 2, 2]):
            t["points"] = score
        variants.append({"name": str(v + 1), "sr": sr, "kr": kr})
    grades = sorted({grade for values in book_grades.values() for grade in values})
    return {"id": f"prob-{pid}", "title": title, "grade": grade_label(grades),
            "subject": "Вероятность и статистика", "books": books,
            "book_grades": book_grades,
            "source_refs": refs,
            "scope_note": "Базовые задания по теме с небольшими числами. Авторские работы MathExam по указанным разделам; не полный комплект к учебнику. Каждый случайный выбор в условиях считается равновозможным, если явно не заданы другие вероятности.",
            "sr_minutes": 15, "kr_minutes": 40, "variants": variants}


def statistics(v, control):
    k = v + (6 if control else 1)
    data = [k + 2, k, k + 4, k + 1, k + 3]
    mean = F(sum(data), len(data))
    median_data = [k, k + 1, k + 3, k + 5]
    row = [k + 4, k + 6, k + 5]
    out = [
        task(f"В понедельник библиотеке вернули {row[0]} книг, во вторник — {row[1]}, в среду — {row[2]}. Сколько книг вернули за три дня?",
             sum(row), f"Складываем количества: {' + '.join(map(str, row))} = {sum(row)} книг.", "+".join(map(str, row))),
        task(f"Найдите среднее арифметическое чисел: {number_list(data)}.", mean,
             f"Сумма равна {sum(data)}, чисел 5. Среднее: {sum(data)} : 5 = {val(mean)}.", f"({' + '.join(map(str, data))})/5"),
        task(f"Найдите медиану набора: {number_list(median_data[::-1])}.", F(median(median_data)),
             f"Упорядочим: {number_list(median_data)}. Медиана: ({median_data[1]} + {median_data[2]}) : 2 = {val(F(median(median_data)))}.", f"({median_data[1]}+{median_data[2]})/2"),
        task(f"Найдите размах набора: {number_list([k + 8, k + 2, k + 6, k + 3])}.", 6,
             f"Наибольшее число {k + 8}, наименьшее {k + 2}. Размах: {k + 8} − {k + 2} = 6.", f"{k+8}-{k+2}")]
    if control:
        # Unknown fourth datum with a prescribed arithmetic mean.
        known = [k, k + 2, k + 4]
        target = k + 3
        answer = 4 * target - sum(known)
        out.append(task(f"Среднее арифметическое четырёх чисел равно {target}. Три числа: {number_list(known)}. Найдите четвёртое число.", answer,
                        f"Сумма четырёх чисел: 4 · {target} = {4*target}. Четвёртое: {4*target} − {sum(known)} = {answer}.", f"4*{target}-({' + '.join(map(str,known))})"))
    return out


def elementary(v, control):
    red = v + (6 if control else 2)
    blue = v + (4 if control else 3)
    total = red + blue
    n = 14 + 2 * v if control else 10 + 2 * v
    fav = 5 + v if control else 3 + v
    below = 5 if control else 4
    out = [
        task(f"В мешке {red} красных и {blue} синих шаров. Все шары одинаковы на ощупь. Наугад достают один шар. Найдите вероятность того, что он красный.", F(red,total),
             f"Всего {total} шаров, из них {red} красных. Вероятность: {red}/{total} = {val(F(red,total))}.", f"{red}/({red}+{blue})"),
        task(f"На одинаковых карточках записаны числа от 1 до {n}. Наугад берут одну карточку. Найдите вероятность получить чётное число.", F(n//2,n),
             f"Среди {n} чисел {n//2} чётных. Вероятность: {n//2}/{n} = 1/2.", f"{n//2}/{n}"),
        task(f"На одинаковых карточках записаны числа от 1 до {n}. Наугад берут одну карточку. Найдите вероятность получить число не больше {fav}.", F(fav,n),
             f"Подходят числа от 1 до {fav}: всего {fav}. Вероятность: {fav}/{n} = {val(F(fav,n))}.", f"{fav}/{n}"),
        task(f"Бросают правильную игральную кость. Найдите вероятность того, что выпадет число очков меньше {below}.", F(below-1,6),
             f"Подходят {below-1} исхода из 6. Вероятность: {below-1}/6 = {val(F(below-1,6))}.", f"({below}-1)/6")]
    if control:
        out.append(task(f"В коробке {red} белых и {blue} чёрных карандашей. Наугад берут один карандаш. Найдите вероятность того, что он не белый.", F(blue,total),
                        f"Не белые карандаши — чёрные. Их {blue} из {total}. Ответ: {val(F(blue,total))}.", f"{blue}/({red}+{blue})"))
    return out


def events(v, control):
    # Genuine Venn counts: intersection, A-only, B-only, neither.
    common = 2 + v
    only_a = (5 if control else 3) + v
    only_b = (4 if control else 2) + v
    neither = (6 if control else 4) + v
    n = common + only_a + only_b + neither
    a, b = common + only_a, common + only_b
    stem = (f"В классе {n} учеников: {a} посещают шахматы, {b} — рисование, "
            f"{common} — оба кружка. Случайным образом выбирают одного ученика. ")
    out = [
        task(stem + "Найдите вероятность того, что он посещает хотя бы один из этих кружков.", F(a+b-common,n),
             f"Хотя бы один кружок посещают {a} + {b} − {common} = {a+b-common} учеников. Вероятность: {val(F(a+b-common,n))}.", f"({a}+{b}-{common})/{n}"),
        task(stem + "Найдите вероятность того, что он посещает оба кружка.", F(common,n),
             f"Оба кружка посещают {common} учеников из {n}. Вероятность: {val(F(common,n))}.", f"{common}/{n}"),
        task(stem + "Найдите вероятность того, что он не посещает ни один из этих кружков.", F(neither,n),
             f"Ни один кружок не посещают {n} − ({a} + {b} − {common}) = {neither} учеников. Вероятность: {val(F(neither,n))}.", f"1-({a}+{b}-{common})/{n}"),
        task(stem + "Найдите вероятность того, что он посещает шахматы, но не посещает рисование.", F(only_a,n),
             f"Только шахматы посещают {a} − {common} = {only_a} учеников. Вероятность: {val(F(only_a,n))}.", f"({a}-{common})/{n}")]
    if control:
        out.append(task(stem + "Найдите вероятность того, что он посещает ровно один из двух кружков.", F(only_a+only_b,n),
                        f"Ровно один кружок: ({a} − {common}) + ({b} − {common}) = {only_a+only_b} учеников. Вероятность: {val(F(only_a+only_b,n))}.", f"({a}+{b}-2*{common})/{n}"))
    return out


def independent(v, control):
    p = F(v+1, 5)
    q = F((v % 2)+2, 6 if control else 5)
    stem = f"События A и B независимы. P(A) = {val(p)}, P(B) = {val(q)}. "
    out = [
        task(stem + "Найдите вероятность того, что произойдут оба события.", p*q,
             f"Для независимых событий: P(A и B) = {val(p)} · {val(q)} = {val(p*q)}.", f"{expr(p)}*{expr(q)}"),
        task(stem + "Найдите вероятность того, что ни одно из событий не произойдёт.", (1-p)*(1-q),
             f"P(не A и не B) = (1 − {val(p)}) · (1 − {val(q)}) = {val((1-p)*(1-q))}.", f"(1-{expr(p)})*(1-{expr(q)})"),
        task(stem + "Найдите вероятность того, что произойдёт хотя бы одно из событий.", 1-(1-p)*(1-q),
             f"Вычитаем из 1 вероятность того, что не произойдёт ни одно: 1 − (1 − {val(p)}) · (1 − {val(q)}) = {val(1-(1-p)*(1-q))}.", f"1-(1-{expr(p)})*(1-{expr(q)})"),
        task(stem + "Найдите вероятность того, что A произойдёт, а B не произойдёт.", p*(1-q),
             f"P(A и не B) = {val(p)} · (1 − {val(q)}) = {val(p*(1-q))}.", f"{expr(p)}*(1-{expr(q)})")]
    if control:
        out.append(task(stem + "Найдите вероятность того, что B произойдёт, а A не произойдёт.", (1-p)*q,
                        f"P(не A и B) = (1 − {val(p)}) · {val(q)} = {val((1-p)*q)}.", f"(1-{expr(p)})*{expr(q)}"))
    return out


def conditional(v, control):
    girls = 10 + 2*v + (2 if control else 0)
    boys = 8 + v + (3 if control else 0)
    girls_club = 3 + v + (1 if control else 0)
    boys_club = 2 + v + (1 if control else 0)
    total_club = girls_club + boys_club
    p_b = F(3+v, 12 if control else 10)
    p_intersection = p_b*F(1,2)
    p_given = F(v+1,6 if control else 5)
    red, blue = v+3+(2 if control else 0), v+4
    out = [
        task(f"В классе {girls} девочек и {boys} мальчиков. Шахматы посещают {girls_club} девочек и {boys_club} мальчиков. Из всех девочек случайным образом выбирают одну. Найдите вероятность того, что она посещает шахматы.", F(girls_club,girls),
             f"Выбор идёт только среди {girls} девочек. Подходят {girls_club}, поэтому вероятность равна {val(F(girls_club,girls))}.", f"{girls_club}/{girls}"),
        task(f"В шахматном кружке {girls_club} девочек и {boys_club} мальчиков. Из участников кружка случайным образом выбирают одного. Найдите вероятность того, что выбран мальчик.", F(boys_club,total_club),
             f"В кружке {total_club} человек, мальчиков {boys_club}. Вероятность: {val(F(boys_club,total_club))}.", f"{boys_club}/({girls_club}+{boys_club})"),
        task(f"P(B) = {val(p_b)}, P(A и B) = {val(p_intersection)}. Найдите условную вероятность P(A при условии B).", F(1,2),
             f"P(A при B) = P(A и B) : P(B) = {val(p_intersection)} : {val(p_b)} = 1/2.", f"{expr(p_intersection)}/{expr(p_b)}"),
        task(f"P(B) = {val(p_b)}. Условная вероятность P(A при условии B) = {val(p_given)}. Найдите P(A и B).", p_b*p_given,
             f"P(A и B) = P(B) · P(A при B) = {val(p_b)} · {val(p_given)} = {val(p_b*p_given)}.", f"{expr(p_b)}*{expr(p_given)}")]
    if control:
        out.append(task(f"В мешке {red} красных и {blue} синих шаров, одинаковых на ощупь. Один за другим без возвращения вынимают два шара. Известно, что первый шар красный. Найдите вероятность того, что второй шар синий.", F(blue,red+blue-1),
                        f"После первого красного шара осталось {red+blue-1} шаров, из них {blue} синих. Вероятность: {val(F(blue,red+blue-1))}.", f"{blue}/({red}+{blue}-1)"))
    return out


def binomial(v, control):
    # Low denominators and at most three trials keep the arithmetic accessible.
    p = F(v+1,5)
    n = 3 if control else 2
    out = [
        task(f"Вероятность успеха в каждом испытании равна {val(p)}. Проводят {n} независимых испытания. Найдите вероятность успеха во всех испытаниях.", p**n,
             f"Перемножаем вероятности успехов: ({val(p)})^{n} = {val(p**n)}.", f"{expr(p)}**{n}"),
        task(f"Вероятность успеха в каждом испытании равна {val(p)}. Проводят {n} независимых испытания. Найдите вероятность того, что не будет ни одного успеха.", (1-p)**n,
             f"Вероятность неудачи: 1 − {val(p)} = {val(1-p)}. Вероятность {n} неудач: ({val(1-p)})^{n} = {val((1-p)**n)}.", f"(1-{expr(p)})**{n}"),
        task(f"Вероятность успеха в каждом испытании равна {val(p)}. Проводят {n} независимых испытания. Найдите вероятность ровно одного успеха.", n*p*(1-p)**(n-1),
             f"Успех может стоять на любом из {n} мест. Вероятность: {n} · {val(p)} · ({val(1-p)})^{n-1} = {val(n*p*(1-p)**(n-1))}.", f"{n}*{expr(p)}*(1-{expr(p)})**{n-1}"),
        task(f"Вероятность успеха в каждом испытании равна {val(p)}. Проводят {n} независимых испытания. Найдите вероятность хотя бы одного успеха.", 1-(1-p)**n,
             f"Из 1 вычитаем вероятность отсутствия успехов: 1 − ({val(1-p)})^{n} = {val(1-(1-p)**n)}.", f"1-(1-{expr(p)})**{n}")]
    if control:
        out.append(task(f"Вероятность успеха в каждом испытании равна {val(p)}. Проводят три независимых испытания. Найдите вероятность ровно двух успехов.", 3*p*p*(1-p),
                        f"Одну неудачу можно поставить на 3 места. Вероятность: 3 · ({val(p)})² · {val(1-p)} = {val(3*p*p*(1-p))}.", f"3*{expr(p)}**2*(1-{expr(p)})"))
    return out


def random_variable(v, control):
    a = v + (5 if control else 1)
    d = 2*(v+1)
    lo, hi = a, a+d
    mu = F(lo+hi,2)
    variance = F((hi-lo)**2,4)
    stem = f"Случайная величина X принимает значения {lo} и {hi}, каждое с вероятностью 1/2. "
    out = [
        task(stem + "Найдите математическое ожидание X.", mu,
             f"E(X) = {lo} · 1/2 + {hi} · 1/2 = {val(mu)}.", f"({lo}+{hi})/2"),
        task(stem + f"Найдите вероятность события X > {val(mu)}.", F(1,2),
             f"Условию удовлетворяет только значение {hi}, его вероятность 1/2.", "1/2"),
        task(stem + "Найдите математическое ожидание X².", F(lo*lo+hi*hi,2),
             f"E(X²) = ({lo}² + {hi}²) : 2 = {val(F(lo*lo+hi*hi,2))}.", f"({lo}**2+{hi}**2)/2"),
        task(stem + "Найдите дисперсию X.", variance,
             f"E(X) = {val(mu)}. D(X) = [({lo} − {val(mu)})² + ({hi} − {val(mu)})²] : 2 = {val(variance)}.", f"({lo}**2+{hi}**2)/2-(({lo}+{hi})/2)**2")]
    if control:
        # A normalized three-point distribution requiring one simple linear step.
        p = F(v+1,10)
        q = F(2,10)
        rest = 1-p-q
        out.append(task(f"Случайная величина Y принимает только значения 0, 1 и 2. P(Y = 0) = {val(p)}, P(Y = 1) = {val(q)}. Найдите P(Y = 2).", rest,
                        f"Сумма вероятностей равна 1: P(Y = 2) = 1 − {val(p)} − {val(q)} = {val(rest)}.", f"1-{expr(p)}-{expr(q)}"))
    return out


def success_moments(v, control):
    p = F(v+1,5)
    n = 10 if control else 5
    mean, variance = n*p, n*p*(1-p)
    stem = f"Проводят {n} независимых испытаний с вероятностью успеха {val(p)} в каждом. X — число успехов. "
    out = [
        task(stem + "Найдите математическое ожидание X.", mean,
             f"E(X) = n · p = {n} · {val(p)} = {val(mean)}.", f"{n}*{expr(p)}"),
        task(stem + "Найдите математическое ожидание числа неудач.", n*(1-p),
             f"Вероятность неудачи {val(1-p)}. Среднее число неудач: {n} · {val(1-p)} = {val(n*(1-p))}.", f"{n}*(1-{expr(p)})"),
        task(stem + "Найдите дисперсию X.", variance,
             f"D(X) = n · p · (1 − p) = {n} · {val(p)} · {val(1-p)} = {val(variance)}.", f"{n}*{expr(p)}*(1-{expr(p)})"),
        task(stem + "Найдите математическое ожидание случайной величины 2X.", 2*mean,
             f"E(2X) = 2E(X) = 2 · {val(mean)} = {val(2*mean)}.", f"2*{n}*{expr(p)}")]
    if control:
        out.append(task(stem + "Найдите математическое ожидание случайной величины X + 3.", mean+3,
                        f"E(X + 3) = E(X) + 3 = {val(mean)} + 3 = {val(mean+3)}.", f"{n}*{expr(p)}+3"))
    return out


def times(n):
    return "раза" if 2 <= n % 10 <= 4 and not 12 <= n % 100 <= 14 else "раз"


def frequency(v, control):
    total = 40 if control else 20
    hits = 16 + 2*v if control else 8 + v
    rate = [F(1, 5), F(1, 4), F(2, 5), F(1, 2)][v]
    samples = 40 if control else 20
    surveyed = 100 if control else 50
    chosen = 36 + 4*v if control else 18 + 2*v
    n1, n2 = (20, 30) if control else (10, 20)
    h1, h2 = (v+7, v+11) if control else (v+3, v+7)
    out = [
        task(f"В серии из {total} бросков монеты орёл выпал {hits} {times(hits)}. Найдите относительную частоту выпадения орла.", F(hits, total),
             f"Частота равна числу появлений события, делённому на число опытов: {hits}/{total} = {val(F(hits,total))}.", f"{hits}/{total}"),
        task(f"Провели {samples} опытов. Относительная частота события A равна {val(rate)}. Сколько раз произошло событие A?", samples*rate,
             f"Умножим число опытов на частоту: {samples} · {val(rate)} = {val(samples*rate)}.", f"{samples}*{expr(rate)}"),
        task(f"Из {surveyed} опрошенных школьников {chosen} выбрали шахматы. Найдите долю выбравших шахматы в процентах.", F(chosen*100, surveyed),
             f"Доля равна {chosen}/{surveyed}. В процентах: {chosen}/{surveyed} · 100% = {val(F(chosen*100,surveyed))}%.", f"{chosen}*100/{surveyed}"),
        task(f"В первой серии из {n1} опытов событие A произошло {h1} {times(h1)}, во второй из {n2} опытов — {h2} {times(h2)}. Найдите его частоту по двум сериям вместе.", F(h1+h2, n1+n2),
             f"Число опытов — {n1+n2}, число появлений события — {h1+h2}. Общая частота: ({h1} + {h2}) : ({n1} + {n2}) = {val(F(h1+h2,n1+n2))}.", f"({h1}+{h2})/({n1}+{n2})")]
    out[2]['a'] += '%'
    if control:
        out.append(task(f"В серии из {total} бросков монеты орёл выпал {hits} {times(hits)}. Найдите относительную частоту выпадения решки.", F(total-hits,total),
                        f"Решка выпала {total} − {hits} = {total-hits} раз. Частота: {total-hits}/{total} = {val(F(total-hits,total))}.", f"({total}-{hits})/{total}"))
    return out


def data_variance(v, control):
    k = v + (7 if control else 3)
    data = [k-1, k+1, k-1, k+1]
    spread = [k-2, k+2, k-2, k+2]
    out = [
        task(f"Найдите среднее арифметическое набора: {number_list(data)}.", k,
             f"Сумма равна {4*k}; чисел 4. Среднее: {4*k} : 4 = {k}.", f"({'+'.join(map(str,data))})/4"),
        task(f"Среднее набора равно {k}. Найдите отклонение числа {k-2} от этого среднего.", -2,
             f"Из значения вычитаем среднее: {k-2} − {k} = −2.", f"{k-2}-{k}"),
        task(f"Найдите дисперсию набора: {number_list(data)}. Используйте среднее квадратов отклонений.", 1,
             f"Среднее равно {k}. Отклонения: −1; 1; −1; 1. Дисперсия: (1 + 1 + 1 + 1) : 4 = 1.", f"({' + '.join(f'({x}-{k})**2' for x in data)})/4"),
        task(f"Найдите дисперсию набора: {number_list(spread)}. Используйте среднее квадратов отклонений.", 4,
             f"Среднее равно {k}. Отклонения: −2; 2; −2; 2. Дисперсия: (4 + 4 + 4 + 4) : 4 = 4.", f"({' + '.join(f'({x}-{k})**2' for x in spread)})/4")]
    if control:
        constant = k+2
        out.append(task(f"Найдите дисперсию набора: {constant}; {constant}; {constant}; {constant}.", 0,
                        f"Среднее равно {constant}. Все отклонения равны 0, поэтому среднее их квадратов равно 0.", f"(4*({constant}-{constant})**2)/4"))
    return out


def counting_product(v, control):
    n = [4,5,6,3][v] if control else 3 + v
    other = 3 if control else 2
    digits = ', '.join(str(x) for x in range(1,n+1))
    out = [
        task(f"В наборе: футболок — {n}, кепок — {other}; все вещи различны. Сколькими способами можно выбрать одну футболку и одну кепку?", n*other,
             f"К каждой из {n} футболок подходит любая из {other} кепок. Получаем {n} · {other} = {n*other} способов.", f"{n}*{other}"),
        task(f"В меню: супов — {other}, вторых блюд — {n}, напитков — 2. Сколько обедов можно составить, выбрав по одному из каждого вида?", 2*n*other,
             f"Выборы независимы: {other} · {n} · 2 = {2*n*other} обедов.", f"{other}*{n}*2"),
        task(f"Код состоит из двух цифр из набора {digits}. Цифры могут повторяться. Сколько разных кодов можно составить?", n*n,
             f"Число вариантов на каждом месте — {n}. По правилу умножения: {n} · {n} = {n*n}.", f"{n}**2"),
        task(f"Код состоит из двух разных цифр из набора {digits}. Сколько таких кодов можно составить?", n*(n-1),
             f"Первую цифру выбираем {n} способами, вторую — {n-1} способами. Получаем {n} · {n-1} = {n*(n-1)}.", f"{n}*({n}-1)")]
    if control:
        out.append(task(f"Из A в B можно проехать по одной из {n} дорог, из B в C — по одной из 2 дорог. Сколько маршрутов A–B–C можно выбрать, проходя по одной дороге на каждом участке?", 2*n,
                        f"Каждую из {n} первых дорог можно соединить с любой из 2 вторых: {n} · 2 = {2*n}.", f"{n}*2"))
    return out


def permutations(v, control):
    # Each variant uses the same multiset of small object counts, rotated.
    ns = [(3,4,4,5), (4,3,5,4), (4,5,3,4), (5,4,4,3)]
    a, b, c, d = ns[(v+1)%4] if control else ns[v]
    objects = 'открыток' if control else 'книг'
    name = ['Антон', 'Борис', 'Вадим', 'Глеб'][v]
    out = [
        task(f"Вычислите {a}!.", factorial(a),
             f"{a}! = {' · '.join(map(str,range(1,a+1)))} = {factorial(a)}.", '*'.join(map(str,range(1,a+1)))),
        task(f"Ряд составляют из {b} разных {objects}. Сколько разных порядков возможно?", factorial(b),
             f"На первое место можно поставить любой из {b} предметов, затем выбирать из оставшихся. Число порядков: {b}! = {factorial(b)}.", '*'.join(map(str,range(1,b+1)))),
        task(f"Группа из {c} школьников выстраивается в очередь. Среди них — {name}. Сколько порядков возможно, если {name} стоит первым?", factorial(c-1),
             f"Первое место занято. Остальных {c-1} школьников можно переставить {c-1}! = {factorial(c-1)} способами.", '*'.join(map(str,range(1,c)))),
        task(f"Карточки с числами от 1 до {d} случайным образом располагают в ряд; все порядки равновозможны. Найдите вероятность порядка по возрастанию.", F(1,factorial(d)),
             f"Всего {d}! = {factorial(d)} порядков. По возрастанию карточки стоят только в одном порядке. Вероятность: 1/{factorial(d)}.", f"1/({'*'.join(map(str,range(1,d+1)))})")]
    if control:
        out.append(task(f"Случайно составляют ряд из {b} разных книг; все порядки равновозможны. Найдите вероятность того, что заранее выбранная книга окажется последней.", F(1,b),
                        f"Любое из {b} мест равновероятно для выбранной книги. Последнее место одно: вероятность равна 1/{b}.", f"1/{b}"))
    return out


def combinations(v, control):
    n = [5,6,7,4][v] if control else 4 + v
    group_b = 3 if control else 2
    pairs = comb(n,2)
    out = [
        task(f"Из {n} разных книг выбирают две. Сколькими способами можно это сделать? Порядок выбора не учитывается.", pairs,
             f"Упорядоченных пар {n} · {n-1}. Каждая неупорядоченная пара посчитана дважды: {n} · {n-1} : 2 = {pairs}.", f"{n}*({n}-1)/2"),
        task(f"Из {n} школьников выбирают команду из {n-1} человек. Сколько разных команд можно составить?", n,
             f"Достаточно выбрать одного школьника, который не войдёт в команду. Таких выборов {n}.", str(n)),
        task(f"Красных карандашей — {n}, синих — {group_b}; все карандаши различны. Сколько пар из одного красного и одного синего карандаша можно выбрать?", n*group_b,
             f"Красный карандаш выбираем {n} способами, синий — {group_b} способами. Количество пар: {n} · {group_b} = {n*group_b}.", f"{n}*{group_b}"),
        task(f"Из {n} разных предметов случайно выбирают два; все пары равновозможны. Два предмета заранее отмечены. Найдите вероятность выбрать именно эту пару.", F(1,pairs),
             f"Всего пар: {n} · {n-1} : 2 = {pairs}. Отмеченная пара одна, поэтому вероятность равна 1/{pairs}.", f"1/({n}*({n}-1)/2)")]
    if control:
        triples = comb(n,3)
        out.append(task(f"Из {n} разных открыток выбирают три. Сколькими способами можно это сделать? Порядок выбора не учитывается.", triples,
                        f"Сначала считаем упорядоченные тройки и делим на 3! = 6: {n} · {n-1} · {n-2} : 6 = {triples}.", f"{n}*({n}-1)*({n}-2)/6"))
    return out


def geometric(v, control):
    n = 16 + 4*v if control else 12 + 4*v
    left = 5 if control else 4
    right = left + 4
    width = 5 + v if control else 4 + v
    height = 4 if control else 3
    duration = 24 + 4*v if control else 20 + 4*v
    wait = 6 if control else 5
    angle = [90,120,180,60][v] if control else [60,90,120,180][v]
    out = [
        task(f"Число x выбирают равномерно из отрезка [0; {n}]. Найдите вероятность того, что {left} ≤ x ≤ {right}.", F(right-left,n),
             f"Длина всего отрезка {n}, подходящего — {right} − {left} = {right-left}. Вероятность: {right-left}/{n} = {val(F(right-left,n))}.", f"({right}-{left})/{n}"),
        task(f"В прямоугольнике {width} см на {height} см закрашена полоса шириной 2 см на всю длину стороны {height} см. Точку выбирают равномерно из прямоугольника. Найдите вероятность попадания в полосу.", F(2,width),
             f"Площадь полосы 2 · {height} = {2*height}, всего прямоугольника {width} · {height} = {width*height}. Отношение площадей: {val(F(2,width))}.", f"(2*{height})/({width}*{height})"),
        task(f"Время ожидания равномерно распределено от 0 до {duration} минут. Найдите вероятность ожидания не более {wait} минут.", F(wait,duration),
             f"Подходит промежуток длиной {wait} из всего промежутка длиной {duration}. Вероятность: {wait}/{duration} = {val(F(wait,duration))}.", f"{wait}/{duration}"),
        task(f"Точку выбирают равномерно на окружности. Найдите вероятность попадания на заранее отмеченную дугу величиной {angle}°.", F(angle,360),
             f"Доля длины дуги равна доле полного угла: {angle}/360 = {val(F(angle,360))}.", f"{angle}/360")]
    if control:
        out.append(task(f"Внутри прямоугольника {width} см на 4 см расположен квадрат со стороной 2 см. Точку выбирают равномерно из прямоугольника. Найдите вероятность попадания в квадрат.", F(1,width),
                        f"Площадь квадрата 2² = 4, прямоугольника {width} · 4 = {4*width}. Вероятность: 4/{4*width} = {val(F(1,width))}.", f"2**2/({width}*4)"))
    return out


def build():
    return [
        pack("statistics", "Данные, среднее, медиана и размах", "пункты 1–3, 10–12; приложение, 7 класс", None, statistics),
        pack("elementary", "Равновозможные исходы и простая вероятность", "пункты 20–23, 26–31; приложение, 8 класс", "§ 1–2", elementary),
        pack("events", "Объединение и пересечение событий", "пункты 32–36; приложение, 8 класс", "§ 4–5", events),
        pack("independence", "Независимые события", "пункт 38; приложение, 8 класс", "§ 6: независимость и умножение вероятностей", independent),
        pack("conditional", "Условная вероятность: простой выбор", None, "§ 6; задачи к главе III на стр. 215–216", conditional),
        pack("binomial", "Испытания Бернулли: два и три испытания", "пункты 47–49, 52; приложение, 9 класс", "§ 17–18", binomial),
        pack("random-variable", "Случайная величина: ожидание и дисперсия", "пункты 50–53, 56; приложение, 9 класс", "§ 7–9", random_variable),
        pack("success-moments", "Число успехов: ожидание и дисперсия", "пункты 54, 58–59; приложение, 9 класс", "§ 19", success_moments),
        pack("frequency", "Относительная частота события", "пункты 21, 23; теория вероятностей, 8 класс (от авторов, стр. 4)", "§ 3. Близость частоты и вероятности", frequency),
        pack("data-variance", "Отклонения и дисперсия набора данных", "пункты 13–14; приложение, 7 класс: самостоятельная 4, стр. 229", None, data_variance),
        pack("counting-product", "Комбинаторное правило умножения", "пункт 39; элементы комбинаторики, 8 класс (от авторов, стр. 4)", "§ 14. Основные сведения", counting_product),
        pack("permutations", "Перестановки и факториал", "пункты 40–41; приложение, 8 класс: самостоятельная 4, стр. 232", "§ 15. Число перестановок. Факториал", permutations),
        pack("combinations", "Сочетания: выбор пары или тройки", "пункты 42–43; приложение, 8 класс: самостоятельная 5, стр. 233", "§ 16. Число сочетаний", combinations),
        pack("geometric", "Геометрическая вероятность: длины и площади", "пункты 44–46; приложение, 9 класс: самостоятельная 1, стр. 234", None, geometric),
    ]


if __name__ == "__main__":
    import json
    print(json.dumps(build(), ensure_ascii=False, indent=2))
