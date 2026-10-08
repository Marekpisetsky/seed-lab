# Ficha: deseos y precios por país

- **App:** Wealth Lens · **Revisada:** 8 de octubre de 2026
- **Código** (en `projects/wealth-lens/`): `src/data/connections.json`
  (los precios), `src/lib/connections.ts` (los valida),
  `src/lib/calculator.ts` (`priceItem`, `pricedItems`, metas de una cosa),
  `src/lib/wishes.ts` (la regla de elección), `src/lib/wish-country.ts`
  ("Precios de"), `src/components/money/wishes-line.tsx` (la línea);
  `packages/seed-kit/src/detect.ts` (`regionOf`, `pricesCountry`)

## Pregunta que responde

"¿Qué podría hacer con mi dinero, y cuándo?" Es la línea "Con esto
podrías:" bajo el número grande, la lista "Cosas que podrías comprar" y
el precio de cada meta que sale de esa lista.

## Fórmula, en palabras sencillas

Cada deseo tiene un precio en euros de hoy. La app busca cuándo el plan
llega a ese precio, con el mismo cálculo que el resto (ver
[crecimiento](crecimiento.md)): "en 4 años", "ya", o nada si tarda más de
60 años.

Bajo el número grande salen hasta tres deseos. **Los deseos son de la
persona** ([dirección](../../docs/direction.md), aclaración de Marek del
5 de octubre de 2026): primero, las metas que marcó como más importantes
en *Mis metas* (la estrella de las [metas personales](metas-personales.md)),
en su orden. El resto de la línea son **ejemplos para descubrir**, uno por
cada área que sus prioridades no cubren, en este orden:

| Área | Ejemplos |
| --- | --- |
| Experiencias | Fin de semana en una capital europea, un mes por el Sudeste Asiático, un viaje a Japón |
| Vivienda | La entrada de una vivienda (20 % de 80 m²), una vivienda de 80 m² pagada |
| Tiempo | Un año sin trabajar; vivir sin trabajar en el país de los precios |

Son tres de las áreas que la dirección pide investigar (tranquilidad,
experiencias, vivienda, aprendizaje, proyectos propios, tiempo); el
aprendizaje (un año de universidad), los coches y la boda están en la
lista completa y se pueden añadir como meta.

**No hay plazos fijos.** "Corto, medio y largo" fue una propuesta de
Claude, no una regla de Marek: el plazo sale del plan de cada persona.
Dentro de un área sale el ejemplo más caro que el plan alcanza antes de
que acaben sus años; si ninguno llega en ese tiempo, el más barato, con
su fecha. Un ejemplo que no llega en 60 años no sale; con un plan muy
pequeño pueden salir uno o dos. Tocar un ejemplo lo añade a *Mis metas*
marcado como importante: pasa a ser un deseo de la persona.

Cada deseo se calcula por separado contra el mismo plan, como toda meta:
ninguno resta dinero a otro y ninguno tiene una fecha deseada (esas reglas
quedan para su propio spec y su ficha, como dice la dirección).

Exacta, con los meses hasta un objetivo de la [ficha de
crecimiento](crecimiento.md) (`monthsTo`):

- Una cosa: objetivo = su precio.
- Vivir sin trabajar: objetivo = 12 × coste al mes con alquiler en el
  país de los precios / tasa de retiro (ver [coste de vida](coste-de-vida.md),
  [tasa de retiro](tasa-de-retiro.md) y [metas personales](metas-personales.md)).
  Al añadirlo es la meta "Vivir sin trabajar" con la estimación de ese
  país, que la persona puede ajustar.
- `pick`: de los candidatos con meses ≤ 60 × 12, el de objetivo mayor
  entre los que tienen meses ≤ los años del plan × 12; si no hay ninguno,
  el de objetivo menor. Con el mismo objetivo, el primero de la lista.

### Precios de: el país

