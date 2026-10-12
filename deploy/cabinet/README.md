# Кабинеты MathExam на отдельном VPS

Это комплект подготовки к переносу, а не подтверждение запуска. Провайдер,
регион, сервер и DNS ещё не выбраны. Контейнеры необходимо проверить на целевом
сервере до выдачи новых ссылок. Программа и формат SQLite не меняются.

Владелец разрешил создать кабинеты всех учеников заново. Для этого используется
новый отдельный каталог данных. Ранее сохранённый архив Amvera остаётся
неизменным; он не нужен для первого запуска с чистыми кабинетами. Новые учётные
записи не восстанавливают прежние приглашения и результаты.

## Устройство и требования

- Linux VPS с Docker Engine и Compose v2; один экземпляр `app` из корневого
  [Dockerfile](../../Dockerfile), Node 24.21.0, постоянный локальный диск `/data`.
- Caddy принимает HTTP/HTTPS на 80/443 и передаёт запросы, включая WebSocket,
  приложению. Порт 3000 снаружи не опубликован. Кабинет и API имеют один origin;
  публичные тренажёры остаются на `https://mathexam.space`.
- Собственный отдельный hostname, например `cabinet.example.org`; его DNS A
  (и AAAA, только если IPv6 действительно настроен) указывает на VPS. Порты 80/443
  доступны извне, административный SSH ограничен оператором. Автоматический
  сертификат требует корректного DNS и доступности сервера.
- `DATA_DIR` — абсолютный существующий каталог вне Git, не символическая ссылка,
  не сетевой диск. Каталог не создаётся Compose автоматически. Обычный старт
  отвергает отсутствующую, пустую, повреждённую базу или базу без учителя.
- Только один процесс владеет SQLite. Не используйте `--scale`, несколько
  проектов Compose с одним `DATA_DIR` или второе приложение с этой базой.
  Административные команды выполняются при остановленном `app`.

Оригинальная инструкция по аккаунтам и ограничениям:
[unified-learning.md](../../docs/unified-learning.md). HTTP 200 на `/health`
сам по себе не доказывает работу кабинетов; проверка готовности здесь использует
`/api/learning/status` и требует `available: true`, `durable: true`.

## Осознанный первый запуск с новой базой

Команды ниже выполняет оператор в приватной Bash-сессии на VPS с доступом к
Docker. Не включайте `set -x` и не вставляйте секретные файлы в отчёты или Git.
Рабочий каталог — `deploy/cabinet` проверенного checkout. В `.env` замените
пример hostname и тег образа; имя тега должно обозначать проверенный commit.
Сохраните простые shell-совместимые значения без подстановок команд.

```bash
set -e
umask 077
cp -n .env.example .env
chmod 600 .env
${EDITOR:-vi} .env
set -a
. ./.env
set +a
case "$DATA_DIR" in /*) ;; *) exit 1 ;; esac
test ! -L "$DATA_DIR"
install -d -m 700 "$DATA_DIR" /srv/mathexam/private /srv/mathexam/backups
test -z "$(find "$DATA_DIR" -mindepth 1 -maxdepth 1 -print -quit)"
docker compose config --quiet
docker compose build app
docker compose pull caddy
docker compose run --rm --no-deps -T caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
docker compose stop app
read -r -p 'Логин нового учителя: ' teacher_login
read -r -p 'Отображаемое имя учителя: ' teacher_name
( set -C; docker compose run --rm --no-deps -T app node learning-admin.js bootstrap "$teacher_login" "$teacher_name" > /srv/mathexam/private/teacher-bootstrap.json )
( set -C; docker compose run --rm --no-deps -T app node -e 'const fs = require("node:fs"), result = JSON.parse(fs.readFileSync(0, "utf8")); if (!/^[A-Za-z0-9_-]{43,100}$/.test(result.invitationToken)) process.exit(1); const url = new URL("/learning/?role=teacher", process.env.LEARNING_PUBLIC_ORIGIN); url.hash = "invite=" + result.invitationToken; process.stdout.write(url.href + "\n");' < /srv/mathexam/private/teacher-bootstrap.json > /srv/mathexam/private/teacher-invitation.txt )
docker compose up -d --wait --wait-timeout 120
curl --fail --silent --show-error "https://$CABINET_DOMAIN/api/learning/status"
```

