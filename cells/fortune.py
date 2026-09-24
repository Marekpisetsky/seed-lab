"""Suelta una frase corta al azar. Sin red, sin costo, sin dependencias."""
import random

FRASES = [
    "El codigo que no escribes no tiene bugs.",
    "Un sistema simple que funciona vale mas que uno complejo que casi funciona.",
    "La primera version siempre esta mal. Por eso es la primera.",
    "Automatizar lo aburrido libera tiempo para lo dificil.",
    "Toda arquitectura grande empezo como un script de 20 lineas.",
]


def run(*args):
    print(random.choice(FRASES))
