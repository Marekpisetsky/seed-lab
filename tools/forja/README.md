# Forja

**Qué es:** una herramienta interna de seed-lab, no un producto. Genera
proyectos de Python que nacen funcionando: código real, tests que pasan y
verificación en el momento de crearlos, para empezar una idea en segundos
sobre una base probada.

No se publica ni se ofrece fuera del repositorio.

## Que NO es Forja

Esto existe para no perder el foco -- si algo de esta lista empieza a
sonar tentador, es una senal de que pertenece a otro lado, no a Forja:

- No es un framework de build ni un gestor de dependencias.
- No hace deploy, no hostea nada, no se mete en CI/CD.
- No intenta cubrir todos los lenguajes ni todos los stacks -- solo lo
  minimo para arrancar rapido y probado.
- Su trabajo termina cuando el proyecto existe y pasa sus tests. De ahi en
  adelante, el proyecto generado vive su propia vida, separado de Forja.

## Por que funciona de verdad

- Cada molde se verifica automaticamente corriendo sus propios tests
  generados en el momento de crearlo. Si los tests fallan, Forja avisa en
  vez de fingir que salio bien.
- No es un generador de carpetas vacias -- cada molde trae codigo
  funcional real (un contador de texto, una libreria de slugs, un servidor
  HTTP con endpoint real).
- Cero dependencias externas: todo corre con la libreria estandar de
  Python.

## Uso

```bash
python forja.py new mi-cli --tipo cli
python forja.py new mi-libreria --tipo lib
python forja.py new mi-api --tipo api
```

Cada proyecto generado queda listo para correr y con git inicializado
(usa `--sin-git` para omitir eso).

## Moldes disponibles

| Molde | Que genera |
|-------|------------|
| `cli` | Un comando que cuenta lineas/palabras/caracteres de un archivo. |
| `lib` | Una libreria con `slugify(texto)`. |
| `api` | Un servidor HTTP stdlib con `/health`. |

## Agregar un molde nuevo

1. Crear `forja/templates/<molde>.py` con una funcion
   `files(nombre, pkg) -> dict[str, str]` (ruta relativa -> contenido).
2. El contenido debe incluir tests reales en `tests/` que Forja pueda
   correr con `python -m unittest discover -s tests`.
3. Agregar `<molde>` a `MOLDES_DISPONIBLES` en `forja.py`.

## Tests de Forja

`tests/test_generator.py` genera cada molde en un directorio temporal y
confirma que sus tests pasan -- es la prueba de que Forja mismo funciona,
no solo que compila.

```bash
python -m unittest discover -s tests
```