CLI `bootstrap` намеренно заменяет обычную команду старта и создаёт базу и одного
неактивированного учителя. JSON и ссылка содержат секрет; права файлов — 0600,
каталога — 0700. `set -C` запрещает перезапись прежних приглашений. Если команда
завершилась ошибкой, остановитесь и выясните причину, не повторяйте инициализацию
и не удаляйте базу. При неудачном перенаправлении может остаться пустой файл.

Передайте `teacher-invitation.txt` владельцу приватным способом. Учитель открывает
ссылку, задаёт свой код и завершает активацию; первое приглашение действует три
дня и используется один раз. Затем вход учителя:
`https://ВАШ_HOSTNAME/learning/?role=teacher#students`. Удалите из временного
приватного хранилища отработанные JSON и ссылку после подтверждённой активации.
Не добавляйте `LEARNING_BOOTSTRAP_TOKEN` или другие bootstrap-переменные в сервер.

Если первое приглашение истекло до активации: остановите `app`, выполните
`docker compose run --rm --no-deps -T app node learning-admin.js renew-bootstrap "$teacher_login"`
с перенаправлением в **новый приватный файл**, снова сформируйте ссылку и запустите
`app`. Активированный аккаунт восстанавливают отдельной командой
`teacher-recovery`, описанной в основной инструкции.

В кабинете учителя откройте **Мои ученики → Добавить ученика**, создайте нужные
учётные записи и выдайте готовые личные ссылки и коды. Для каждого родителя
используйте **Доступ родителю** в карточке соответствующего ученика. Родительский
вход отдельный и привязан к этому ученику. Списки детей, коды и приглашения в Git
не сохраняются. Старые ссылки Amvera автоматически не перенаправляются.

До выдачи рабочих ссылок проверьте на временных тестовых аккаунтах вход учителя,
ученика и родителя, доступ только к своему ученику, сохранение упражнения,
перезапуск и восстановление копии. Проверка здоровья не заменяет эти действия.
Связанные ссылки на основном сайте обновляются отдельной проверенной правкой
после выбора и проверки постоянного hostname.

## Резервная копия при остановленном приложении

В той же приватной сессии и каталоге загрузите текущую `.env`, как выше. Выполняйте
операцию вне урока; `stop` создаёт короткий перерыв. Не запускайте одновременно
другие команды обслуживания. Папка копии должна быть новой. Эти команды
создают локальную копию, **не настраивают автоматическое или внешнее хранение**.

```bash
set -e
umask 077
backup_id=$(date -u +%Y%m%dT%H%M%SZ)
backup_dir="/srv/mathexam/backups/$backup_id"
test ! -e "$backup_dir"
install -d -m 700 "$backup_dir"
docker compose stop app
docker compose run --rm --no-deps -T --volume "$backup_dir:/backup" app node learning-admin.js backup /backup/learning.sqlite
tar -C "$DATA_DIR" --exclude='./learning.sqlite' --exclude='./learning.sqlite-*' --exclude='./learning.sqlite.lock' -cpf "$backup_dir/data-files.tar" .
docker compose up -d --wait --wait-timeout 120 app
( cd "$backup_dir"; sha256sum learning.sqlite data-files.tar > SHA256SUMS )
```

CLI проверяет целостность и схему SQLite. В базе находятся аккаунты, сессии,
приглашения, фотографии и история. `data-files.tar` сохраняет остальные данные,
включая `progress.json` и `group-lessons`, в том же остановленном состоянии.
Если любая команда после остановки завершилась ошибкой, база остаётся на месте;
изучите ошибку и явно возобновите `docker compose up -d --wait app`, когда это
безопасно. Не считайте неполную копию пригодной для восстановления.

