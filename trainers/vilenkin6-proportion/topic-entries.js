// Outside a room each topic opens its own board. Inside a room only the shared task changes.
window.renderBoardTopicEntries = function (host, embedded, selectTask) {
  const catalog = window.RatioBoardTopics;
  const group = document.createElement('details');
  group.open = !embedded && window.matchMedia('(min-width: 720px)').matches;
  group.id = 'board-topics';
  group.setAttribute('aria-label', 'Темы общей доски');
  const heading = document.createElement('summary');
  heading.textContent = embedded ? 'Сменить тему на этой доске' : 'Открыть тему на общей доске';
  group.append(heading);
  const choices = document.createElement('div');
  choices.className = 'board-topic-list';
  for (const {taskId, label} of catalog.topics) {
    const entry = document.createElement(embedded ? 'button' : 'a');
    entry.dataset.topicTask = taskId;
    entry.className = 'board-topic';
    entry.textContent = label;
    if (embedded) {
      entry.type = 'button';
      entry.addEventListener('click', () => {
        selectTask(taskId);
        group.open = false;
      });
    } else {
      entry.href = catalog.boardHref(taskId);
    }
    choices.append(entry);
  }
  group.append(choices);
  host.replaceChildren(group);
};
