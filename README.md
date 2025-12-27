# Offline GeoGebra интеграция (Variant A)

Короткая инструкция по встройке GeoGebra Classic **без обращений к geogebra.org**.

## 1) Разложить Bundle
Скопируйте папку бандла в корень сайта:
```
/GeoGebra/deployggb.js
/GeoGebra/HTML5/5.0/web3d/...
```

## 2) Положить файл апплета
Скопируйте локальный `.ggb` файл:
```
/ggb/15.ggb
```

## 3) Открыть страницу
Готовая страница:
```
/ggb/15/index.html
```
Открывайте по HTTPS с корневыми путями (`/GeoGebra/...`, `/ggb/...`).

## 4) Проверка оффлайн-работы
В DevTools → Network убедитесь, что **нет запросов** на `geogebra.org`.

## 5) Траблшутинг
- **404 на `/GeoGebra/*`** — неверный путь или отсутствуют файлы бандла.
- **Trailing slash важен**: в `setHTML5Codebase("/GeoGebra/HTML5/5.0/web3d/")` нужен `/` в конце.
- **CSP**: при строгих политиках разрешите загрузку скрипта `/GeoGebra/deployggb.js` и inline-скрипт или вынесите JS во внешний файл.
- **Mixed content**: всегда используйте HTTPS, чтобы не блокировались ресурсы.

## 6) Nginx snippet (опционально)
Используйте готовый сниппет для MIME-типов и кеширования:
```
/nginx/geogebra-snippet.conf
```
