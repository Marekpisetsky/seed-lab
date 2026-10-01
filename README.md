# seed-lab

seed-lab builds free, privacy-first digital tools that Europeans --
citizens, developers and public bodies -- can use without giving up their
data.

seed-lab construye herramientas digitales gratuitas y centradas en la
privacidad para Europa. No vende a gobiernos: publica herramientas
gratuitas que ciudadanos, desarrolladores e instituciones adoptan por su
cuenta. **Wealth Lens** (`projects/wealth-lens/`) es la primera
herramienta y la prueba de los principios.

- Vision, modelo, escalera, mision, principios, ODS y "Que NO somos":
  [`docs/direction.md`](docs/direction.md).
- Donde estamos: **peldano 1** de la escalera (herramientas que la gente
  usa). Los peldanos siguientes todavia no existen.
- El hub (portada de seed-lab, EN/ES, paginas estaticas sin cookies):
  [`hub/`](hub/README.md).
- Alojamiento: hoy en Vercel (EE. UU.). Plan para pasar a Europa, sin
  migrar todavia: [`docs/hosting.md`](docs/hosting.md).
- Licencia: codigo propietario, (C) 2026 Marek Pisetsky, todos los
  derechos reservados ([`LICENSE`](LICENSE)). Las aplicaciones publicadas
  son de uso gratuito. Nombres y logotipos: [`TRADEMARKS.md`](TRADEMARKS.md).

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
- `hub/` -- la portada publica de seed-lab: mision, principios,
  herramientas y bloques. Ver `hub/README.md`.
- `docs/` -- direccion de seed-lab (`direction.md`) y plan de alojamiento
  europeo.

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

## Historia

Hasta el cambio de rumbo de septiembre de 2026 (ver
[`docs/direction.md`](docs/direction.md)), seed-lab se definia asi:

**Mision:** seed-lab construye proyectos de software con peso tecnico
real -- cada uno demuestra una capacidad de ingenieria genuina y
resuelve un problema real (propio de Marek, o de terceros que lo
adoptan por su cuenta), sin depender de gestionar clientes ni negociar
ventas. Acelera cada proyecto nuevo con herramientas compartidas que se
vuelven mas potentes con cada proyecto que se suma.

**Vision:** Consolidar una cartera de proyectos de software con peso
real, construidos sobre infraestructura compartida, que en conjunto
demuestren capacidad de ingenieria aplicada a problemas reales -- el
ingreso es un resultado posible (ej. via adopcion organica o modelos
sin trato activo, como rev-share automatico), nunca el requisito de
entrada.

**Valores:**

1. **Verificacion sobre promesa** -- nada se declara terminado sin
   pruebas de que funciona.
2. **Validacion antes que construccion** -- ninguna idea se construye a
   fondo sin evidencia de que resuelve un problema real: uso propio
   sostenido, o adopcion de terceros que lo descubren y lo usan sin que
   Marek tenga que venderlo o negociarlo.
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
