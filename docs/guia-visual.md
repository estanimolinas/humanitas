# Guía visual de Humanitas

**Origen:** mockup hecho en Claude Design (`docs/Humanitas_ marketplace laboral local/Humanitas.dc.html`, sistema "classical").
**Criterio (15/09/2026):** del mockup se toman la paleta, la sobriedad y la estructura. Cuando el mockup choca con el requerimiento o con la usabilidad, **mandan el requerimiento y la usabilidad**.

---

## 1. Paleta

Fuentes del sistema. Colores del sistema "classical", con los usos ajustados para que el texto se lea a pleno sol. Todos los contrastes están medidos contra el fondo `#f3f2f2`.

| Token | Hex | Uso | Contraste |
|---|---|---|---|
| `fondo` | `#f3f2f2` | Fondo de todas las pantallas | — |
| `superficie` | `#eae9e9` | Fondos suaves (avisos neutros) | — |
| `texto` | `#201f1d` | Texto principal | 14,7:1 |
| `texto-2` | `#605d5d` | Texto secundario, fechas, subtítulos, placeholders | 5,8:1 |
| `borde-campo` | `#7d7979` | Bordes de campos y chips (no para texto chico) | 3,9:1 |
| `divisor` | `#201f1d` al 16 % | Líneas finas entre filas y secciones | — |
| `dorado` | `#b68235` | Solo bordes, íconos y marcas (no para texto) | 3,0:1 |
| `dorado-oscuro` | `#7d5411` | Texto de links y botón principal relleno | 6,0:1 (blanco encima: 6,7:1) |
| `dorado-profundo` | `#5a3b0a` | Texto sobre fondo dorado claro | 9,3:1 |
| `dorado-claro` | `#fff3e4` | Fondo de avisos y chips activos | — |
| `dorado-borde` | `#facb8d` | Borde de avisos | — |
| `error` | `#a4262c` | Mensajes de error | 6,5:1 |

**No usar:** `#9b9797` ni `#bab6b6` para texto, bordes de campos o placeholders (2,6:1 y 1,8:1: no se leen).

## 2. Tipografía

Fuentes del sistema (`system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`). Cero bytes de fuentes.

| Uso | Tamaño | Peso |
|---|---|---|
| Título de pantalla | 22 px | 600 |
| Título de publicación (lista) | 17 px | 600 |
| Título de publicación (detalle) | 22 px | 600 |
| Texto de lectura | 16 px | 400 |
| Texto secundario (rubro, barrio, fecha) | 14 px mínimo | 400 |
| Etiquetas en mayúsculas (Ofrezco / Necesito) | 12 px mínimo | 600 |
| Botones | 16 px | 600 |
| Campos de formulario | 16 px (evita el zoom automático del celular) | 400 |

## 2 bis. Layout: celular y escritorio (17/09/2026)

- **Un solo ancho de página** (`--ancho-pagina: 40rem`) para el encabezado y para todas las pantallas, centrado. Así nada queda desalineado entre la marca y el contenido.
- **Celular:** una columna al ancho de la pantalla, con 16 px de margen a los costados.
- **Escritorio (≥ 640 px):** cuerpo de texto en 17 px, títulos en 28 px, más aire arriba y abajo, y los campos y botones de formulario topados en 26 rem para que no se estiren.
- **Botón suelto** (fuera de un formulario, como "Crear mi cuenta"): en escritorio no cruza toda la columna; queda a la izquierda con un ancho mínimo de 16 rem.
- **Encabezado fijo** arriba al hacer scroll, con el color del fondo.
- **Sin scroll horizontal** en ningún ancho: verificado a 390 px y a 1280 px.
- **Color de la barra del navegador** en el celular: el fondo de la app.

## 3. Componentes

- **Encabezado:** "Humanitas" + el lema "Tecnología al servicio de la humanidad". Con sesión, a la derecha, el círculo con las iniciales (borde dorado) que lleva a Mis publicaciones, como en el mockup.
- **Barra inferior:** 3 solapas grandes (60 px): **Inicio**, **Publicar**, **Mis publicaciones**. Sin "Buscar" (ver decisión B). La solapa activa va en `dorado-oscuro`.
- **Solapas del listado:** control segmentado de 48 px: **Necesitan** (por defecto) / **Ofrecen**. En Ofrecen, un segundo control: Servicios / Productos / Todos.
- **Chips de rubro:** fila horizontal, 44 px de alto. Inactivo: borde `borde-campo`, texto `texto-2`. Activo: fondo `dorado-claro`, borde `dorado`, texto `dorado-profundo`.
- **Selector "Tu barrio":** ordena, nunca filtra (8.1). Va en una tarjeta de aviso con el kicker "Cómo se ordena" (como la tarjeta "Orden de hoy" del mockup) y el texto "Primero lo de tu barrio. Lo demás sigue apareciendo."
- **Fila de publicación:**
  - Contenido: etiqueta Ofrezco/Necesito · rubro · barrio (si tiene) · antigüedad ("hace 2 días"), título, precio (si tiene) y miniatura de 56 px a la derecha (si tiene).
  - Sin sellos de verificación (18/09/2026).
  - En Ofrecen: "N trabajos concretados" si es mayor a 0. En productos: "N personas pidieron contacto este mes" (8.4).
  - Filas separadas por `divisor`; toda la fila se puede tocar.
