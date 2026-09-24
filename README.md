# seed-lab

**Mision, Vision y Valores del holding:** pendientes de definir con
precision -- ver seccion al final. Todo lo demas en este README ya esta
en vigencia.

Un holding de tres niveles:

- `cells/` -- chispas de un archivo.
- `tools/` -- infraestructura interna: herramientas que el holding usa
  para construirse a si mismo, sin cliente externo.
- `projects/` -- las empresas de verdad: las unicas con derecho a llevar
  mision propia de empresa, porque tienen (o apuntan a tener) un cliente
  fuera del propio holding.

Una celula que demuestra que vale la pena se gradua a `tools/` (si sirve
para construir otras cosas del holding) o a `projects/` (si es, en si
misma, una empresa con cliente propio).

## Reglas del holding

- Cero costo: nada que dependa de una API de pago o suscripcion para existir.
- Cero arte: el valor esta en la logica, no en como se ve.
- Sin rumbo fijo: no hay backlog ni roadmap impuesto desde afuera. Cada
  celula o proyecto nace de una curiosidad puntual o un objetivo real.

## Estructura

- `cells/` -- modulos Python de un archivo. Cada uno con una funcion
  `run(*args)` es una celula ejecutable, descubierta automaticamente por
  `core/registry.py` y disparada con `seed.py` (`python seed.py list`,
  `python seed.py run <nombre>`). Ver detalle mas abajo.
- `tools/` -- herramientas internas, cada una en su propia carpeta con su
  propio README (proposito puntual, no mision de empresa). Ejemplo:
  `tools/forja/`, el generador de proyectos verificados.
- `projects/` -- empresas de verdad, cada una en su propia carpeta con su
  propio README. Ver `projects/README.md` para el criterio de admision.

```bash
python seed.py list
python seed.py run hello Marek
python seed.py run fortune
```

## Agregar una celula nueva (chispa rapida)

1. Crear `cells/nombre.py`.
2. Escribir un docstring de una linea (aparece en `seed.py list`).
3. Definir `def run(*args): ...`.

## Agregar una herramienta nueva (infraestructura interna)

Crear `tools/nombre-de-la-herramienta/` con su propio `README.md`: que es,
para que sirve dentro del holding, y una nota de que su cliente es interno
(no lleva mision de empresa).

## Agregar un proyecto nuevo (empresa de verdad)

Crear `projects/nombre-del-proyecto/` con su propio `README.md` que explique
que es, por que importa, y el estado actual. Ver `projects/README.md`.

## Mision, Vision y Valores del holding

En construccion. Se estan definiendo con precision: que tipo de empresas
incuba el holding, con que criterio entra una idea a `projects/`, que le
aporta el holding a cada empresa, y cual es el objetivo final. Hasta que
esto quede cerrado, ningun proyecto deberia asumir una mision de holding
que todavia no existe por escrito.
