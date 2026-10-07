# seed-lab — Documento de Continuación

**Última actualización:** 7 de octubre de 2026  
**Ubicación del proyecto:** `C:\Users\Marek\OneDrive\Escritorio\seed-lab`  
**Repositorio:** https://github.com/Marekpisetsky/seed-lab

---

## Qué es seed-lab

Herramientas digitales gratuitas y centradas en la privacidad para Europa.
No vende a gobiernos: publica herramientas gratuitas que ciudadanos,
desarrolladores e instituciones adoptan por su cuenta.

**Visión:** Que Europa tenga su propia pila tecnológica, para que sus
ciudadanos, empresas y gobiernos no tengan que depender de la de nadie más.

**Misión:** Dar información y herramientas para que las personas tengan más
autonomía económica.

---

## Estado actual (Peldaño 1)

| Herramienta | Estado | URL |
|-------------|--------|-----|
| **Wealth Lens** | `live` | https://seed-lab-omega.vercel.app |
| Cost Lens | `beta` (oculta) | https://seed-lab-cost-lens.vercel.app |
| Inflation Lens | `beta` (oculta) | https://seed-lab-inflation-lens.vercel.app |

**Tests:** ✅ 844 tests pasan (54 seed-kit + 790 wealth-lens)  
**Build:** ✅ Compila sin errores

---

## Estructura del proyecto

```
seed-lab/
├── docs/
│   ├── direction.md      ← FUENTE DE VERDAD de la dirección
│   ├── hosting.md        ← Plan de migración a hosting europeo
│   └── history.md        ← Cómo se definía antes de sept 2026
├── projects/
│   ├── wealth-lens/      ← Producto principal (live)
│   │   ├── README.md     ← Spec del producto
│   │   └── docs/continuity-2026-10-04.md ← Estado de recuperación
│   ├── cost-lens/        ← Beta oculta
│   └── inflation-lens/   ← Beta oculta
├── packages/
│   └── seed-kit/         ← Base común (colores, cabecera, idiomas)
├── hub/                  ← Web de seed-lab (misión, principios)
├── research/             ← Fichas de métodos y supuestos
├── tools/
│   └── forja/            ← Generador de nuevas herramientas
├── AGENTS.md             ← Instrucciones para agentes AI
├── CLAUDE.md             ← Apunta a AGENTS.md y direction.md
└── README.md             ← Visión general
```

---

## PRs pendientes (CADENA — fusionar en orden)

| PR | Rama | Fase | Contenido |
|----|------|------|-----------|
| [#26](https://github.com/Marekpisetsky/seed-lab/pull/26) | `claude/wl-p1-money` | 1 | Mi dinero, animación FLIP, futuros explicados, década histórica |
| [#27](https://github.com/Marekpisetsky/seed-lab/pull/27) | `claude/wl-p2-test` | 2 | Probar mi plan, tarjetas por crisis |
| [#28](https://github.com/Marekpisetsky/seed-lab/pull/28) | `claude/wl-p3-theme` | 3 | Tema claro/oscuro/auto, accesibilidad |
| [#29](https://github.com/Marekpisetsky/seed-lab/pull/29) | `claude/wl-p4-research` | 4 | Research, fichas de modelos, Kelly educativo |

**⚠️ NO TOCAR PR #17** — migración a statichost.eu descartada.

---

## Fase 5: Pendiente de implementar

**Objetivo:** Deseos con fecha y precios por país.

- Investigar aspiraciones de las personas en Europa
- Cada persona elige su deseo o escribe uno propio
- Conectar ahorro (ej. 100 €/mes) con lo que puede alcanzar y cuándo
- Países iniciales: Países Bajos, España, Alemania, Francia, Italia, Portugal

**Reglas por definir:**
- Qué significa una fecha deseada introducida por la persona
- Si gastar descuenta capital del plan

**Nota:** "Corto, medio y largo" era propuesta de Claude, no decisión de Marek.

---

## Principios de seed-lab

1. **Your data never leaves your device** — Sin cuentas, sin cookies, sin analítica
2. **Transparent** — Gratis, métodos y fuentes públicos, código propietario
3. **Truly European** — Alojado en Europa (pendiente), EN/ES, GDPR compliant
4. **Light** — Páginas < 350 KB, estáticas
5. **For everyone** — Lenguaje claro, accesible

---

## Reglas de trabajo

- **Cero coste:** nada depende de un servicio de pago
- **Verificación antes que promesa:** tests, build, Lighthouse antes de dar por terminado
- **Solo lo que existe:** lo pendiente va a la hoja de ruta
- **Un solo sistema visual:** colores en `tokens.css` de seed-kit
- **Nada empieza de cero:** cada producto nace de Forja + seed-kit
- **Ningún método sin su ficha:** todo en `research/`
- **Informar, no aconsejar:** no decir qué comprar/vender

---

## Cómo retomar el trabajo

1. **Abrir terminal en** `C:\Users\Marek\OneDrive\Escritorio\seed-lab`
2. **Leer** `docs/direction.md` (fuente de verdad)
3. **Ver estado de PRs** en GitHub
4. **Para wealth-lens:**
   ```bash
   cd projects/wealth-lens
   npm install
   npm test        # 790 tests
   npm run dev     # servidor local
   ```
5. **Antes de cada commit:** `npm run lint && npm test && npm run build`

---

## Archivos clave para entender el proyecto

| Área | Archivos |
|------|----------|
| Dirección | `docs/direction.md`, `README.md`, `AGENTS.md` |
| Wealth Lens spec | `projects/wealth-lens/README.md` |
| Continuidad | `projects/wealth-lens/docs/continuity-2026-10-04.md` |
| Modelos financieros | `projects/wealth-lens/src/lib/finance.ts`, `investment.ts`, `mix.ts` |
| Research | `research/wealth-lens/`, `research/legal/informar-no-aconsejar.md` |
| Idiomas | `projects/wealth-lens/src/i18n/messages/en.ts`, `es.ts` |
| Base común | `packages/seed-kit/src/` |

---

## Contacto

seedlab.eu (arroba) proton.me
