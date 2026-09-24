# seed-lab

Un espacio de dos niveles. `cells/` es donde caen las chispas de un archivo.
`projects/` es donde vive lo importante: proyectos con profundidad real que
crecen en varias sesiones. Una celula que demuestra que vale la pena se
gradua a `projects/`.

## Reglas del proyecto

- Cero costo: nada que dependa de una API de pago o suscripcion para existir.
- Cero arte: el valor esta en la logica, no en como se ve.
- Sin rumbo fijo: no hay backlog ni roadmap impuesto desde afuera. Cada
  celula o proyecto nace de una curiosidad puntual o un objetivo real.

## Estructura

- `cells/` -- modulos Python de un archivo. Cada uno con una funcion
  `run(*args)` es una celula ejecutable, descubierta automaticamente por
  `core/registry.py` y disparada con `seed.py` (`python seed.py list`,
  `python seed.py run <nombre>`). Ver detalle mas abajo.
- `projects/` -- proyectos importantes, cada uno en su propia carpeta con su
  propio README. Ver `projects/README.md` para la estructura esperada.

```bash
python seed.py list
python seed.py run hello Marek
python seed.py run fortune
```

## Agregar una celula nueva (chispa rapida)

1. Crear `cells/nombre.py`.
2. Escribir un docstring de una linea (aparece en `seed.py list`).
3. Definir `def run(*args): ...`.

## Agregar un proyecto nuevo (importante)

Crear `projects/nombre-del-proyecto/` con su propio `README.md` que explique
que es, por que importa, y el estado actual. Ver `projects/README.md`.
