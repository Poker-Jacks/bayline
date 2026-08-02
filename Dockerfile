# syntax=docker/dockerfile:1
# Bayline es HTML autocontenido: no hay build step, el sitio se sirve tal cual esta en el repo.
# Etapa 1 = hornear la huella del build. Etapa 2 = nginx sin privilegios (uid 101, :8080).

FROM alpine:3.20 AS stamp
WORKDIR /site
COPY . .

# Fuera lo que es del repo pero no del sitio. Va antes de buscar los HTML para que un .html
# de documentacion futura no se cuele al contenedor sin darse cuenta.
RUN rm -f Dockerfile nginx.conf .dockerignore CLAUDE.md README.md

# El SHA del commit entra en cada HTML como <meta name="build">. Es lo que le permite al CI
# probar que el sitio sirve ESTE build y no uno viejo: un 200 lo devuelve igual la version
# anterior. Sin esa huella el workflow del demo de ferreteria quedo verde sin haber
# desplegado nada, dos veces seguidas (2026-07-28 y 07-29).
#
# El ancla es <meta charset>, no <head>: los HTML de este repo no tienen <head> (van en el
# estilo implicito, <!doctype><html><meta charset>) y tienda/index.html arranca directo en
# el meta, sin doctype. Si algun dia falta el ancla, el build falla aca — antes que el
# deploy quede verde sin huella que verificar.
#
# El grep de verificacion usa `.` donde van las comillas del atributo a proposito: un patron
# con comillas escapadas dentro de un RUN pasa por el parser del Dockerfile y por sh, y termina
# comparando algo distinto de lo que uno leyo. El comodin evita las dos capas de escape.
ARG BUILD_SHA=dev
RUN set -eu; \
    n=0; \
    for f in $(find . -name '*.html'); do \
      grep -q '<meta charset' "$f" || { echo "ERROR: $f no tiene <meta charset> donde anclar la huella"; exit 1; }; \
      awk -v sha="$BUILD_SHA" \
        '!stamped && /<meta charset/ { print; print "<meta name=\"build\" content=\"" sha "\">"; stamped=1; next } { print }' \
        "$f" > "$f.stamped"; \
      mv "$f.stamped" "$f"; \
      grep -q "name=.build. content=.${BUILD_SHA}." "$f" || { echo "ERROR: no se horneo la huella en $f"; exit 1; }; \
      n=$((n+1)); \
    done; \
    [ "$n" -gt 0 ] || { echo "ERROR: no se encontro ningun HTML que servir"; exit 1; }; \
    echo "huella ${BUILD_SHA} horneada en ${n} HTML"

FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY --from=stamp --chown=101:101 /site /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
