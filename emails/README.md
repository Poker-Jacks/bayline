# Plantillas de correo de Bayline

Dos plantillas HTML para el servicio `pj-forms`. Se llenan sustituyendo `{{placeholders}}`.

| Archivo | Va de | Va a | Existe hoy |
|---|---|---|---|
| `notificacion.html` | el servicio | el equipo | sí, en texto plano |
| `acuse.html` | el servicio | el visitante | **no, hay que agregarlo** |

## Placeholders

| Placeholder | Ejemplo | Notas |
|---|---|---|
| `{{nombre}}` | `Ana Rojas` | tal cual lo escribió |
| `{{nombre_corto}}` | `Ana` | primera palabra de `{{nombre}}` |
| `{{telefono}}` | `8712-4409` | si viene vacío, poner `(no indicado)` |
| `{{telefono_e164}}` | `+50687124409` | solo para el `tel:`; si no hay teléfono, quitar el enlace |
| `{{correo}}` | `ana@ferreteriarojas.cr` | |
| `{{plan}}` | `Bayline · plan Comercial` | el asunto que ya manda el formulario |
| `{{mensaje}}` | texto libre | **escapar HTML** y convertir saltos de línea a `<br>` |
| `{{fecha}}` | `12 de agosto de 2026, 8:05 p. m.` | hora de Costa Rica, `UTC−6` |
| `{{url}}` | `https://bayline.poker-jacks.tech/` | solo en `notificacion.html` |
| `{{ip}}` | `186.15.158.91` | solo en `notificacion.html`, de `CF-Connecting-IP` |

`{{plan_url}}` ya no se usa: salió con el botón de responder.

> ⚠️ `{{mensaje}}` es texto de un desconocido inyectado en HTML. Escapar `& < > " '` antes de
> sustituir, o el formulario se vuelve un vector de inyección contra nuestra propia bandeja.

## Asunto

**El acuse y la respuesta humana posterior tienen que llevar el MISMO asunto, carácter por
carácter.** Gmail exige las dos cosas para hilar: asunto idéntico **y** que la respuesta
referencie el `Message-ID`. Con solo repetir el asunto no se hilan.

```
acuse            Subject: {{plan}}
respuesta humana Subject: {{plan}}          (o "Re: {{plan}}" siempre, pero consistente)
```

La notificación interna es otro mensaje a otro destinatario: su asunto es libre y no comparte hilo.

## Headers del acuse

| Header | Valor | Por qué |
|---|---|---|
| `Auto-Submitted` | `auto-replied` | RFC 3834. **Esto es lo que corta los bucles** con los "estoy fuera de la oficina": los responders no deben contestar un mensaje que lo traiga. |
| `X-Auto-Response-Suppress` | `OOF, AutoReply, DR, RN, NRN` | Propietario de Microsoft. Suprime OOO, acuses de entrega y de lectura de Exchange. |
| `Message-ID` | `<lead-{uuid}@poker-jacks.tech>` | **Guardarlo junto al lead.** Es el ancla del hilo: la respuesta humana lo usa en `In-Reply-To` y `References`. |
| `Reply-To` | una dirección que reciba | Hoy `jasondiazarias@gmail.com`. Cuando Email Routing esté, `hola@poker-jacks.tech`. **Nunca un `no-reply`.** |

**Que NO lleve:**

- `List-Unsubscribe` — Google lo pide para *marketing and subscribed messages*, no para
  transaccional 1:1. Ponerlo le dice al receptor que somos una lista, y es falso.
- `Precedence: bulk` — RFC 3834 §3.1.8 dice que no es estándar y que no implica comportamiento
  definido. Declarar un 1:1 como bulk es riesgo gratis.

## Remitente

Hoy sale de `no-reply@poker-jacks.tech`. Conviene cambiarlo a `hola@` cuando reciba, **pero no
por entregabilidad**: la creencia de que `no-reply@` quema el dominio es folklore, y la referencia
de la industria dice explícitamente que no afecta. Las razones reales son que Microsoft pide una
dirección que pueda recibir respuestas, y que quien quiere responder y no puede a veces marca spam.

## Modo oscuro y tipografías

Las dos plantillas traen el diseño claro completo en estilos **en línea**, y el modo oscuro como
mejora progresiva en un `<style>`. Si un cliente de correo borra el `<style>`, se ve bien igual.

**Author y Spline Sans Mono no van a cargar**: Gmail borra `@font-face`. Las plantillas declaran
la misma cadena de respaldo que la landing. La identidad la sostienen el color, el ritmo y la
estructura, no la tipografía. Por lo mismo el logo va **en texto y no en imagen**: Gmail bloquea
imágenes por defecto y una cabecera con la marca invisible se ve peor que una bien tipografiada.

## Lo que cambió respecto al primer borrador

- **Fuera el botón "Responderle a X"** de la notificación interna. Si alguien lo apretaba, el
  correo salía desde su Gmail personal: rompía el hilo, dejaba el dominio y exponía su dirección.
  Quedó una guía de cómo responder bien.
- **El acuse le deja constancia de lo que autorizó** y cómo pedir que se borre, con enlace a
  `/privacidad.html`. Va con la casilla de consentimiento que ya está en el formulario.

## Pendiente que no depende de estas plantillas

La notificación interna quizá deba ir a **Slack** en vez de correo. Elimina de raíz la tentación
de responder desde la cuenta personal, y el lead igual queda en el correo del acuse. Es decisión
de quien mantiene el servicio.
