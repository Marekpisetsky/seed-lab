# projects/

Esto es un holding, no un CV. Cada carpeta dentro de `projects/` es una
"empresa" del portfolio de Marek en el sentido Musk: Tesla, SpaceX, The
Boring Company -- proyectos de peso que existen porque funcionan de verdad,
no porque quedan bien en una lista.

## Criterio de admision

Un proyecto entra a `projects/` solo si cumple las tres cosas:

1. **Funciona de verdad.** No es una demo ni un stub -- hace algo real,
   de punta a punta, aunque sea a pequena escala.
2. **Tiene peso.** O resuelve un problema real (se usa de verdad), o exige
   ambicion tecnica real (te obliga a construir algo dificil). Idealmente
   ambas.
3. **Resuelve un problema real fuera de la construccion del holding
   mismo.** Cuenta el uso propio sostenido de Marek, o la adopcion de
   terceros que lo descubren y lo usan por su cuenta -- lo que NO cuenta
   es que el unico consumidor sea el propio holding para construirse a
   si mismo (ese caso es infraestructura interna y pertenece a
   `tools/`). No hace falta venta activa ni negociacion con nadie. Este
   fue el error con Forja: cumplia 1 y 2, pero su unico consumidor era el
   holding mismo, asi que se reclasifico a `tools/forja/`.

No es un lugar para ejercicios ni para portfolio-filler.

## Antes de construir a fondo: validar

Por valor del holding ("Validacion antes que construccion"), ninguna idea
se construye a fondo sin evidencia de que resuelve un problema real --
uso propio sostenido, o adopcion de terceros que lo descubren y lo usan
sin que Marek tenga que venderlo o negociarlo. Una idea puede vivir como
celula o borrador mientras se busca esa evidencia; recien se gradua a
carpeta propia en `projects/` cuando esa validacion existe.

## Que distingue un proyecto de una celula (`cells/`) o una herramienta (`tools/`)

- Una celula es una chispa de un archivo: se ejecuta y ya.
- Una herramienta (`tools/`) tiene profundidad real, pero su cliente es el
  propio holding -- existe para construir otras cosas, no para venderse.
- Un proyecto (`projects/`) tiene profundidad real y un cliente fuera del
  holding, real o buscado activamente. Si una celula o herramienta
  demuestra que vale la pena y encuentra ese cliente externo, se "gradua"
  moviendola aqui y dandole mision propia de empresa.

## Estructura minima de cada proyecto

```
projects/<nombre-del-proyecto>/
  README.md      -- mision, que NO es, por que importa, estado actual
  ...             (el codigo propio del proyecto)
```

El README de cada proyecto tiene que abrir con dos cosas, en este orden:

1. **Mision:** una frase que diga para que existe el proyecto -- no que
   hace, sino por que importa. Si la mision se puede resumir en "hacer de
   todo un poco", no es una mision, es una falta de foco.
2. **Que NO es:** una lista explicita de lo que el proyecto no va a
   intentar cubrir, aunque sea tentador agregarlo despues. Sin esto, es
   facil que un proyecto se desparrame hasta perder el objetivo con el que
   nacio.

## Reglas heredadas de seed-lab

- Cero costo: nada que dependa de pago para existir.
- Cero arte: el valor esta en la logica y la ejecucion, no en el diseno visual.
- Cada proyecto define su propio proposito -- no hay una agenda impuesta
  desde afuera.
