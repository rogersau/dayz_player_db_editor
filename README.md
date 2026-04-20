# DayZ Player Database Editor

A tool for basic operations with the DayZ game player database. Due to the complexity of parsing individual classes, not all planned functionality has been implemented yet.

## Client-side web viewer

This repository now also includes a static browser viewer in `/docs`.

### What it does
* Opens a DayZ player database directly in the browser
* Parses player records and inventories client-side
* Lets a user search players by UID, Steam64, or character name
* Does not require a backend service or server-side upload of the database

### How to use it
* Open `/docs/index.html` in a browser, or deploy the `/docs` folder as a static site
* Choose a DayZ player database file from your computer
* Select a player record to inspect the parsed inventory tree

### Notes
* The web viewer is read-only
* SQLite parsing is handled in the browser with a vendored `sql.js` browser build
* The original WinForms editor is still present in the repository

## Implemented Features
* Parsing basic item properties - classname, slot, network ID
* Search for duplicate items that have the same network ID
* Finding items in all player inventories and counting them by player
* Counting unique items in a player's inventory

## Planned Features
* Search and replace classnames
* Delete items
* Delete characters from the database
* Clear inventory

---

# Original (Russian)

Инструмент для базовой работы с базой данной игроков из игры DayZ. Учитывая сложность парсинга отдельных классов, реализовано далеко не всё что планировалось.
# Реализованный функционал
* Парсинг базовых свойств предметов - класснейм, слот, сетевой ID
* Реализован поиск предметов-дубликатов, имеющих одинаковый сетевой ID
# Планируемый функционал
* Поиск и замена класснеймов
* Удаление предметов
* Удаление персонажей из базы
* Очистка инвентаря
