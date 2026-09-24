"""Saluda -- la celula mas simple posible, sirve de plantilla para las nuevas."""


def run(*args):
    nombre = args[0] if args else "mundo"
    print(f"Hola, {nombre}. Esta es la primera celula del seed-lab.")
