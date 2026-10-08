# Handoff — 2026-10-08: entry points, and the figures checked before launch

Base: master at c2513bd (prices of 2026-10-08). Branch
`hermes/handoff-2026-10-08` (PR #34). Three tasks today:
- the entry points: this handoff, and the removal of the root
  `HANDOFF.md`;
- a check of the figures before launch, findings only;
- the corrections Marek chose from that check (data, citations and
  texts, no logic). They are listed under "Corrections applied".

## State of master

- PRs #26–#33 are merged. Phase 5 (wishes and prices by country, #32) and
  phase 6 (Check your plan, #33) are on master; the handoff of 2026-10-07
  describes both.
- The daily "Update prices" workflow ran successfully every day from
  2026-10-04 to 2026-10-08.
- Wealth Lens is live on Vercel. Cost Lens and Inflation Lens remain hidden
  betas.

## PR #17: hosting migration (clarified by Marek, 2026-10-08)

PR #17 is the planned move from Vercel to a real European host
(statichost.eu, one static site: hub at `/`, Wealth Lens at
`/wealth-lens/`). It is **not discarded**: it waits until the pages are
polished. Marek decides when it starts. Until then do not touch the PR or
its branch. It now conflicts with master (opened 2026-10-01, before
phases 1–6), so it will need rebasing or redoing against current master
when it is resumed; docs/hosting.md has the steps.

## Entry points corrected

- The root `HANDOFF.md`, added on 2026-10-07 outside the dated-handoff
  rule, is removed: it duplicated docs/direction.md, listed #26–#29 as
  pending, phase 5 as not implemented and PR #17 as discarded, none of
  which is true. The rule in AGENTS.md stands: the current status is the
  `continuity-*.md` with the highest date in this folder.
- Order to read before working: AGENTS.md → docs/direction.md → the
  product README → the latest handoff here → the relevant sheets in
  research/.

## Public and private material

This repository is public. Everything committed (including docs/,
research/ and these handoffs) can be read by anyone, and stays in the git
history even if a file is later removed. Methods and sources are public by
principle (docs/direction.md, principle 2); the code is proprietary
(LICENSE). Internal reasoning that should not be published (business
thinking, personal context, unconfirmed ideas) belongs outside this
repository, in Marek's private notes, and must not be copied here.

## Figures checked before launch (2026-10-08)

Scope asked by Marek: the wish prices (`src/data/connections.json`,
research/wealth-lens/deseos.md), the Japan figure, and the UBS and
academic sources (research/wealth-lens/valor-inicial.md, crecimiento.md,
tasa-de-retiro.md, futuros-simulados.md, decada-mala.md,
research/educacion/kelly.md). Each figure was looked up at its publisher
where it could be opened. Five figures were re-checked by hand at the
source: the Japan final figure, the ECB rate, Milieu Centraal's solar
price, Standvirtual's December price and the two Italian housing
figures.

Verdicts: **OK** matches; **wrong** the number or its publisher is not
what the app says; **partly** the number exists but its date, period,
method or citation differs; **unverified** no primary source could be
opened. "Secondary" means the figure was read in press that cites the
publisher, not at the publisher.

### Wrong: change before launch

| Figure (app) | Correct value | Source |
| --- | --- | --- |
| Italy, price per m², 1,855 € "Immobiliare.it Insights, Nov 2025" | 1,855 € is **idealista** (Nov 2025, average asking price). Immobiliare.it gives **2,139 €/m²** (Nov 2025) and 2,145 €/m² at the end of 2025. Change the publisher, or the value and every 80 m² figure (home 171,120 €, deposit 34,224 € at 2,139). | [idealista, 2 Dec 2025](https://www.idealista.it/news/immobiliare/residenziale/2025/12/02/296264-prezzi-delle-case-in-crescita-novembre-chiude-con-1-4-scopri-i-valori-nella-tua); [Immobiliare.it, press release](https://media.immobiliare.it/get_pdf_news.php?newsId=2765); [Immobiliare.it, year-end](https://media.immobiliare.it/get_pdf_news.php?newsId=2789) |
| NL, 10 solar panels installed, 5,000 € (Milieu Centraal) | **3,800 €** for 10 panels of 435 Wp, installed (6 panels 2,500 €, 8 panels 3,200 €). 5,000 € was Milieu Centraal's older figure. | [Milieu Centraal](https://www.milieucentraal.nl/energie-besparen/zonnepanelen/kosten-en-opbrengst-zonnepanelen/) |

### Partly: right number, wrong date, period, method or citation

| Figure (app) | Finding | Source |
| --- | --- | --- |
| Japan trip, 393,710 ¥ (JTA 2025, preliminary) | OK as the preliminary (速報, 21 Jan 2026). The **final** (確報, 31 Mar 2026) is **392,251 ¥** for Germany (UK 391,320 ¥). Germany is still the highest. With the final figure the trip is **2,320 €**, not 2,330 €. | [JTA preliminary](https://www.mlit.go.jp/kankocho/content/001977997.pdf); [JTA final](https://www.mlit.go.jp/kankocho/content/002020046.pdf) |
| ECB average 2025, 169.07 ¥/€ | The ECB series gives **169.04** (169.0434). The rounded euro amount does not change (393,710 / 169.04 = 2,329 → 2,330). | [ECB EXR.A.JPY.EUR.SP00.A](https://data.ecb.europa.eu/data/datasets/EXR/EXR.A.JPY.EUR.SP00.A) |
| NL used car, 24,326 € (AutoScout24, 2025) | AutoScout24's 2025 annual analysis gives **24,334 €** (NL). 24,326 € was not found anywhere. | [AutoScout24, Jahresanalyse 2025](https://www.autoscout24.de/unternehmen/daten/jahresanalyse-2025-europaeischer-gebrauchtwagenmarkt-zeigt-sich-stabil/) |
| PT used car, 24,214 € (Standvirtual, Dec 2025) | The cited article says **24,200 €** (professional sellers, Dec 2025). 24,214 € seems to be a different figure (H1 2024). Standvirtual's own report could not be opened (403). | [Executive Digest / Automonitor](https://executivedigest.sapo.pt/?p=706996) |
| FR used car, 20,200 € (La Centrale, Q3 2025) | The value is right for Q3 2025, but the cited Auto Infos article does not contain it (it says 19,990 €, "under 20,000 €"). Cite La Centrale's observatory. La Centrale's 2025 annual average is 19,999 €. | [La Centrale, Q3 2025](https://offre-pro.lacentrale.fr/observatoire-prix-q3-2025/); [La Centrale, Q4 2025](https://presse.lacentrale.fr/wp-content/uploads/sites/4/2026/09/CP_La-Centrale_191225_Observatoire-T4-2025.pdf) |
| NL new car, 50,026 € (RAI, "2025") | It is the **first half of 2025**, not the full year. Mobiliteit in Cijfers gives 50,110 € for 2025 with data to May. No full-year figure was found. All secondary; RAI's PDF could not be opened. | [NL Times, 4 Aug 2025](https://nltimes.nl/2025/08/04/new-car-prices-netherlands-soar-past-eu50000-leaving-many-buyers-priced) |
| IT new car, ≈ 30,000 € (Fleet&Mobility, 2024) | 2024 "reached 30,000 €" (not "over"). A 2025 figure now exists: **29,600 €** net of discounts (35,362 € list). | [ANIASA / Fleet&Mobility, 30 Jun 2026](https://www.aniasa.it/aniasa/aniasa-informa/public/news/6755) |
| NL wedding, 23,675 € ("survey of couples, 2025") | The number is right, but it is **not a survey**: ThePerfectWedding adds up the rates of suppliers listed on its site. It has no year. The basis should not be "survey". | [ThePerfectWedding.nl](https://www.theperfectwedding.nl/artikelen/92/wat-kost-trouwen) |
| IT university fees, ≈ 1,550 € (Federconsumatori 2025-2026) | 1,550 € is the **MUR** figure for **2024/25** (average paid by students who pay, state universities; 959 € over all students). It is not Federconsumatori's figure, and the cited Federconsumatori PDF returns 404. Secondary; the MUR document could not be opened. | [Affaritaliani, citing MUR](https://www.affaritaliani.it/economia/cara-universita-quanto-mi-costi-tasse-affitti-borse-di-studio-e-spese-il-conto-per-le-famiglie-italiane.html) |
| NL used electric car, 35,047 € (AutoScout24, 2025) | 35,047 € is **October 2025**. The 2025 average is **34,600 €**. | [AutoScout24 NL, 26 Jan 2026](https://www.autoscout24.nl/bedrijf/occasion-dashboard/prijs-tweedehands-elektrische-auto-blijft-dalen-28-procent-goedkoper-dan-in-2022/) |
| UBS 2025, world equities 5.2% real (1900–2024) | **OK**, but the cited UBS press release does not contain 5.2% / 1.7% / 0.5%. Cambridge Judge, the second source cited, does. Cite that for the numbers. | [Cambridge Judge, 7 Mar 2025](https://www.jbs.cam.ac.uk/2025/report-stocks-have-far-outperformed-over-the-past-125-years/) |
| MacLean, Thorp and Ziemba (2010), "Good and bad properties of the Kelly criterion" | The 2010 journal article is "Long-term capital growth: the good and bad properties of the Kelly and fractional Kelly capital growth criteria", *Quantitative Finance* 10(7): 681–687. The short title is the chapter in the 2011 book (pp. 563–572). | [doi:10.1080/14697688.2010.506108](https://doi.org/10.1080/14697688.2010.506108) |
| Shiller data, econ.yale.edu/~shiller/data.htm | The page is live, but the data files (ie_data.xls) now live at shillerdata.com. | [Shiller, Online Data](http://www.econ.yale.edu/~shiller/data.htm); [shillerdata.com](https://shillerdata.com/) |

### OK: matches its source

| Figure | App value | Source |
| --- | --- | --- |
| Eurostat, short trips abroad per night, 2024 | 224 € (223.70; transport included). Weekend 448 € holds. The average short trip costs 489.51 €, so 448 € is conservative. | [Eurostat tour_dem_extot](https://ec.europa.eu/eurostat/databrowser/view/tour_dem_extot/default/table) |
| ES used car (coches.net, 2025) | 17,758 €; cite coches.net rather than Vozpópuli | [coches.net](https://www.coches.net/noticias/precio-medio-vehiculo-ocasion-2025) |
| DE used car / new car (DAT-Report 2026, paid) | 18,310 € / 44,560 € | [DAT-Report 2026 Kurzbericht](https://www.dat.de/fileadmin/de/images/produkte/DAT_Report/DAT_Report_NEW/2026/DAT-Report-2026-Kurzbericht.pdf) |
| IT used car (AutoScout24, 2025) | 21,273 € | [AutoScout24, Jahresanalyse 2025](https://www.autoscout24.de/unternehmen/daten/jahresanalyse-2025-europaeischer-gebrauchtwagenmarkt-zeigt-sich-stabil/) |
| ES new car (Barómetro coches.com / Ganvam 2025) | 44,419 € (checked in coches.com's article; the PDF is an image) | [coches.com](https://noticias.coches.com/informes/evolucion-precios-coches-nuevos-2025/563523) |
| FR new car (IMT / C-Ways 2025, list) | 34,600 €; cite the IMT PDF rather than CB News | [IMT barometer 2025](https://institut-mobilites-en-transition.org/wp-content/uploads/2026/06/Barometre-prix-vehicules-2025.pdf) |
| ES wedding (Bodas.net) | 25,183 €; the report is named "Informe del Sector Nupcial 2026"; it excludes the engagement ring, not the wedding rings | [Bodas.net](https://www.bodas.net/articulos/cuanto-cuesta-casarse--c841) |
| DE wedding (Bridebook 2025) | 15,629 € | [Bridebook](https://articles.bridebook.dev/de/article/was-kostet-eine-hochzeit-der-deutschlandweite-durchschnitt/) |
| FR wedding (Mariages.net 2026) | 19,293 € | [Mariages.net](https://www.mariages.net/articles/quel-budget-pour-mon-mariage--c6243) |
| IT wedding (Matrimonio.com 2026) | 25,970 €; the publisher's page says "about 26,000 €"; the exact figure is secondary | [Matrimonio.com](https://www.matrimonio.com/articoli/come-sopravvivere-organizzazione-matrimonio-curiosita-tradizioni-italia--c11048) |
| PT wedding (Fixando, 2025) | ≈ 18,570 €; secondary; like NL it is built from supplier prices, not a survey (Fixando 2026: 21,127 €) | [Notícias ao Minuto](https://www.noticiasaominuto.com/economia/2985814/dizer-sim-esta-bem-mais-caro-afinal-quanto-custa-casar-em-portugal) |
| NL tuition fee 2025-2026 | 2,601 € | [Rijksoverheid](https://www.rijksoverheid.nl/vraag-en-antwoord/hoger-onderwijs/hoogte-van-het-collegegeld-hogeschool-universiteit) |
| ES price per credit 2024-2025 | 15.37 € × 60 = 922 €; no national 2025-2026 average is published | [Ministerio de Ciencia, Innovación y Universidades](https://estadisticas.universidades.gob.es/jaxiPx/Datos.htm?path=/Universitaria/PreciosPublicos/2024/Grado//l0/&file=PM_Grado_Rama_Tot.px) |
| DE tuition | 0 €; the 100–400 € semester-fee range is not on DAAD's page (unverified) | [DAAD](https://www.daad.de/en/studying-in-germany/living-in-germany/finances/) |
| FR licence fee 2025-2026 | 178 € (master 254 €); the 105 € CVEC is extra | [service-public.gouv.fr](https://www.service-public.gouv.fr/particuliers/vosdroits/F2865) |
| PT maximum tuition | 697 €, also frozen for 2026-2027 | [RTP](https://www.rtp.pt/noticias/economia/orcamento-do-estado-oposicao-mantem-congelamento-das-propinas-no-proximo-ano-letivo_n1700397) |
| NL price per m² (NVM, Q4 2025) | 4,726 € | [NVM annex 2](https://www.nvm.nl/media/zecfiqww/bijlage-2-marktoverzicht-bestaande-bouw-nederland-4e-kwartaal-2025.pdf) |
| ES price per m² (MIVAU, Q4 2025) | 2,230 €; secondary, the ministry's table could not be opened | [Europa Press](https://www.europapress.es/economia/construccion-y-vivienda-00342/noticia-precio-medio-vivienda-libre-marca-nuevo-record-cierre-2025-subir-131-20260219112855.html); [MIVAU series](https://www.mivau.gob.es/el-ministerio/observatorios-y-estadisticas/estadisticas/valor-tasado-vivienda) |
| DE price per m² (AK OGA / BBSR, 2024) | 2,300 €; the cited AK OGA press PDF does not give the number, the BBSR note does | [BBSR, 28 Aug 2025](https://www.bbsr.bund.de/BBSR/DE/startseite/topmeldungen/immobilienmarktanalyse-gutachterausschuesse-2024.html) |
| FR price per m² (FNAIM, 1 Jan 2026) | 3,005 € (existing homes only, net seller price) | [FNAIM, January 2026](https://docs.fnaim.fr/FNAIM/Conference-de-Presse/2026/PPT_Conference-de-presse_FNAIM_Janvier-2026.pdf) |
| PT price per m² (INE, 2025) | 2,239 €, the 2025 annual median (December alone: 2,415 €) | [INE](https://www.ine.pt/ngt_server/attachfileu.jsp?look_parentBoui=774042570&att_display=n&att_download=y) |
| NL average existing home 2025 (CBS) | 480,000 € | [CBS, 17 Feb 2026](https://www.cbs.nl/nl-nl/nieuws/2026/08/koopwoning-kostte-gemiddeld-480-duizend-euro-in-2025) |
| NL e-bike 2025 (RAI / BOVAG) | 2,872 € | [BOVAG, 9 Feb 2026](https://mijn.bovag.nl/actueel/nieuws/fietsverkoop-loopt-terug-in-2025-e-bikes-houden-omzet-op-peil) |
| NL driving licence 2025 (CBR) | 3,320 €; secondary. CBR now shows 3,625 € for H1 2026. | [Transport Online](https://www.transport-online.nl/138632/cbr-brak-vorig-jaar-3-570-rijexamens-af-vanwege-verkeersgevaarlijk-rijden/); [CBR](https://www.cbr.nl/nl/rijbewijs-halen/auto/wat-kost-het-halen-van-een-autorijbewijs) |
| NL student debt, start of 2025 | 18,200 € mean, 10,300 € median; the publisher is **CBS** (DUO data), not DUO | [CBS](https://www.cbs.nl/nl-nl/nieuws/2025/39/opnieuw-minder-mensen-met-studieschuld) |
| NL hybrid heat pump (Milieu Centraal) | 6,200 €, subsidy 2,125 € | [Milieu Centraal](https://www.milieucentraal.nl/energie-besparen/duurzaam-verwarmen-en-koelen/hybride-warmtepomp/) |
| UBS 2026, US equities 6.6% real (1900–2025) | 6.6%. Its public summary indeed gives no real world-equity figure (only developed 8.5% vs emerging 6.9%, nominal USD). | [UBS GIRY 2026 summary](https://www.ubs.com/content/dam/assets/wm/static/cio/documents/giry2026-summary-public.pdf) |
| World equities long-run volatility ≈ 17% | Plausible: 17.4% (1900–2014) and 17.7% in older DMS editions, read secondary; no 2025-edition figure found | [Financial Planning Research Journal](https://sciendo.com/es/article/10.2478/fprj-2016-0004?tab=article) |
| Kelly (1956), BSTJ 35(4): 917–926 | OK | [doi:10.1002/j.1538-7305.1956.tb03809.x](https://doi.org/10.1002/j.1538-7305.1956.tb03809.x) |
| Merton (1969), REStat 51(3) | OK (pp. 247–257) | [doi:10.2307/1926560](https://doi.org/10.2307/1926560) |
| Samuelson (1979), JBF 3(4) | OK (pp. 305–307) | [doi:10.1016/0378-4266(79)90023-2](https://doi.org/10.1016/0378-4266(79)90023-2) |
| Thorp (2006), Handbook of ALM vol. 1 | OK (ch. 9, pp. 385–428) | [doi:10.1016/S1872-0978(06)01009-X](https://doi.org/10.1016/S1872-0978(06)01009-X) |
| Kelly sheet: chance of ever halving, 50% full Kelly, 12.5% half Kelly, x^(2/c−1) | OK: Thorp (2006), eq. 7.13, "1/2 for f = f* but only 1/8 for f = f*/2". It is a continuous-time approximation. | same DOI |
| MacLean, Thorp, Ziemba (eds., 2011), World Scientific | OK | [doi:10.1142/7598](https://doi.org/10.1142/7598) |
| Bengen (1994), JFP 7(4) | OK (pp. 171–180) | [FPA](https://www.financialplanningassociation.org/learning/publications/journal/OCT94-determining-withdrawal-rates-using-historical-data) |
| Cooley, Hubbard, Walz (1998), AAII Journal 20(2); ≥ 95% at 4% for 30 years with half or more in stocks | OK (100% stocks 95%, 75/25 98%, 50/50 95%); the table was read secondary (AAII's PDF gave 403) | [AAII, Feb 1998](https://www.aaii.com/journal/199802/feature.pdf) |
| Pfau (2010), JFP 23(12); 4% often failed outside the US | OK: safe in 4 of 17 countries | [FPA, Dec 2010](https://www.financialplanningassociation.org/article/journal/DEC10-international-perspective-safe-withdrawal-rates-demise-4-percent-rule) |
| Guyton and Klinger (2006), JFP 19(3) | OK | [FPA, Mar 2006](https://www.financialplanningassociation.org/article/journal/MAR06-decision-rules-and-maximum-initial-withdrawal-rates) |
| Efron (1979), Annals of Statistics 7(1) | OK | [doi:10.1214/aos/1176344552](https://doi.org/10.1214/aos/1176344552) |
| Pástor and Stambaugh (2012); stocks more volatile in the long run | OK: *Journal of Finance* 67(2): 431–478 (the sheet lacks volume and pages) | [doi:10.1111/j.1540-6261.2012.01722.x](https://doi.org/10.1111/j.1540-6261.2012.01722.x) |
| Acklam, relative error < 1.2·10⁻⁹ | OK; the stated bound is 1.15·10⁻⁹ | [QuantLib](https://github.com/lballabio/QuantLib/blob/master/ql/math/distributions/normaldistribution.hpp) |
| MSCI World page, msci.com/indexes/index/990100 | Live | [MSCI](https://www.msci.com/indexes/index/990100/msci-world-index) |

### Unverified

- **PT new car:** no published national average was found (ACAP,
  Standvirtual). The app already shows none ("—").
- **Not checked today** (outside the scope or not public figures):
  - prices built from the cost-of-living dataset (Numbeo + Wise: the
    month in Southeast Asia, a year off work, a year at university,
    living without working, months in Japan or Portugal);
  - the kitchen (Homedeal), the small business (Brookz, Inter Actus) and
    the Lima flat (BCRP);
  - the legal sheet, which needs a professional.

## Decisions taken

- The check itself changed no figure: Marek asked for findings only. The
  corrections he chose afterwards are in the next section, each with its
  Research entry in the same change (AGENTS.md).
- Where a primary source could not be opened, the verdict says
  "secondary" instead of being upgraded to OK.

## Corrections applied (same day, second task)

Marek chose which findings to apply: data, citations and wording only.
No logic changed. The wishes rule, the calculations and the validation
are the same; only values, sources, dates and texts changed, and the
tests that recompute those values.

| Change | Files |
| --- | --- |
| Japan trip: final figure ¥392,251 (JTA, 31 Mar 2026) at the ECB's ¥169.04 → **2,320 €** (was 2,330 €), source text in EN and ES | `src/data/connections.json` (`trip-japan`), `src/i18n/messages/en.ts`, `es.ts` (`things.items["trip-japan"].source`), `src/lib/connections.test.ts` (recomputes 392251 / 169.04); example comments in `en.ts`, `src/i18n/item-text.ts` and `src/components/money/wishes-line.tsx` |
| NL used car **24,334 €**; source "AutoScout24", annual analysis 2025 | `connections.json` (`used-car.NL`), `src/lib/calculator.test.ts` (goal amount and months) |
| PT used car **24,200 €** (professional sellers, Dec 2025) | `connections.json` (`used-car.PT`), `calculator.test.ts` |
| NL used electric car **34,600 €**, average of 2025 | `connections.json` (`used-ev`) |
| NL new car: no full-year 2025 figure found (RAI's 2025 total in Mobiliteit in Cijfers covers data to May, 50,110 €). Kept **50,026 €** and dated **2025-06**, so the app reads "RAI Vereniging, 2025-06"; the note and the research sheet say "first half of 2025". | `connections.json` (`new-car.NL`) |
| IT new car **29,600 €** (2025, net of discounts); no longer marked "≈" | `connections.json` (`new-car.IT`) |
| NL solar panels **3,800 €** (10 × 435 Wp installed, Milieu Centraal). Nothing else derives from this figure (no test, no calculation). | `connections.json` (`solar-panels`) |
| Italy housing: same 1,855 €/m² (home 148,400 €, deposit 29,680 €), source **idealista**, Nov 2025, link to the 2 Dec 2025 report | `connections.json` (`home.IT`, `home-deposit.IT`), `research/wealth-lens/deseos.md` |
| NL wedding: method described as the sum of suppliers' rates, not a survey of couples; basis changed from `survey` to `asking`, which the app shows as "asking prices" / "precios de anuncio" | `connections.json` (`wedding.NL`), `deseos.md` |
| Italy tuition: source **MUR**, *Focus contribuzione studentesca*, academic year **2024/25** (date 2024-09), basis `official`; Federconsumatori and its dead PDF removed | `connections.json` (`study-year.fees.IT`), `deseos.md` |
| UBS 2025: How it works links the **Cambridge Judge** note (which has the 5.2%) instead of UBS's press release; the source name says "as reported by Cambridge Judge Business School" / "según Cambridge Judge Business School" | `en.ts`, `es.ts` (`howItWorks.sources[0]`), `research/wealth-lens/valor-inicial.md` |
| Kelly: MacLean, Thorp and Ziemba (2010), "Long-term capital growth: the good and bad properties of the Kelly and fractional Kelly capital growth criteria", *Quantitative Finance* 10(7): 681–687 | `research/educacion/kelly.md` |

Research sheets updated with a dated *Historial* entry: `deseos.md`
(tables, sources by country, the "Lo discutible" point on different years,
the pending list), `valor-inicial.md` and `kelly.md`.

Verification in `projects/wealth-lens`:
- `npm run lint`, `npm run typecheck`, `npm test` (64 files, 841 tests)
  and a clean `npm run build` (`rm -rf .next out`) passed.
- In the built site, the new Japan figure is in the page scripts. The
  Cambridge Judge link is on How it works, and the old UBS link is in no
  page.
- The browser tests (`e2e/`) were not run.

Limits of what was applied:
- **NL new car:** the app cannot say «1.er semestre 2025» in its own
  words without a code change. The dataset's `source` is shown as it is
  in every language, and `referenceDate` only takes YYYY or YYYY-MM. So it
  shows "2025-06". A localised period label needs a small change in
  `lib/connections.ts` and the messages, left for Marek to decide.
- **NL wedding:** no basis says "suppliers' rates", so `asking` is the
  nearest existing one. A new basis needs a change to `PRICE_BASES` in
  `lib/connections.ts` and to both message files, also left for Marek.
- **PT wedding (Fixando):** it is built the same way as the NL one but was
  not in Marek's list, so it still says `survey`.
- **Citation fixes not applied** (not in Marek's list):
  - FR used car: cite La Centrale's observatory;
  - ES used car: cite coches.net;
  - FR new car: cite the IMT PDF;
  - DE housing: cite the BBSR note;
  - NL student debt: the publisher is CBS;
  - ES wedding: the report's real name;
  - Pástor and Stambaugh: volume and pages;
  - Shiller: data now at shillerdata.com.

## Open for Marek

1. **Review the corrections applied today** (section above). Look in
   particular at:
   - "RAI Vereniging, 2025-06" for the Dutch new car;
   - "asking prices" as the basis of the Dutch wedding.
   Both are compromises, because a label of their own needs code.
2. **Decide whether to allow those two small code changes:** a localised
   period label, and a "suppliers' rates" basis (also for Portugal's
   Fixando wedding).
3. **Fix the remaining citations**, not in today's list:
   - FR used car: cite La Centrale;
   - ES used car: cite coches.net;
   - FR new car: cite the IMT PDF;
   - DE housing: cite the BBSR note;
   - NL student debt: the publisher is CBS;
   - ES wedding: the report's real name;
   - Pástor and Stambaugh: volume and pages;
   - Shiller: shillerdata.com.
4. **Open by hand what nobody could open from here:**
   - the MIVAU table (ES housing);
   - RAI's Mobiliteit in Cijfers (NL new car);
   - Standvirtual's report (PT used car);
   - the MUR document on student fees (IT);
   - Bodas.net and Matrimonio.com's full reports (exact figures).
5. **Carried over from the handoff of 2026-10-07:**
   - the legal sheet needs a professional's review;
   - confirm the wishes rule;
   - confirm the savings check reads as information, not advice;
   - the 12-word warning above 50% growth;
   - a PageSpeed Insights run on the preview.
6. **Hosting:** when to resume PR #17, and with which domain.
7. **Private notes:** where they should live long-term (local notes only,
   or a separate private repository).