Los deseos y las metas usan los precios de un país: el de la región del
idioma del navegador (`es-ES` → España, `nl-NL` → Países Bajos; un idioma
sin región toma la más probable, `nl` → Países Bajos). Si no hay precios
de ese país, los de Países Bajos. Se calcula en el dispositivo
(`Intl.Locale`), no se guarda en ningún sitio, no va en "Descargar mis
datos" y se puede cambiar con "Precios de: España". No cambia nada más:
ni la inflación ("Subida de precios en", ver [inflación](inflacion.md)),
ni la tabla de países.

Países con precios: Países Bajos, España, Alemania, Francia, Italia y
Portugal. Una cosa sin precio en el país elegido no se muestra en las
listas; una meta que ya la tenía (de un archivo) conserva el de Países
Bajos y lo dice ("precios de Países Bajos").

## Los precios

Euros de hoy, redondeados como los publica cada fuente. "≈" marca las
estimaciones: los que se calculan a partir de otras cifras (vivienda,
viajes, meses de vida) y las cifras redondeadas o de una fuente débil.

### Para todos los países

| Deseo | Precio | Cálculo | Fuente |
| --- | --- | --- | --- |
| Un fin de semana en una capital europea | ≈ 448 € | 2 noches × 224 € | Eurostat, *Tourism statistics – expenditure*: gasto medio por noche de los residentes de la UE en viajes cortos (1 a 3 noches) al extranjero, 2024, transporte incluido |
| Un mes por el Sudeste Asiático | ≈ 640 € | Media con alquiler de Tailandia (770), Vietnam (620), Indonesia (510), Malasia (710) y Filipinas (600), redondeada a 10; sin el vuelo | [Coste de vida](coste-de-vida.md), septiembre de 2026 |
| Un viaje a Japón | ≈ 2.320 € | 392.251 ¥ / 169,04 ¥ por euro, redondeado a 10; sin el vuelo | Agencia de Turismo de Japón, *Encuesta de consumo de los visitantes extranjeros* 2025, cifras definitivas (確報, [31 de marzo de 2026](https://www.mlit.go.jp/kankocho/content/002020046.pdf)): gasto en Japón por visitante de Alemania. BCE: cambio medio de 2025 ([serie EXR.A.JPY.EUR.SP00.A](https://data.ecb.europa.eu/data/datasets/EXR/EXR.A.JPY.EUR.SP00.A)) |

### Por país

| Deseo | Países Bajos | España | Alemania | Francia | Italia | Portugal |
| --- | --- | --- | --- | --- | --- | --- |
| Un coche usado | 24.334 | 17.758 | 18.310 | 20.200 | 21.273 | 24.200 |
| Un coche nuevo | 50.026 (1.er semestre) | 44.419 | 44.560 | 34.600 | 29.600 | — |
| Una boda | 23.675 | 25.183 | 15.629 | 19.293 | 25.970 | ≈ 18.570 |
| Precio por m² de vivienda | 4.726 | 2.230 | 2.300 | 3.005 | 1.855 | 2.239 |
| Una vivienda de 80 m², pagada | ≈ 378.080 | ≈ 178.400 | ≈ 184.000 | ≈ 240.400 | ≈ 148.400 | ≈ 179.120 |
| La entrada de una vivienda (20 % de 80 m²) | ≈ 75.616 | ≈ 35.680 | ≈ 36.800 | ≈ 48.080 | ≈ 29.680 | ≈ 35.824 |
| Un año sin trabajar (12 meses con alquiler) | ≈ 26.280 | ≈ 17.280 | ≈ 19.800 | ≈ 18.600 | ≈ 17.520 | ≈ 16.920 |
| Tasas de un año de universidad pública | 2.601 | 922 | 0 | 178 | ≈ 1.550 | 697 |
| Un año de universidad (12 meses + tasas) | ≈ 28.881 | ≈ 18.202 | ≈ 19.800 | ≈ 18.778 | ≈ 19.070 | ≈ 17.617 |
| Vivir sin trabajar: al mes, con alquiler | 2.190 | 1.440 | 1.650 | 1.550 | 1.460 | 1.410 |
| Vivir sin trabajar: capital al 4 % | 657.000 | 432.000 | 495.000 | 465.000 | 438.000 | 423.000 |

"—": sin cifra publicada encontrada; la cosa no sale con esos precios.

Fuentes por país (la app muestra el editor, lo que mide y la fecha):

- **Coche usado** (precios de anuncio salvo Alemania):
  Países Bajos, AutoScout24, análisis anual 2025
  ([Jahresanalyse 2025](https://www.autoscout24.de/unternehmen/daten/jahresanalyse-2025-europaeischer-gebrauchtwagenmarkt-zeigt-sich-stabil/));
  España, coches.net,
  media de 2025 (citado en [Vozpópuli](https://www.vozpopuli.com/motor/el-mercado-de-segunda-mano-cerro-con-22-millones-de-coches-y-casi-18000-euros-de-media.html));
  Alemania, DAT-Report 2026, precio pagado por particulares en 2025;
  Francia, La Centrale, 3.er trimestre de 2025 (citado en
  [Auto Infos](https://www.auto-infos.fr/article/le-prix-moyen-d-une-voiture-d-occasion-se-stabilise-enfin-sous-les-20-000-euros.292679));
  Italia, AutoScout24 Italia, análisis anual 2025 (citado en
  [Auto.it](https://www.auto.it/news/attualita/2026/01/27-8601773/mercato-auto-usate-2025-analisi-autoscout24));
  Portugal, Standvirtual, precio medio de los vendedores profesionales,
  diciembre de 2025, 24.200 € (Automonitor/Lusa, citado en
  [Executive Digest](https://executivedigest.sapo.pt/?p=706996)).
- **Coche eléctrico usado** (solo Países Bajos): AutoScout24, media de
  2025, 34.600 €
  ([26 de enero de 2026](https://www.autoscout24.nl/bedrijf/occasion-dashboard/prijs-tweedehands-elektrische-auto-blijft-dalen-28-procent-goedkoper-dan-in-2022/)).
- **Placas solares** (solo Países Bajos): Milieu Centraal, precio
  orientativo de 10 placas de 435 Wp instaladas (placas, inversor y
  montaje, 0 % de IVA), 3.800 €
  ([Kosten en opbrengst zonnepanelen](https://www.milieucentraal.nl/energie-besparen/zonnepanelen/kosten-en-opbrengst-zonnepanelen/)).
- **Coche nuevo:** Países Bajos, RAI Vereniging, **primer semestre de
  2025** (citado en
  [NL Times](https://nltimes.nl/2025/08/04/new-car-prices-netherlands-soar-past-eu50000-leaving-many-buyers-priced);
  no se encontró la cifra del año completo; en la app la fecha es
  2025-06); España,
  [Barómetro VN coches.com / Ganvam](https://images.coches.com/_news_/2026/01/2026-01-Ndp-VN-Barometro-cochescom-ganvam.pdf),
  2025, precios de los concesionarios con descuentos y sin ayudas;
  Alemania, DAT-Report 2026, precio pagado por particulares; Francia,
  Institut Mobilités en transition y C-Ways, 2025, precio de catálogo
  (citado en [CB News](https://www.cbnews.fr/node/101453)); Italia,
  Fleet&Mobility Research Center con matriculaciones de Dataforce, 2025,
  valor medio por coche matriculado descontados los descuentos, 29.600 €
  (35.362 € de catálogo; citado en
  [ANIASA, 30 de junio de 2026](https://www.aniasa.it/aniasa/aniasa-informa/public/news/6755)).
  Portugal: no se encontró una media publicada.
- **Boda** (encuestas a parejas salvo Países Bajos y Portugal): Países
  Bajos, ThePerfectWedding.nl, **suma de las tarifas mínimas o medias de
  los proveedores de bodas con perfil en su web, sin luna de miel; no es
  una encuesta a parejas** y no tiene año
  ([Wat kost trouwen?](https://www.theperfectwedding.nl/artikelen/92/wat-kost-trouwen));
  en la app figura como precios de anuncio; España, Bodas.net, *Informe de la Industria Nupcial 2026*
  (bodas de 2025, sin luna de miel ni anillos); Alemania, Bridebook,
  *Wedding Report 2025*; Francia, Mariages.net, *Rapport du Secteur
  Nuptial 2026* (bodas de 2025, unos 90 invitados); Italia,
  Matrimonio.com, *Rapporto 2026* (bodas de 2025, sin luna de miel);
  Portugal, Fixando, estimación para 100 invitados, 2025.
- **Vivienda, precio por m²:** Países Bajos, NVM, mediana de las viviendas
  existentes vendidas, 4.º trimestre de 2025
  ([anexo 2](https://www.nvm.nl/media/zecfiqww/bijlage-2-marktoverzicht-bestaande-bouw-nederland-4e-kwartaal-2025.pdf));
  España, Ministerio de Vivienda y Agenda Urbana, valor tasado medio de la
  vivienda libre, 4.º trimestre de 2025; Alemania, *Immobilienmarktbericht
  Deutschland 2025* del Arbeitskreis der Oberen Gutachterausschüsse con el
  BBSR, pisos usados, segmento medio, 2024
  ([nota de prensa](https://redaktion-akoga.niedersachsen.de/download/224011/Immobilienmarktbericht_2025_Pressetext.pdf));
  Francia, FNAIM, media nacional a 1 de enero de 2026
  ([avance de enero de 2026](https://www.galivel.com/media/files/point_marche_avant_premiere_fnaim___conference_de_presse_janvier_2026.pdf));
  Italia, idealista, precio medio de anuncio, noviembre de 2025
  ([informe del 2 de diciembre de 2025](https://www.idealista.it/news/immobiliare/residenziale/2025/12/02/296264-prezzi-delle-case-in-crescita-novembre-chiude-con-1-4-scopri-i-valori-nella-tua));
  Portugal, INE, tasación bancaria mediana de pisos, 2025 (la misma
  cifra que "Un piso de 80 m² en Portugal").
- **Tasas de universidad** (grado, estudiantes de la UE): Países Bajos,
  Rijksoverheid, tasa legal 2025-2026; España, Ministerio de Ciencia,
  Innovación y Universidades, precio público medio del crédito de grado
  2024-2025, 15,37 € × 60 créditos; Alemania, sin matrícula en las
  universidades públicas (DAAD), la cuota semestral (unos 100–400 €) no se
  incluye; Francia, tasa nacional de licence 2025-2026
  ([service-public.gouv.fr](https://www.service-public.gouv.fr/particuliers/vosdroits/F2865));
  Italia, MUR (Ministerio de Universidad e Investigación), *Focus sulla
  contribuzione studentesca*, curso 2024/25: media que paga quien paga en
  las universidades estatales (959 € sobre todos los estudiantes; citado en
  [Affaritaliani](https://www.affaritaliani.it/economia/cara-universita-quanto-mi-costi-tasse-affitti-borse-di-studio-e-spese-il-conto-per-le-famiglie-italiane.html));
  Portugal, propina máxima de licenciatura 2025-2026, congelada en 697 €
  desde 2021 ([RTP](https://www.rtp.pt/noticias/economia/orcamento-do-estado-oposicao-mantem-congelamento-das-propinas-no-proximo-ano-letivo_n1700397)).
- **Meses de vida** (año sin trabajar, año de universidad, vivir sin
  trabajar): [coste de vida](coste-de-vida.md), con
  alquiler, septiembre de 2026.

Consultadas entre el 3 y el 7 de octubre de 2026. Desde el entorno donde
se escribió la ficha no se pudieron abrir varias webs (ec.europa.eu,
mlit.go.jp, honichi.com, travelvoice.jp, entre otras): sus cifras se
leyeron en buscadores o en prensa que las cita. **Marek debe abrir cada
fuente y confirmar la cifra y su fecha** (ver lo pendiente al final).

## Supuestos

- Un precio medio nacional representa lo que costaría a una persona de
  ese país; las ciudades caras cuestan mucho más.
- Los precios suben con la inflación: en euros de hoy, no cambian.
- La entrada es el 20 % del precio (lo habitual que presta un banco: el
  80 %); los impuestos y gastos de la compra no se incluyen.
- 80 m² es una vivienda de tamaño medio para una persona o una pareja, la
  misma en todos los países para poder compararlos.
- Viajar un mes por el Sudeste Asiático cuesta lo que vivir allí un mes
  con alquiler; los vuelos largos no se incluyen.
- La región del idioma del navegador es el país donde vive la persona.

## Validación (tests)

- `src/lib/connections.test.ts`: cada precio calculado se rehace desde
  sus datos (80 m² × precio por m², el 20 %, 2 × 224 €, 392.251 ¥ / 169,04,
  15,37 € × 60); cada país tiene editor, nota y fecha; Países Bajos está
  siempre; las tasas cubren los seis países; un dato mal escrito hace
  fallar la carga.
- `src/lib/calculator.test.ts`: cada lista según el país (sin bici
  eléctrica neerlandesa con precios de España, sin coche nuevo con los de
  Portugal); meses de vida con alquiler; una meta de un archivo conserva
  el precio de Países Bajos y lo dice.
- `src/lib/wishes.test.ts`: las prioridades de la persona primero; un
  ejemplo por área, en su orden; el más caro dentro de los años del plan
  y, si no, el más barato; lo que tarda más de 60 años; vivir sin trabajar
  con el coste del país; que los mismos números dan los mismos deseos.
- `src/lib/wish-country.test.ts` y `packages/seed-kit/test/detect.test.ts`:
  la región de cada idioma, Países Bajos por defecto, y que no se guarda
  (ni en el archivo ni en el navegador).
- `src/components/money/entry.test.ts`: la línea bajo el número grande,
  cada deseo con su cuándo e icono, el selector "Precios de".
- `e2e/money.test.mts`: en el navegador, con idioma `es-ES` salen precios
  de España; tocar un ejemplo lo añade a Mis metas como prioridad y pasa
  al principio de la línea; cambiar el país cambia los precios de la
  línea y de Mis metas; nada queda en el almacenamiento.

## Límites

- No es un presupuesto: son medias nacionales, y cada fuente mide algo
  distinto (precio de anuncio, precio pagado, de catálogo, tasación,
  encuesta).
- Solo seis países tienen precios; el resto ve los de Países Bajos.
- Los viajes no incluyen los vuelos largos, que pueden costar tanto como
  el viaje.
- Las encuestas de bodas las hacen webs de bodas, cuyas parejas gastan
  más que la media.

## Lo discutible

1. **Bases distintas por país.** España y Portugal usan tasaciones;
   Países Bajos, Alemania y Francia, ventas; Italia, anuncios. Los coches
   mezclan anuncios, precios pagados y de catálogo. Comparar países es
   aproximado. *Coste:* buscar una sola fuente europea por cosa (para la
   vivienda no existe en niveles, solo en índices).
2. **Medianas y medias.** Países Bajos y Portugal publican medianas; los
   demás, medias. La media suele estar por encima. *Coste:* ninguno sin
   datos nuevos; anotarlo.
3. **Años distintos.** Alemania (vivienda) es de 2024, las tasas de
   Italia del curso 2024/25 y el coche nuevo de Países Bajos del primer
   semestre de 2025; el resto, de 2025. *Coste:* actualizar cuando salgan.
4. **80 m² y el 20 %.** En Países Bajos la vivienda media es más grande y
   los bancos prestan hasta el 100 % del valor; en España, el 80 %, y los
   impuestos de la compra rondan el 10 %. Un solo tamaño y una sola
   entrada simplifican. *Coste:* un tamaño y una entrada por país, con su
   fuente.
5. **"El más caro dentro de los años del plan" decide.** Con precios de
   España, 20.000 € y 400 € al mes durante 20 años, sale la vivienda
   entera (178.400 €), no la entrada: la regla mira el precio y el plan,
   no lo que importa más a cada uno. Por eso las prioridades de la
   persona van primero. *Coste:* investigar qué deseos expresan los
   europeos (ver el pendiente de investigación) y ordenar los ejemplos
   con esos datos.
6. **Tres áreas de seis.** La línea muestra experiencias, vivienda y
   tiempo; tranquilidad, aprendizaje y proyectos propios no tienen aún
   ejemplos en la línea. *Coste:* fichas de esas áreas, con fuentes.
7. **El idioma no es el país.** Una persona española que vive en Países
   Bajos con el navegador en `es-ES` ve precios de España. El selector
   está a la vista para cambiarlo. *Coste:* ninguno sin preguntar o
   guardar algo, que la app no hace.
8. **Japón con un solo país.** El gasto de los visitantes de Alemania
   (los que más gastan junto con los del Reino Unido) se usa para todos;
   las estancias de los europeos en Japón son largas (más de dos semanas).
   *Coste:* usar la media de los países europeos de la encuesta.
9. **Estudiar no es solo un grado.** Un máster puede costar mucho más que
   las tasas de grado (en Países Bajos y España); en Italia, la tasa
   depende de la renta. *Coste:* una cosa más, "un año de máster", con
   sus tasas por país.

## Pendiente de comprobar a mano (Marek)

- Abrir cada fuente de la tabla por país y confirmar cifra, fecha y lo
  que mide; en especial las leídas solo en prensa o buscadores: DAT-Report
  2026, Bridebook, Bodas.net, Mariages.net, Matrimonio.com, Fixando,
  el valor tasado del Ministerio de Vivienda (4.º trimestre de 2025).
  Verificado el 8 de octubre de 2026 (ver
  `projects/wealth-lens/docs/continuity-2026-10-08.md`); siguen sin abrir
  en su fuente primaria: la tabla del Ministerio de Vivienda, el
  documento del MUR, el informe de Standvirtual y la cifra del año
  completo 2025 de RAI Vereniging.

## Historial

- 2026-10-07: primera ficha. Los deseos ("Con esto podrías"), los precios
  por país (seis países) y "Precios de" por el idioma del navegador. Se
  dejan de listar, sin borrarlas para las metas de archivos antiguos: la
  entrada del 10 % y la casa media de Países Bajos (ahora la vivienda de
  80 m² y su entrada del 20 %) y el máster en Países Bajos (ahora un año
  de universidad). La boda, el coche usado y el coche nuevo pasan de un
  precio neerlandés a uno por país.
- 2026-10-07 (2): la regla de la línea sigue la aclaración de Marek del 5
  de octubre en `docs/direction.md`: primero las prioridades de la
  persona; después un ejemplo por área (experiencias, vivienda, tiempo),
  el más caro dentro de los años del plan; sin "corto, medio y largo" ni
  la lista de países para vivir más barato. "Dejar de trabajar" pasa a
  ser la meta "Vivir sin trabajar" de las [metas personales](metas-personales.md).
- 2026-10-08: correcciones tras comprobar las fuentes, sin cambiar la
  regla. Japón: cifra definitiva (392.251 ¥) y cambio del BCE de 169,04 ¥
  → 2.320 €. Coche usado: Países Bajos 24.334 €, Portugal 24.200 €.
  Coche nuevo: Países Bajos marcado como primer semestre de 2025 (fecha
  2025-06), Italia 29.600 € (2025, ya no aproximado). Eléctrico usado de
  Países Bajos: media de 2025, 34.600 €. Placas solares: 3.800 €.
  Vivienda en Italia: misma cifra, fuente idealista (no Immobiliare.it).
  Tasas de Italia: fuente MUR, curso 2024/25 (no Federconsumatori), base
  oficial. Boda en Países Bajos: tarifas de proveedores, no encuesta
  (base "precios de anuncio").
