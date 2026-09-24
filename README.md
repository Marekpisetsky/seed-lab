# seed-lab

Un nucleo minimo que no hace casi nada por si solo, disenado para que cada
idea nueva se agregue como una pieza independiente sin tocar lo que ya existe.

## Reglas del proyecto

- Cero costo: nada que dependa de una API de pago o suscripcion para existir.
- Cero arte: el valor esta en la logica, no en como se ve.
- Sin rumbo fijo: no hay backlog ni roadmap. Cada "celula" nace de una
  curiosidad puntual.

## Como funciona

- `cells/` contiene modulos Python independientes. Cada archivo `.py` que
  define una funcion `run(*args)` es una celula ejecutable.
- `core/registry.py` descubre automaticamente las celulas presentes en
  `cells/` -- no hay que registrar nada a mano.
- `seed.py` es la CLI: lista y ejecuta celulas.

```bash
python seed.py list
python seed.py run hello Marek
python seed.py run fortune
```

## Agregar una celula nueva

1. Crear `cells/nombre.py`.
2. Escribir un docstring de una linea (aparece en `seed.py list`).
3. Definir `def run(*args): ...`.

Eso es todo -- no hace falta tocar ningun otro archivo.