До начала реальных занятий нужно отдельно настроить ежедневное расписание
(например, systemd timer), сериализацию запусков, проверку свободного места,
уведомление об ошибке, шифрование и отправку копии другому провайдеру. Периодически
проверяйте её восстановление в отдельный каталог. Ключ расшифрования должен быть
доступен владельцу вне VPS. Единственная копия на том же сервере не защищает
от его потери. В этом комплекте расписание и внешнее хранилище ещё не настроены.

## Восстановление без перезаписи действующих данных

Используйте доверенную расшифрованную копию и сверяйте её с ранее сохранённой
контрольной суммой. Рабочий `DATA_DIR` и исходный архив не удаляются. Папка
восстановления должна быть совершенно новой; база назначения должна отсутствовать.

```bash
set -e
umask 077
read -r -p 'Абсолютный каталог выбранной копии: ' backup_dir
( cd "$backup_dir"; sha256sum --check SHA256SUMS )
restore_data_dir="/srv/mathexam/data-restored-$(date -u +%Y%m%dT%H%M%SZ)"
test ! -e "$restore_data_dir"
install -d -m 700 "$restore_data_dir"
docker compose stop app
DATA_DIR="$restore_data_dir" docker compose run --rm --no-deps -T --volume "$backup_dir:/backup:ro" app node learning-admin.js restore /backup/learning.sqlite
tar -C "$restore_data_dir" -xpf "$backup_dir/data-files.tar"
```

После успешной проверки укажите полученный `restore_data_dir` как `DATA_DIR` в
`.env`, перечитайте её (`set -a; . ./.env; set +a`), убедитесь, что значение
совпадает, и выполните `docker compose up -d --wait --wait-timeout 120 app`.
Проверьте входы и выбранное сохранённое упражнение. До завершения проверки не
принимайте новые работы. Старый каталог оставьте для контролируемого возврата.

## Обновление, откат и границы готовности

Перед обновлением сохраните копию, текущий commit, конфигурацию и точный тег/ID
образа. Новый commit собирается под новым `CABINET_IMAGE`; не перезаписывайте
прежний тег и не очищайте старый образ до проверки. Остановите `app`, переключите
тег в `.env`, перечитайте её (`set -a; . ./.env; set +a`), выполните
`docker compose up -d --no-build --wait app` и проверьте
сохранённые данные. Для отката к совместимой версии выберите сохранённый образ
и ту же актуальную базу. Не откатывайте формат входа, если уже выданы коды,
которые старая версия не понимает. Возврат старой базы — отдельное решение:
он убирает новые результаты из рабочей версии; сначала сохраните текущие данные.

Не используйте `docker compose down -v`: тома Caddy содержат сертификаты и ключи.
Основные данные находятся в `DATA_DIR`; их тоже нельзя удалять при обновлении.
Автоматического переключения между серверами, покупки VPS, настройки DNS и
перенаправления прежнего адреса этот комплект не выполняет.

Версия `caddy:2.11.7-alpine` сверена с официальным образом 12 октября 2026 года.
Проверка на целевом VPS должна включать сборку образов, `caddy validate`, настоящий
HTTPS, входы трёх ролей, перезапуск и восстановление. Отсутствие Docker в среде
подготовки нельзя считать успешным контейнерным тестом; результаты CI и выпуска
нужно фиксировать отдельно.

Первичные технические источники:

- [Docker Compose: services и bind mount](https://docs.docker.com/reference/compose-file/services/)
- [Официальный образ Caddy](https://hub.docker.com/_/caddy)
- [Caddy 2.11.7](https://github.com/caddyserver/caddy/releases/tag/v2.11.7)
- [Caddy: automatic HTTPS](https://caddyserver.com/docs/automatic-https)
- [Caddy: reverse_proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy)
