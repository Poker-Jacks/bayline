# Bayline — reglas del repo

Sitio de producto de **Bayline** (marca de comercio en linea de Poker Jacks). Tres paginas
estaticas, **sin build step**: el HTML es autocontenido y se sirve tal cual esta en el repo.

| ruta | que es |
|---|---|
| `index.html` | landing de producto |
| `v2/index.html` + `v2/img/` | landing v2 (la del anuncio) |
| `tienda/index.html` | plantilla de tienda (storefront) con carrito y checkout simulado |

## Como se despliega

| rama | app en VPS Manager | URL |
|---|---|---|
| `master` (produccion) | `bayline` | https://bayline.poker-jacks.tech ← **lo que ve el cliente** |
| `dev` | `bayline-dev` | https://bayline-dev.poker-jacks.tech ← donde se itera |

`push` a `dev` o a la rama de produccion → CI → imagen a `registry.poker-jacks.tech/bayline` →
webhook a VPS Manager → rollout en k3s → el workflow **verifica que el sitio sirve ese commit**
antes de darse por verde. Estandar del equipo: `knowledge/ci-cd-standard.md` del vault.

> Pendiente coordinar con jason: renombrar `master` → `main`, que es lo que usa el resto de la
> org. Los workflows ya aceptan los dos nombres, asi que el rename no rompe el deploy — solo
> hay que hacerlo cuando nadie tenga trabajo sin pushear.

El repo tambien sigue publicado en GitHub Pages (https://poker-jacks.github.io/bayline/) desde
la rama de produccion. Es la misma fuente, asi que no divergen; queda como respaldo mientras se
propaga el dominio nuevo.

## Reglas al editar

- **Todo HTML necesita `<meta charset>`.** El Dockerfile inserta ahi la huella del build
  (`<meta name="build" content="SHA">`) y el deploy la lee para probar que el sitio publicado
  es este commit y no uno viejo. Sin ancla, el build falla a proposito.
- **No editar `<meta name="build">` a mano** — lo genera el build.
- **Nada de secretos en el HTML**: el sitio es publico y el `secret-scan` del CI bloquea.
- **Assets locales que se referencian tienen que existir** (el CI lo verifica). Las refs con
  `${...}` se ignoran: son plantillas de JS que se resuelven en runtime.
- **Sin URLs a `localhost`** en el HTML publicado.
- Los archivos son grandes (cientos de KB en un solo `.html`, con fuentes e imagenes en
  `data:`). Es a proposito: cero requests y el sitio abre de una. Al editar, cambiar solo el
  bloque que toca — no reformatear el archivo entero, que vuelve el diff ilegible.

## Flujo

Trabajo en `dev`. A `main` se promueve por PR cuando esta listo para que lo vea el cliente.
Conventional Commits (`feat:` / `fix:` / `chore:`).

## Pendiente

Bayline como producto todavia no tiene sus repos reales de **backend** y **frontend** — esto
es la demo. Cuando se creen, van con la nomenclatura del equipo (`bayline-backend`,
`bayline-frontend`, al estilo `vivco-*`) y este repo queda como el sitio de marketing.
