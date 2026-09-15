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

## 3. Componentes

- **Encabezado:** "Humanitas" + subtítulo corto ("Norte de Santa Fe"); flecha de volver en pantallas internas.
- **Barra inferior:** 3 solapas grandes (60 px): **Inicio**, **Publicar**, **Mis publicaciones**. Sin "Buscar" (ver decisión B).
- **Solapas del listado:** control segmentado de 48 px: **Necesitan** (por defecto) / **Ofrecen**. En Ofrecen, un segundo control: Servicios / Productos / Todos.
- **Chips de rubro:** fila horizontal, 44 px de alto. Inactivo: borde `borde-campo`, texto `texto-2`. Activo: fondo `dorado-claro`, borde `dorado`, texto `dorado-profundo`.
- **Selector "Tu barrio":** ordena, nunca filtra (8.1). El texto lo dice: "Primero lo de tu barrio. Lo demás sigue apareciendo."
- **Fila de publicación:**
  - Contenido: etiqueta Ofrezco/Necesito · rubro · barrio (si tiene) · antigüedad ("hace 2 días"), título, precio (si tiene) y miniatura de 56 px a la derecha (si tiene).
  - "✓ Verificado en [lugar]" **solo si aplica**. Nunca "Sin verificar".
  - En Ofrecen: "N trabajos concretados" si es mayor a 0. En productos: "N personas pidieron contacto este mes" (8.4).
  - Filas separadas por `divisor`; toda la fila se puede tocar.
- **Botón principal** (uno por pantalla: Contactar por WhatsApp, Seguir, Publicar): **relleno** `dorado-oscuro`, texto blanco, 52 px de alto, radio 10 px, ancho completo.
- **Botón secundario** (Corregir, Ver más): borde `dorado`, texto `dorado-oscuro`, 48 px.
- **Acción discreta** (Denunciar): texto `texto-2` subrayado, área táctil de 44 px.
- **Campos:** 48 px de alto, borde `borde-campo`, radio 9 px. Foco: contorno de 2 px `dorado-oscuro`. Etiqueta arriba, en 16 px, en tono normal (no en mayúsculas chicas).
- **Error:** texto `error` de 14 px debajo del campo; en alertas, borde `error`.
- **Aviso:** fondo `dorado-claro`, borde `dorado-borde` con borde izquierdo de 3 px `dorado`, texto `texto`.
- **Botón "Ver más"** al final del listado (sin scroll infinito).
- **Estado vacío:** "Todavía no hay publicaciones de [rubro]. Sé la primera persona en publicar." + botón principal a Publicar.
- **Sin conexión:** aviso fijo arriba: "Sin conexión. Estás viendo lo último que cargaste."

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
| I | "Sin verificar aún" | Solo se muestra "Verificado en…" cuando aplica |

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
| Acercate con tu DNI a la Vecinal… (horarios inventados) | Podés verificarte en persona en tu punto de alta. (Los lugares salen de la tabla `referentes`, no del código.) |
| Estado "Pausada" | Estados reales: Activa, Cerrada, En revisión |
| Entra en la rotación de mañana a las 6:00. | Tu publicación ya está en el tablón. |
| Se comprime a menos de 60 kB. | Se achica en tu celular para no gastarte datos. |

## 7. Citas de *Magnifica Humanitas*

**Regla:** comillas solo para citas textuales verificadas contra la traducción oficial (vatican.va), siempre con el número. Un resumen propio va sin comillas.

Citas verificadas el 15/09/2026:

| § | Tema | Cita textual |
|---|---|---|
| 149 | Trabajo y dignidad (inicio) | «El trabajo no es un simple instrumento, sino que expresa y acrecienta la dignidad de nuestra vida.» |
| 149 | Trabajo digno (valores) | «el objetivo es ofrecer a cada persona las condiciones para vivir dignamente a través de su propio trabajo» |
| 152 | Dignidad de la persona | «la persona humana es un fin y no un medio, y el orden económico debe permanecer subordinado a su dignidad y al bien común» |
| 148 | Valor del trabajo | «a través de él la persona desarrolla muchas dimensiones de su propia existencia» |
| 68 | Subsidiariedad | «aquello que pueden hacer las personas, las familias, las comunidades locales y los cuerpos intermedios no debe ser absorbido por instancias superiores» |
| 73 | Solidaridad | «todo ser humano es creado a imagen de Dios e incorporado a una red de relaciones que lo vinculan a los demás, a los pueblos y a la creación» |
| 174 | Contra la mercantilización | «la dignidad inalienable de todo ser humano y el bien común, como fines de la sociedad y como criterios de toda decisión personal, social y política» |

El §63 del mockup se saca: la frase atribuida no está en el texto.

Frase propia (sin comillas) del bloque "Fundamento": *Humanitas no cobra comisión ni intermedia pagos. Se inspira en la encíclica Magnifica Humanitas de León XIV (15 de mayo de 2026).*
