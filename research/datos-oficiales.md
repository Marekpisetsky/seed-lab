# Ficha: datos oficiales

- **Para:** todas las herramientas de Horalis · **Revisada:** 9 de octubre de 2026
- **Código** (en `packages/seed-kit/`):
  - `src/official/series.ts`: la forma, la lista de series y las comprobaciones;
  - `src/official/worldbank.ts`, `eurostat.ts` y `cldr.ts`: los lectores;
  - `src/official/data.ts`: el acceso en el build;
  - `scripts/official-data.ts`: la descarga anual.
- **Datos:** `src/data/official/`
- **Tests:** `test/official.test.ts`

## Pregunta que responde

«¿De dónde sale cada cifra, y puedo fiarme de que siga valiendo dentro de
unos años?» Las herramientas no dependen de webs que cambian ni de nadie
que las actualice a diario. Solo usan datos de organismos oficiales con
licencia abierta, descargados una vez al año, comprobados y guardados
dentro del build.

## Qué se guarda, en palabras sencillas

- Cada serie es una tabla: país, año, cifra.
- Junto a las cifras va su ficha: quién la publica, con qué código, dónde
  verla, con qué licencia, cuándo se descargó y cuál es el último año que
  tienen la mayoría de los países (el «año de los datos»).
- Las herramientas muestran esa fuente y ese año junto a cada resultado.
- Cada país lleva también su moneda de hoy (ISO 4217, de Unicode CLDR) y
  desde cuándo la usa (`currencySince`, la fecha de inicio de CLDR),
  para que cualquier herramienta pueda trabajar en cualquier moneda. Cómo
  se usan la moneda y el tipo de cambio: [monedas](monedas.md).

## Fuentes, con fecha y licencia

| Serie | Organismo y código | Licencia | Año de los datos (9 oct. 2026) |
| --- | --- | --- | --- |
| Inflación anual | Banco Mundial, FP.CPI.TOTL.ZG | CC BY 4.0 | 2025 |
| Inflación anual, UE | Eurostat, prc_hicp_aind (RCH_A_AVG, CP00) | Reutilización con cita (Decisión 2011/833/UE) | 2024 |
| Tipo de cambio oficial, media del año | Banco Mundial, PA.NUS.FCRF | CC BY 4.0 | 2025 |
| Paridad de poder adquisitivo (PIB) | Banco Mundial (PCI), PA.NUS.PPP | CC BY 4.0 | 2025 |
| Nivel de precios (1 = EE. UU.) | Banco Mundial (PCI), PA.NUS.PPPC.RF | CC BY 4.0 | 2024 |
| Gasto o ingreso medio por persona y día | Banco Mundial (PIP), SI.SPR.PCAP, dólares PPA de 2021 | CC BY 4.0 | 2023 (cada país, su última encuesta) |
| Moneda de cada país | Unicode CLDR, `supplemental/currencyData.json` | Unicode License v3 | 48.2.0 |

El Banco Mundial elabora dos de estas series, la inflación y el tipo de
cambio, a partir de las Estadísticas Financieras Internacionales del FMI.
Las publica con CC BY 4.0, y por eso se pueden usar. No se descarga nada
del FMI directamente.

**Qué fuentes no se usan y por qué:**
- **FMI:** sus condiciones piden permiso para el uso comercial y para las
  descargas automáticas.
- **Eurostat para países de fuera de la UE:** para los países de fuera de
  la UE, la AELC y los candidatos, su licencia no permite el uso comercial.
  Esos países salen del Banco Mundial.
- **BCE para los tipos de cambio:** el Banco Mundial da todos los países en
  la misma serie. Una sola fuente evita mezclar medias calculadas de forma
  distinta.

## Supuestos

- La **media anual** del tipo de cambio sirve para pasar de una moneda a
  otra cifras de ese mismo año. No es el tipo de hoy, y la página lo dice.
- **Toda conversión entre países pasa por el dólar, dentro de un mismo
  año.** El Banco Mundial expresa cada país en la moneda que usaba ese año.
  Por eso España aparece en pesetas antes de 1999 y en euros después: la
  serie salta, y no es un error. Dividir dos cifras del mismo país y del
  mismo año da siempre la misma unidad.
- El **año de los datos** es el último en que la mitad o más de los
  países tienen cifra.

## Comprobaciones antes de aceptar una descarga

1. **Licencia.** Para cada indicador, la licencia que dan los metadatos
   del Banco Mundial debe ser CC BY 4.0. Si no, la serie no entra.
