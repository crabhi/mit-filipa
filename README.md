# Mít Filipa

Párty kvíz pro jeden telefon, který koluje mezi hráči. 5 z 10 odpovědí platí — jak vysoko si troufneš?

**▶ Hraj na <https://crabhi.github.io/mit-filipa/>**

Hru si můžeš nainstalovat jako aplikaci — na iPhonu Sdílet → „Přidat na plochu“,
na Androidu Chrome nabídne instalaci sám. Po prvním otevření funguje úplně offline.

## Vývoj

Žádný build, žádný backend — celá hra je v `index.html`, otázky v `kvizove_otazky.json`.
Lokálně spusť `./run.sh` (vyžaduje HTTP server kvůli `fetch`) a otevři <http://127.0.0.1:8000/>.