- **Botón principal** (uno por pantalla: Contactar por WhatsApp, Seguir, Publicar): **relleno** `dorado-oscuro`, texto blanco, 52 px de alto, radio 10 px, ancho completo.
- **Botón secundario** (Corregir, Ver más): borde `dorado`, texto `dorado-oscuro`, 48 px.
- **Acción discreta** (Denunciar): texto `texto-2` subrayado, área táctil de 44 px.
- **Campos:** 48 px de alto, borde `borde-campo`, radio 9 px. Foco: contorno de 2 px `dorado-oscuro`. Etiqueta arriba, en mayúsculas con leve espaciado (como en el mockup de Publicar), 14 px, color `texto-2`. La ayuda debajo de la etiqueta va en 16 px, en tono normal.
- **Error:** texto `error` de 14 px debajo del campo; en alertas, borde `error`.
- **Aviso:** fondo `dorado-claro`, borde `dorado-borde` con borde izquierdo de 3 px `dorado`, texto `texto`.
- **Botón "Ver más"** al final del listado (sin scroll infinito).
- **Estado vacío:** "Todavía no hay publicaciones de [rubro]. Sé la primera persona en publicar." + botón principal a Publicar.
- **Sin conexión:** aviso fijo arriba: "Sin conexión. Estás viendo lo último que cargaste."

## 3 bis. Referencias del mockup que gustaron (15/09/2026)

Al usuario le gustaron mucho tres pantallas del mockup. Hay que **replicar su look** al desarrollar, respetando las reglas de contenido y de usabilidad de esta guía.

**Valores.**
- **Qué replicar:**
  - Arriba, una línea chica en mayúsculas y en dorado ("MAGNIFICA HUMANITAS · LEÓN XIV").
  - Debajo, la cita grande en negrita como título, entre «», y la referencia en gris ("Magnifica Humanitas, n. 149").
  - Una introducción corta.
  - Una lista de valores separados por líneas finas: número en dorado y mayúsculas ("N. 68"), nombre del valor en negrita y texto debajo.
- **Qué cambia:** el texto de cada valor es la **cita textual** de la sección 7. Nada de paráfrasis, y los números tienen que coincidir con el texto oficial. En el mockup "Dignidad de la persona" figura como n. 149, pero la cita es del 152.

**Publicar.**
- **Qué replicar:**
  - Control segmentado grande **Ofrezco / Necesito**, con la opción activa en dorado claro.
  - Etiquetas de sección en mayúsculas chicas (TÍTULO, RUBRO, BARRIO, DETALLE).
  - Campos con borde suave y radio amplio.
  - Rubros y barrios como chips grandes que se tocan.
- **Qué cambia:**
  - Se reparte en los 3 pasos de 7.3.
  - Suma Servicio / Producto, precio, alias y foto.
  - Suma el chip **"Mi zona no está"**.
  - Rubros y barrios salen de la base.
  - Las etiquetas en mayúsculas van en 14 px y color `texto-2`, no más chicas ni más claras.
  - El borde de los campos es `borde-campo`.
- **Barrio en Publicar:** elegir el barrio de la publicación con chips está bien. Es un dato de la publicación, no un filtro del listado.

**Listado.**
- **Qué replicar:**
  - Filas sin tarjeta, separadas por líneas finas.
  - Etiqueta con borde: **NECESITO** en gris y **OFREZCO** en dorado.
  - Título en negrita, una línea de descripción en gris y nombre de pila abajo.
  - Flecha › a la derecha.
  - Al pie, la frase propia sin comillas: *Humanitas no cobra comisión ni intermedia el dinero. El acuerdo es entre vecinos.*
  - Barra inferior con íconos de línea finos.
- **Qué cambia:**
  - No se muestra "Sin verificar aún" (decisión I).
  - Se agregan rubro · barrio · antigüedad, precio y miniatura si hay (7.1).
  - La barra inferior queda en Inicio / Publicar / Mis publicaciones (decisión B).

## 4. Decisiones sobre el mockup (15/09/2026)

| # | En el mockup | Cómo queda |
|---|---|---|
| A | Filtro por barrio | Selector "Tu barrio" que **ordena**, nunca filtra |
| B | Buscador de texto y de vecinos | Fuera del MVP (R22 es P1; buscar personas va contra P6/P7) |
| C | Reglas inventadas (24 h, 6:00, visitas, barrios linderos, registro de 7 días) | Las reglas reales de 8.2 (sección 5) |
| D | "Por qué ves esto acá" personalizado | Link fijo "Cómo se ordena el listado" |
| E | Listado mezclado | Solapas Necesitan / Ofrecen + Servicios / Productos (7.1) |
| F | Detalle con campos que no existen, sin Denunciar | Precio, barrio, antigüedad, alias de pago, concretados, Contactar y **Denunciar** |
| G | Publicar en un solo formulario, foto de 60 kB, "entra mañana" | 3 pasos (7.3), foto de menos de 200 KB, queda activa al publicar |
| H | Textos que no son ciertos | Corregidos (sección 6) |
| I | "Sin verificar aún" | Sin verificación presencial: no se muestra ningún sello (18/09/2026, sin puntos de alta) |