2. **Rango.** Cada cifra cae dentro de lo plausible. Un tipo de cambio
   puede ser minúsculo antes de una redenominación (el austral argentino)
   o enorme en hiperinflación (Zimbabue, 2008), pero nunca 0 ni infinito.
   El rango de tipos de cambio y paridades es muy amplio a propósito: los
   errores reales los detecta el control de saltos.
3. **Cobertura.**
   - Al menos 150 países, o 100 en las encuestas.
   - Nunca menos países que los que ya había.
4. **Años.**
   - Ningún año futuro.
   - Ninguna cifra del año en curso: un dato anual solo está completo
     cuando el año ha terminado.
   - El año de los datos no puede tener más de 4 años, ni 8 en las
     encuestas. Esto solo se exige en la descarga anual: un build con datos
     antiguos sigue funcionando, y cada herramienta dice de qué año son sus
     datos.
   - Nunca puede ser anterior al que ya había.
5. **Saltos.**
   - Si una cifra se multiplica o divide por más de 50 de un año a otro, la
     descarga se para, salvo que los precios subieran un 300 % o más ese
     año.
   - Un salto que ya estaba en los datos en uso no se cuenta: el paso al
     euro, la unificación del kyat en 2012, la dolarización de Ecuador en
     2000.
   - En la primera descarga, los saltos solo se listan para revisarlos.
6. **Monedas.** Un país sin moneda en el CLDR queda fuera de todas las
   series, y el informe lo dice. Es el caso de las Islas del Canal, que no
   tienen código ISO.
7. **Revisiones.** Las cifras revisadas mucho se listan para revisarlas,
   pero no paran la descarga: más de un 25 %, o más de 5 puntos en una
   inflación. Una ronda nueva del PCI revisa series enteras.

Si algo falla, no se escribe ningún dato. El informe (`REPORT.md`) dice
qué falló, y la pull request anual solo lleva ese informe.

## Límites

- **Retraso.** Los datos anuales llegan con retraso. En octubre de 2026 el
  último año completo es 2025 para la inflación y los tipos de cambio, y
  2024 para el nivel de precios.
- **Paridad y nivel de precios.**
  - Son medias nacionales: una ciudad cara puede costar mucho más.
  - Salen de la ronda de 2021 del Programa de Comparación Internacional
    (PCI). El Banco Mundial extrapola los años siguientes.
- **Encuestas.**
  - Cada país tiene su propio año de encuesta.
  - Unos países miden consumo y otros, ingreso.
  - Es una media, no la mediana: la suben los que más tienen.
- **Países sin datos.** No aparecen. Ninguna herramienta inventa una
  cifra.

## Lo discutible

- **El año de los datos.** La regla «la mitad de los países» es una
  elección. Una cifra de un solo país puede ser más reciente, y cada
  herramienta muestra el año de la cifra que usa.
- **El umbral de salto.** ×50 deja pasar devaluaciones grandes, pero
  reales (×10 en un año), y para errores de unidad (×1000).

## Estado: provisional

La sesión que creó este módulo no llegaba a `api.worldbank.org` ni a
`ec.europa.eu`, y no podía añadir un workflow. Los datos actuales salen de:

- **Banco Mundial:** su espejo público
  [github.com/datasets/world-development-indicators](https://github.com/datasets/world-development-indicators).
  Es una copia automática de la API del Banco Mundial, actualización del 1
  de julio de 2026, con licencia CC BY 4.0 en cada `datapackage.json`. Se
  leyó con `npm run official-data -- --mirror DIR`.
- **Eurostat:** las cifras tecleadas a mano de Inflation Lens (2 de
  octubre de 2026), marcadas como provisionales.

Cada archivo lo dice en `meta.provisional`. La primera ejecución del
workflow anual descarga de las fuentes oficiales y los sustituye.

## Historial

- **9 de octubre de 2026.** Cambios tras la revisión independiente:
  - La moneda de cada país es la suya propia cuando está en uso: HTG en
    Haití, PAB en Panamá, ILS en Palestina.
  - Un país sin moneda queda fuera.
  - No se aceptan cifras del año en curso.
  - La descarga se compara también con los datos provisionales.
  - El informe se escribe siempre, aunque el script falle.
  - Un build no falla por tener datos antiguos.
- **9 de octubre de 2026.** Ficha nueva (fase A1 del plan Horalis).
  - Datos de arranque desde el espejo público, provisionales.
  - El workflow anual se queda en `packages/seed-kit/scripts/`, listo para
    copiar a `.github/workflows/`.
