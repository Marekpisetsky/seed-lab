# projects/

Esto es un holding, no un CV. Cada carpeta dentro de `projects/` es una
"empresa" del portfolio de Marek en el sentido Musk: Tesla, SpaceX, The
Boring Company -- proyectos de peso que existen porque funcionan de verdad,
no porque quedan bien en una lista.

## Criterio de admision

Un proyecto entra a `projects/` solo si cumple las dos cosas:

1. **Funciona de verdad.** No es una demo ni un stub -- hace algo real,
   de punta a punta, aunque sea a pequena escala.
2. **Tiene peso.** O resuelve un problema real (se usa de verdad), o exige
   ambicion tecnica real (te obliga a construir algo dificil). Idealmente
   ambas.

No es un lugar para ejercicios ni para portfolio-filler.

## Que distingue a un proyecto de una celula (`cells/`)

- Una celula es una chispa de un archivo: se ejecuta y ya.
- Un proyecto tiene su propia carpeta, su propio README, y crece en varias
  sesiones. Si una celula demuestra que vale la pena, se "gradua" moviendola
  aqui y dandole estructura propia.

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
