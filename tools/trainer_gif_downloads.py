"""Five frames for adapting a downloaded MathExam trainer."""

from build_trainer_skill_gifs import wrap


def build_all(build):
    steps = (
        'Открой «Скачать и изменить» и скачай HTML или комплект ZIP.',
        'Напиши одно изменение. Скопируй готовый промпт для DeepSeek.',
        'Вставь промпт в DeepSeek и приложи скачанный HTML.',
        'Сохрани полученный HTML под новым именем и открой в браузере.',
        'Проверь пустой, неверный и верный ответы на новом файле.',
    )

    def draw(card, index):
        def button(x, y, w, label):
            card.rect((x, y, x + w, y + 39), fill='accent', radius=8)
            card.text(x + w // 2, y + 9, label, 17, 'white', True, 'mt')

        def heading(label):
            card.text(49, 105, label, 25, bold=True)

        card.rect((32, 88, 608, 258), outline='edge', radius=12)
        if index == 0:
            heading('Скачать и изменить')
            button(49, 149, 283, 'Скачать тренажёр HTML')
            card.text(51, 214, 'oge-task9-equations.html', 21, 'blue')
        elif index == 1:
            heading('Что хотите изменить?')
            card.rect((49, 142, 591, 183), outline='edge', radius=7)
            card.text(62, 152, 'Сделать текст задачи крупнее', 20)
            button(49, 201, 359, 'Скопировать промпт для DeepSeek')
        elif index == 2:
            heading('Новое сообщение в DeepSeek')
            for row, line in enumerate(wrap(card.draw, 'Сделай текст задачи крупнее. Сохрани проверку ответов.', card.font(20), 540)):
                card.text(51, 153 + row * 25, line, 20)
            card.text(51, 213, 'Прикреплён: oge-task9-equations.html', 19, 'blue')
        elif index == 3:
            heading('Сохранить копию')
            card.text(50, 148, 'oge-task9-equations-my.html', 22, 'blue')
            card.line([(50, 182), (590, 182)], fill='edge', width=1)
            card.text(50, 207, '3(x + 8) − 2(x − 8) = 8', 29, bold=True)
        else:
            heading('Проверить ответ к уравнению')
            card.text(52, 150, 'Пусто', 20, bold=True)
            card.text(171, 150, 'Предложить ввести ответ', 20)
            card.text(52, 183, '32', 20, 'red', bold=True)
            card.text(171, 183, 'Отклонить', 20, 'red')
            card.text(52, 216, '−32', 20, 'accent', bold=True)
            card.text(171, 216, 'Принять', 20, 'accent')

    build('adapt-trainer', 'Как изменить скачанный тренажёр', steps, draw)
