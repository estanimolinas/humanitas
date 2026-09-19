# Humanitas: el producto

*Tecnología al servicio de la humanidad.*

## Qué es

Humanitas es una app web para **personas, entre personas**: acerca a quien ofrece un trabajo o un producto y a quien lo necesita. Quien quiere trabajar publica el oficio que sabe hacer o lo que vende. Quien tiene un trabajo para dar publica lo que necesita. Después se escriben por WhatsApp y acuerdan directamente entre ellas.

El piloto funciona en la **zona norte de la ciudad de Santa Fe**.

## Para quién

Para personas que usan poco el celular, que muchas veces tienen un equipo de gama baja o con poca señal, y que pueden leer con esfuerzo. Todo el diseño parte de ahí:

- Todo el texto va en **mayúscula de imprenta**, la letra con la que se alfabetiza primero.
- La letra es **Lexend**, pensada para leer con fluidez.
- Cada oficio tiene **su dibujo**, que se reconoce antes de leer.
- Botones grandes, textos cortos, sin palabras técnicas y sin órdenes.
- Pesa poco (189 KB la primera vez) y funciona con mala señal.
- No hace falta instalar nada. Se puede agregar a la pantalla de inicio.

## Cómo funciona

1. **Mirás** lo que se ofrece y lo que se necesita. No hace falta cuenta.
2. **Si algo te sirve, le escribís** a esa persona por WhatsApp. Antes de tocar el botón se ve el mensaje exacto que se va a mandar.
3. **Acuerdan directamente**: el trabajo, el precio y el día.

Para publicar o contactar se pide lo mínimo: nombre y celular. Sin contraseña, sin mail y sin documento.

## Pantallas

| Pantalla | Qué se hace |
|---|---|
| **Inicio** | Bienvenida la primera vez. Listado en dos solapas, *Necesitan* y *Ofrecen*, con filtros por rubro. Botón "Ver más" (sin scroll infinito). |
| **Detalle** | La publicación completa, el mensaje que se va a mandar, *Contactar por WhatsApp* y *Denunciar*. |
| **Publicar** | Dos pasos: qué querés hacer (con la explicación de cada opción) y los detalles (rubro con dibujos, título, detalle, precio, alias, foto). Si no hay cuenta, un paso más con nombre y celular. Nada de lo escrito se pierde. |
| **Mis publicaciones** | El perfil, las publicaciones con su estado y las acciones: ver, editar, cerrar, volver a publicar. Mis datos, Ayuda y Cerrar sesión. |
| **Cerrar un pedido** | "¿Lo resolviste?" Si fue con alguien que escribió por la app, se le suma un trabajo concretado. |
| **Ayuda** | Cómo recuperar la cuenta, ver los datos o darse de baja, con el WhatsApp del equipo. |
| **Términos** | Qué es Humanitas, su papel, qué se guarda, los derechos de cada persona. Texto borrador. |

## Principios que no se negocian

- **De personas entre personas.** Ninguna institución (parroquia, vecinal, Estado) interviene en los acuerdos ni aparece en la app.
- **Sin comisiones ni pagos.** *Humanitas no percibe comisiones ni intermedia pagos. Los acuerdos económicos se establecen directamente entre las partes.* Este aviso aparece igual en el inicio, junto a Contactar, al publicar, en el alta y en los términos.
- **El celular nunca se muestra.** Lo recibe, a través de WhatsApp, solo quien también dejó el suyo.
- **Orden justo.** Nadie paga por aparecer, no hay puntajes ni estrellas, nadie puede destacar a nadie. Las publicaciones rotan: lo que se mostró pasa al final de la fila (sección 8.2 del requerimiento).
- **Nada de seguimiento.** Sin analytics de terceros, sin notificaciones push, sin gamificación.
- **Lo mínimo de datos.** Nombre, celular y lo que se publica. Nada más.

## Identidad

- **Lema:** *Tecnología al servicio de la humanidad.* Es una frase propia.
- **Símbolo:** dos círculos que se tocan, el encuentro entre quien ofrece y quien necesita.
- **Los oficios dibujados:** un dibujo de línea dorado por rubro. Es el sello visual de la app.
- **Paleta:** fondo gris cálido, texto casi negro y dorado. Colores y contrastes en [guia-visual.md](guia-visual.md).
- **Encíclica *Magnifica Humanitas*:** hay citas en contexto donde son pertinentes (el trabajo en el inicio y al publicar, la dignidad en Mis datos). Son siempre textuales, de la traducción oficial de vatican.va, y llevan el número de párrafo.

## Tono

Amable antes que correcto. Los errores dicen lo que falta con calidez ("Nos falta tu nombre", "¿Lo acortamos?"), nunca dan órdenes. Los términos dicen primero lo que Humanitas **es** y después sus límites.

## Rubros

**Servicios:** albañilería y construcción, pintura, electricidad y plomería, gas y calefacción, jardinería y poda, limpieza, mudanzas y fletes, peluquería y estética, costura y arreglos, cuidado de personas, mecánica y bicicletas, clases y apoyo escolar, otros.

**Productos:** panadería y pastelería, carnicería y pollería, verdulería, comidas y viandas, almacén y despensa, artesanías, ropa y calzado, otros.

## Qué no hace (a propósito)

- No cobra ni procesa pagos.
- No tiene chat propio: el contacto es por WhatsApp.
- No tiene reseñas ni calificaciones.
- No verifica identidades ni hace verificación presencial (decisión del 18/09/2026).
- No pregunta el barrio mientras haya una sola zona (se activa al cargar los barrios).

## Estado del MVP

El objetivo de esta etapa es validar la idea con un [interno] y presentarla al [interno]. El detalle de qué está cumplido está en [requerimientos.md](requerimientos.md).
