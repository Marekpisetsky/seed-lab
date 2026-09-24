# Forja

**Mision:** construir la herramienta que construye herramientas. Le das un
nombre y un tipo, y Forja genera un proyecto que corre y tiene tests que
pasan de verdad -- no un template vacio.

## Por que cumple el criterio de `projects/`

- **Funciona de verdad:** cada molde se verifica automaticamente corriendo
  sus propios tests generados en el momento de crearlo. Si los tests
  fallan, Forja te avisa en vez de fingir que salio bien.
- **Tiene peso:** no es un generador de carpetas vacias -- cada molde trae
  codigo funcional real (un contador de texto, una libreria de slugs, un
  servidor HTTP con endpoint real).

Cero dependencias externas: todo corre con la libreria estandar de Python.

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
