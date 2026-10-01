# seed-lab

seed-lab builds free, privacy-first digital tools that Europeans —
citizens, developers and public bodies — can use without giving up their
data.

seed-lab construye herramientas digitales gratuitas y centradas en la
privacidad para Europa. No vende a gobiernos: publica herramientas
gratuitas que ciudadanos, desarrolladores e instituciones adoptan por su
cuenta. **Wealth Lens** (`projects/wealth-lens/`) es la primera
herramienta y la prueba de los principios.

- **Dirección:** visión, modelo, escalera, misión, los cinco principios
  (con *Transparent*), ODS y "Qué NO somos", en
  [`docs/direction.md`](docs/direction.md).
- **Dónde estamos:** peldaño 1 de la escalera, herramientas que la gente
  usa. Los peldaños siguientes todavía no existen; la web los muestra solo
  en su página *Roadmap*.
- **Web de seed-lab:** [`hub/`](hub/README.md), estática, en EN y ES, sin
  cookies.
- **Alojamiento:** hoy en Vercel (EE. UU.). El plan para pasar a Europa,
  sin migrar todavía, está en [`docs/hosting.md`](docs/hosting.md).
- **Licencia:** código propietario, © 2026 Marek Pisetsky, todos los
  derechos reservados ([`LICENSE`](LICENSE)). Las aplicaciones publicadas
  son de uso gratuito. Nombres y logotipos:
  [`TRADEMARKS.md`](TRADEMARKS.md).
- **Contacto:** seedlab.eu (arroba) proton.me.

## Reglas de trabajo

- **Cero coste:** nada depende de un servicio de pago para existir.
- **Verificación antes que promesa:** nada se da por terminado sin
  pruebas de que funciona (tests, build, Lighthouse, accesibilidad).
- **Solo lo que existe:** ningún texto presenta como hecho algo que aún
  no lo está; lo pendiente va a la hoja de ruta.
- **Un solo sistema visual:** los colores viven en `tokens.css`, el mismo
  archivo en el hub y en cada producto.

## Estructura

- `hub/` — la web de seed-lab: misión, principios, productos y hoja de
  ruta. Ver `hub/README.md`.
- `projects/` — los productos. Hoy, uno: `projects/wealth-lens/`. Ver
  `projects/README.md` para lo que pide cada producto.
- `docs/` — dirección (`direction.md`), plan de alojamiento
  (`hosting.md`) y capturas.
- `tools/forja/` — herramienta interna: genera proyectos de Python que
  nacen con tests que pasan. No es un producto.
- `cells/`, `core/` y `seed.py` — banco de pruebas: ideas rápidas en un
  archivo de Python cada una, que `seed.py` descubre y ejecuta.

```bash
python seed.py list
python seed.py run hello Marek
python seed.py run fortune
```

## Añadir un producto

1. Crear `projects/<nombre>/` con su `README.md`: qué es, qué no es, cómo
   cumple los cinco principios y en qué estado está.
2. Usar el `tokens.css` compartido y la familia de iconos de seed-lab.
3. Añadirlo a `hub/content/tools.json`, con su fila de "Cómo lo cumple
   cada producto" (cumple / en parte / pendiente por principio).

## Añadir una idea rápida

1. Crear `cells/nombre.py`.
2. Escribir un docstring de una línea (aparece en `seed.py list`).
3. Definir `def run(*args): ...`.

## Historia

Hasta el cambio de rumbo de septiembre de 2026 (ver
[`docs/direction.md`](docs/direction.md)), seed-lab se definía como un
holding de proyectos y se describía así. Se conserva solo como registro;
no rige nada de lo actual.

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
