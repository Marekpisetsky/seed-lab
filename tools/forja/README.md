# Forja

**Qué es:** una herramienta interna de seed-lab, no un producto. Genera
proyectos que nacen funcionando: código real, tests que pasan y
verificación en el momento de crearlos, para empezar una idea en segundos
sobre una base probada. Con su molde `web-tool` crea las herramientas web
de seed-lab sobre [seed-kit](../../packages/seed-kit/README.md); con los
demás, proyectos de Python.

No se publica ni se ofrece fuera del repositorio.

## La plataforma: seed-kit + Forja

seed-lab construye como NVIDIA: cada producto nuevo se levanta sobre
infraestructura propia y nunca empieza de cero. Esa infraestructura tiene
dos piezas:

- **seed-kit** (`packages/seed-kit`) es lo que comparten todas las apps:
  colores, cabecera y pie de seed-lab, lista de herramientas, idiomas,
  privacidad y las comprobaciones de cada página. Se importa desde el
  código, no se copia.
- **Forja** crea una herramienta nueva ya conectada a seed-kit, con todo
  lo que pide seed-lab desde el primer minuto.

**Todo producto nuevo nace de esta plataforma.** Ver "Cómo construimos"
en [`docs/direction.md`](../../docs/direction.md).

## Que NO es Forja

Esto existe para no perder el foco -- si algo de esta lista empieza a
sonar tentador, es una senal de que pertenece a otro lado, no a Forja:

- No es un framework de build ni un gestor de dependencias.
- No hace deploy, no hostea nada, no se mete en CI/CD.
- No intenta cubrir todos los lenguajes ni todos los stacks -- solo lo
  minimo para arrancar rapido y probado.
- Su trabajo termina cuando el proyecto existe y pasa sus tests. De ahi en
  adelante, el proyecto generado vive su propia vida, separado de Forja
  (una herramienta web sigue unida a seed-kit, no a Forja: lo que mejora
  en seed-kit le llega sin regenerarla).

## Por que funciona de verdad

- Cada molde se verifica automaticamente corriendo sus propios tests
  generados en el momento de crearlo. Si los tests fallan, Forja avisa en
  vez de fingir que salio bien.
- No es un generador de carpetas vacias -- cada molde trae codigo
  funcional real (un contador de texto, una libreria de slugs, un servidor
  HTTP con endpoint real).
- Cero dependencias externas: todo corre con la libreria estandar de
  Python. El molde `web-tool` necesita ademas Node 22, que ya usan el hub
  y seed-kit, para correr los tests de lo que genera.

## Uso

```bash
python forja.py new cost-lens --tipo web-tool --categoria life
python forja.py new mi-cli --tipo cli
python forja.py new mi-libreria --tipo lib
python forja.py new mi-api --tipo api
```

Los proyectos de Python quedan listos para correr y con git inicializado
(usa `--sin-git` para omitir eso). Una herramienta web nace dentro del
repositorio, en `projects/<id>/`, sin git propio.

## Moldes disponibles

| Molde | Que genera |
|-------|------------|
| `web-tool` | Una herramienta web de seed-lab en `projects/<id>/`, estatica y sin framework, sobre seed-kit (ver abajo). |
| `cli` | Un comando que cuenta lineas/palabras/caracteres de un archivo. |
| `lib` | Una libreria con `slugify(texto)`. |
| `api` | Un servidor HTTP stdlib con `/health`. |

## El molde `web-tool`

```bash
python tools/forja/forja.py new cost-lens --tipo web-tool --categoria life
```

Crea `projects/cost-lens/`, una herramienta estatica como el hub (un
generador en TypeScript que Node 22 ejecuta tal cual), ya conectada a
seed-kit desde el codigo:

- **EN y ES**, con el script de idioma de seed-kit, que no guarda nada,
  y numeros escritos a la manera de cada idioma.
- **La cabecera y el pie de seed-lab**: la semilla con su nombre, EN/ES,
  el lanzador de herramientas, privacidad y condiciones, "Parte de
  seed-lab".
- **Una pagina de ejemplo con un calculo real**: cuanto cambio un numero
  de antes a despues, en cantidad y en porcentaje. Se ve con resultado
  antes de escribir nada (y sin scripts), y el navegador lo recalcula al
  teclear con el mismo codigo.
- **Privacidad y condiciones**, con las palabras comunes de seed-kit.
- **Tests que pasan**: el calculo y sus casos limite; ambos idiomas;
  cabecera y pie; ninguna peticion a otros sitios; nada guardado en el
  navegador; cada pagina por debajo de **50 KB comprimida** en la primera
  visita; enlaces que existen; palabras sencillas (el test anti-jerga de
  seed-kit).
- **Su README**: como esta hecha, comandos, como publicarla y como pasar
  del ejemplo a la herramienta.

Al crearla, Forja corre sus tests (`node --test`) y avisa si fallan, y la
anade a `packages/seed-kit/src/tools.json` como beta oculta (`"status":
"beta"`, `"listed": false`, con `--categoria money` o `life`), con textos
provisionales y los principios "pendiente". `--sin-registro` omite ese
paso. El id debe ir en minusculas con guiones (`cost-lens`); el nombre
visible sale de el (`Cost Lens`).

Las plantillas viven en `forja/templates/web_tool_files/` (con `.tmpl`
para que nada las tome por codigo) y llevan cuatro marcas: `__NAME__`,
`__ID__`, `__KIT__` (la ruta a seed-kit) y `__URL__`.

## Agregar un molde nuevo

1. Crear `forja/templates/<molde>.py` con una funcion
   `files(nombre, pkg) -> dict[str, str]` (ruta relativa -> contenido).
   Un molde web declara `WEB = True` y recibe tambien el destino:
   `files(nombre, pkg, destino)`.
2. El contenido debe incluir tests reales que Forja pueda correr: en
   `tests/` con `python -m unittest discover -s tests`, o, en un molde
   web, en `test/` con `node --test`.
3. Agregar `<molde>` a `MOLDES_DISPONIBLES` en `forja.py` (con guion si
   hace falta: `web-tool` es `web_tool.py`).

## Tests de Forja

`tests/test_generator.py` genera cada molde en un directorio temporal y
confirma que sus tests pasan -- es la prueba de que Forja mismo funciona,
no solo que compila. Para `web-tool` comprueba ademas que importa seed-kit
desde su sitio, que rechaza un id que no sirve y que registra la
herramienta como beta oculta una sola vez (en una copia de la lista).

```bash
python -m unittest discover -s tests
```
