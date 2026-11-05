"""Original basic probability/statistics packs, aligned to open MCNMO books.

The official books are source references for scope and methods, not copied tasks.
All variants use the same task structure; only small numerical data vary.
"""
from fractions import Fraction as F
from statistics import median

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
    ]


if __name__ == "__main__":
    import json
    print(json.dumps(build(), ensure_ascii=False, indent=2))