## 5. Texto de "Cómo se ordena el listado" (8.2)

1. **Primero, lo de tu barrio.** Si elegiste barrio, primero van las publicaciones de tu barrio, después las de tu ciudad y después el resto. Las que no tienen barrio aparecen igual.
2. **Todos rotan.** Cada vez que una publicación se muestra, pasa al final de la fila. Primero van las que hace más tiempo que no se muestran.
3. **Si empatan, va primero la más nueva.**
4. **No hay nada más.** No se paga por aparecer, no hay puntajes ni estrellas y nadie puede destacar a nadie. La verificación no cambia el orden.

## 6. Textos corregidos del mockup

| Mockup | Queda |
|---|---|
| Tu teléfono sólo se muestra cuando alguien toca contactar. | Tu celular no se muestra en ninguna pantalla. Solo lo recibe por WhatsApp quien te quiere contactar y también dejó el suyo. |
| Guarda lo mínimo: tu nombre, tu barrio y lo que publicás. | Guardamos lo mínimo: tu nombre, tu celular, tu barrio si lo elegís y lo que publicás. |
| Acercate con tu DNI a la Vecinal… (horarios inventados) | Se quita: no hay verificación presencial ni puntos de alta (18/09/2026). |
| Estado "Pausada" | Estados reales: Activa, Cerrada, En revisión |
| Entra en la rotación de mañana a las 6:00. | Tu publicación ya se ve en el barrio. |
| Se comprime a menos de 60 kB. | Se achica en tu celular para no gastarte datos. |

## 7. Citas de *Magnifica Humanitas*

**Regla:** comillas solo para citas textuales verificadas contra la traducción oficial (vatican.va), siempre con el número. Un resumen propio va sin comillas.

Citas verificadas el 15/09/2026:

| § | Tema | Cita textual |
|---|---|---|
| 149 | Trabajo y dignidad (inicio) | «El trabajo no es un simple instrumento, sino que expresa y acrecienta la dignidad de nuestra vida.» |
| 149 | Trabajo digno (publicación lista) | «el objetivo es ofrecer a cada persona las condiciones para vivir dignamente a través de su propio trabajo» |
| 152 | Dignidad de la persona (mis datos) | «la persona humana es un fin y no un medio, y el orden económico debe permanecer subordinado a su dignidad y al bien común» |
| 148 | Valor del trabajo (cerrar un pedido) | «a través de él la persona desarrolla muchas dimensiones de su propia existencia» |
| 68 | Subsidiariedad (términos) | «aquello que pueden hacer las personas, las familias, las comunidades locales y los cuerpos intermedios no debe ser absorbido por instancias superiores» |
| 73 | Solidaridad | «todo ser humano es creado a imagen de Dios e incorporado a una red de relaciones que lo vinculan a los demás, a los pueblos y a la creación» |
| 174 | Contra la mercantilización | «la dignidad inalienable de todo ser humano y el bien común, como fines de la sociedad y como criterios de toda decisión personal, social y política» |

El §63 del mockup se saca: la frase atribuida no está en el texto.

Frase propia (sin comillas) del bloque "Fundamento": *Humanitas no cobra comisión ni intermedia pagos. Se inspira en la encíclica Magnifica Humanitas de León XIV (15 de mayo de 2026).*

## 8. UI/UX empática (18/09/2026)

- **Sin ejemplos adentro de los campos.** En mayúscula, un placeholder parece texto ya escrito. El ejemplo va en una línea de ayuda arriba del campo ("Por ejemplo: …") y no desaparece al escribir.
- **Opciones con explicación.** En Publicar, cada opción es una tarjeta grande con una línea que dice qué significa ("Ofrezco algo: un trabajo que sé hacer o algo que vendo").
- **Rubros agrupados** en "Servicios" y "Productos" cuando se ven los dos. En el listado, "Otros servicios" y "Otros productos".
- **Foto con botón propio** ("Agregar una foto", "Cambiar la foto", "Quitar la foto"). Sin `capture`: el celular ofrece cámara o galería.
- **Antes de contactar se ve el mensaje** que se va a mandar, tal cual.
- **Bienvenida** para quien entra por primera vez: qué es y cómo funciona en tres pasos. Se cierra con "Entendido" (cookie sin identificador).
- **Siempre se ve que algo está pasando:** "Cargando…" entre pantallas y botones que dicen "Guardando…", "Enviando…", "Abriendo WhatsApp…" y no se pueden tocar dos veces.
- **Pantallas de error y "no encontrada" en castellano**, sin culpas y con un botón para seguir.
