# seed-lab

**Mision:** seed-lab crea empresas de software que generan ingresos
reales: valida cada idea con clientes externos antes de construirla y
acelera cada lanzamiento con herramientas compartidas que se vuelven mas
potentes con cada empresa nueva.

**Vision:** Consolidar una cartera de productos de software rentables,
construidos sobre infraestructura compartida, que en conjunto generen
ingresos sostenidos y demuestren capacidad de ingenieria aplicada a
problemas reales del mercado.

**Valores:**

1. **Verificacion sobre promesa** -- nada se declara terminado sin
   pruebas de que funciona.
2. **Validacion antes que construccion** -- ninguna idea se construye a
   fondo sin evidencia de un cliente externo real dispuesto a usarla o
   pagarla.
3. **Apalancamiento compartido** -- cada empresa nueva se apoya en la
   infraestructura ya construida en `tools/`, no arranca de cero.
4. **Independencia economica** -- ninguna empresa depende de capital
   externo para nacer.
5. **Primacia de la logica** -- el valor de cada producto reside en su
   funcionamiento, no en su apariencia.
6. **Proposito explicito** -- toda empresa define su mision y sus
   limites antes de considerarse iniciada.
7. **Autonomia de origen** -- la agenda del holding responde a
   iniciativa propia, no a mandato externo.

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
