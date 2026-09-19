# Arquitectura

Cómo está hecha Humanitas por dentro: las piezas, el modelo de datos y cómo viaja la información en cada flujo. Los diagramas usan Mermaid, que GitHub muestra dibujados.

## Vista general

Humanitas es **un monolito** Next.js: las pantallas y el servidor viven en el mismo proyecto. La base de datos y el almacenamiento de fotos son de Supabase, pero **solo el servidor les habla**. El navegador nunca recibe una clave ni se conecta a Supabase.

```mermaid
flowchart LR
    subgraph Celular["Celular de la persona"]
        N["Navegador<br/>PWA + service worker"]
    end

    subgraph Vercel["Vercel (San Pablo, gru1)"]
        P["proxy.ts<br/>CSP con nonce, sesión, rotación del token"]
        S["Next.js<br/>pantallas del servidor + server actions"]
    end

    subgraph Supabase["Supabase (San Pablo)"]
        DB[("Postgres<br/>tablas, reglas y funciones")]
        ST[("Storage<br/>bucket fotos")]
    end

    WA["WhatsApp<br/>(wa.me)"]

    N -- "HTTPS" --> P --> S
    S -- "service role key<br/>(solo servidor)" --> DB
    S -- "sube fotos" --> ST
    N -- "lee fotos públicas" --> ST
    N -- "abre el chat" --> WA
```

### Principios

- **La base hace cumplir las reglas.** Los límites anti-abuso, el orden del listado, los concretados y las denuncias viven en funciones SQL con candados (`pg_advisory_xact_lock`). La app no puede saltearlas aunque tenga un error.
- **Nada se borra.** Los triggers `*_sin_delete` rechazan DELETE y TRUNCATE en todas las tablas. Las únicas excepciones son `eventos` y `limites`, que se podan con scripts manuales.
- **El teléfono no sale.** Solo lo lee la función `registrar_contacto`, en el servidor, para armar el link `wa.me`.
- **Supabase cerrado.** RLS activo sin políticas y sin permisos para `anon` ni `authenticated`: con la clave pública no se lee ni se escribe nada.

## Código

```
app/                      Pantallas (App Router) y server actions
  page.tsx                Listado (inicio)
  p/[id]/                 Detalle, contactar, denunciar
  publicar/               Publicar en pasos + alta embebida
  alta/                   Alta mínima
  mis-publicaciones/      Perfil, cerrar, reactivar, editar, mis datos, cerrar sesión
  ayuda/, terminos/       Páginas de texto
  componentes/            Encabezado, barra inferior, oficios dibujados, avisos, citas
  api/health/             Chequeo de disponibilidad
lib/                      Lógica: validaciones, acceso a datos, sesión, seguridad
  supabase/servidor.ts    Único cliente de Supabase (server-only, service role)
  sesion/                 Token, cookie, rotación
  seguridad/              Cabeceras, CSP, límites por conexión
proxy.ts                  Corre antes de cada pantalla
supabase/migrations/      Esquema, reglas y funciones (iguales en local y en la nube)
supabase/seed.sql         Datos de ejemplo, solo en local
scripts/                  Tareas del equipo (baja, respaldo, poda, chequeo de secretos)
tests/                    Vitest contra Supabase local
public/sw.js              Service worker (modo sin conexión)
```

## Modelo de datos

Las tablas son exactamente las de la sección 12.3 del requerimiento, más `limites` (11.5, seguridad).

```mermaid
erDiagram
    personas ||--o{ publicaciones : publica
    personas ||--o{ contactos : "pide contacto"
    publicaciones ||--o{ contactos : recibe
    publicaciones ||--o{ denuncias : recibe
    personas ||--o{ denuncias : "denuncia (opcional)"
    publicaciones ||--o{ concretados : "cierra un necesito"
    personas ||--o{ concretados : "hizo el trabajo"
    rubros ||--o{ publicaciones : clasifica
    zonas ||--o{ publicaciones : ubica
    zonas ||--o{ zonas : contiene
    personas ||--o{ acciones_operador : "registra (equipo)"

    personas {
        uuid id
        text nombre
        text telefono "único; vacío solo si se dio de baja"
        text token_hash "SHA-256 del token"
        timestamptz token_emitido_en
        bool es_operador
        timestamptz archivado_en
    }
    publicaciones {
        uuid id
        text tipo "ofrezco | necesito"
        text subtipo "servicio | producto"
        text titulo
        text estado "activa | cerrada | en_revision | archivada"
        timestamptz ultima_exposicion "rotación 8.2"
        timestamptz vence_en
    }
    contactos {
        uuid id
        uuid publicacion_id
        uuid persona_solicitante_id
    }
    concretados {
        uuid publicacion_necesito_id
        uuid persona_que_hizo_id
        uuid confirmado_por_persona_id
    }
    denuncias {
        uuid publicacion_id
        uuid persona_id "null si es sin cuenta"
        text motivo
        timestamptz resuelta_en
    }
    limites {
        text ip_hash "SHA-256 de la IP con sal"
        text accion "alta | denuncia_anonima"
    }
```

También existen `referentes`, `eventos`, `eventos_mensuales` y `acciones_operador`. `referentes` y los campos `verificado_*` quedan sin uso desde el 18/09/2026 (sin verificación presencial). `eventos` todavía no se llena.

## Flujos

### Mirar el listado (sin cuenta)

```mermaid
sequenceDiagram
    actor V as Visitante
    participant N as Navegador
    participant P as proxy.ts
    participant S as Servidor Next.js
    participant DB as Postgres

    V->>N: Abre la app
    N->>P: GET /
    P->>P: Nonce nuevo y CSP
    P->>S: Sigue el pedido
    S->>DB: listar_publicaciones(tipo, rubro, zona de quien mira)
    DB->>DB: Ordena por zona, ultima_exposicion y fecha (8.2)
    DB->>DB: Marca lo servido (como mucho 1 vez por minuto)
    DB-->>S: 10 filas, sin teléfonos
    S-->>N: HTML con CSP
    N->>N: El service worker guarda la pantalla para sin conexión
```

### Publicar sin cuenta, con foto

```mermaid
sequenceDiagram
    actor V as Visitante
    participant N as Navegador
    participant S as Server action publicar
    participant DB as Postgres
    participant ST as Storage

    V->>N: Completa los pasos (el borrador queda en el celular)
    V->>N: Elige una foto
    N->>N: La reduce a menos de 200 KB (canvas)
    V->>N: Nombre, celular, términos y 18 años
    N->>S: Envía todo junto
    S->>S: Valida los campos
    S->>DB: registrar_intento(IP cifrada, alta, 30 por día)
    S->>DB: Crea la persona y el hash del token
    S->>N: Cookies de sesión (httpOnly)
    S->>DB: crear_publicacion (3 por día, 20 activas, rubro válido)
    DB-->>S: id de la publicación
    S->>S: Comprueba que el archivo sea JPG o WEBP por su contenido
    S->>ST: Sube la foto
    S->>DB: Guarda la foto en la publicación
    S-->>N: Redirige a "Tu publicación ya está visible"
```

La publicación se crea **antes** de subir la foto: si la base la rechaza por un límite, no queda ninguna foto suelta en el Storage.

### Contactar por WhatsApp

```mermaid
sequenceDiagram
    actor A as Persona con cuenta
    participant N as Navegador
    participant S as Server action contactar
    participant DB as Postgres
    participant WA as WhatsApp

    A->>N: Ve el mensaje que se va a mandar y toca Contactar
    N->>S: POST con el id de la publicación
    S->>S: Valida la sesión y el id
    S->>DB: registrar_contacto(publicación, persona)
    DB->>DB: Candado por persona y máximo 15 por día
    alt Es su propia publicación
        DB-->>S: Sin teléfono y sin registro
        S-->>N: "Esta publicación es tuya"
    else Pasó el máximo
        DB-->>S: limite_alcanzado
        S-->>N: "Por hoy llegaste a los 15 contactos"
    else Todo bien
        DB->>DB: Guarda el contacto (8.3)
        DB-->>S: Teléfono, título y nombre
        S-->>N: Redirige a wa.me con el mensaje armado
        N->>WA: Abre el chat
    end
```

El teléfono solo existe dentro de ese redirect. No aparece en ninguna pantalla ni en ninguna respuesta.

### Cerrar un "necesito" y reconocer el trabajo

```mermaid
sequenceDiagram
    actor D as Quien publicó
    participant S as Server action cerrar
    participant DB as Postgres

    D->>S: "Sí, con alguien de acá" y elige a una persona
    S->>DB: cerrar_publicacion(publicación, dueño, motivo, persona elegida)
    DB->>DB: ¿Es suya y está activa?
    DB->>DB: ¿La persona elegida le pidió contacto por esta publicación?
    DB->>DB: Inserta en concretados (la base impide autoasignarse)
    DB->>DB: Estado cerrada
    DB-->>S: ok
    S-->>D: "La publicación se cerró"
```

### Denunciar

```mermaid
sequenceDiagram
    actor X as Persona (con o sin cuenta)
    participant S as Server action denunciar
    participant DB as Postgres

    X->>S: Motivo y detalle
    opt Sin cuenta
        S->>DB: registrar_intento(IP cifrada, denuncia_anonima, 20 por día)
    end
    S->>DB: registrar_denuncia
    DB->>DB: Cuenta personas distintas con denuncias sin resolver
    alt 2 o más
        DB->>DB: Publicación en_revision (sale del listado)
    end
    S-->>X: "Gracias por avisar"
```

Las denuncias sin cuenta quedan registradas para el equipo, pero no alcanzan para ocultar una publicación.

### Sesión: renovación cada 30 días

```mermaid
sequenceDiagram
    participant N as Navegador
    participant P as proxy.ts
    participant DB as Postgres
    participant S as Pantalla

    N->>P: Pedido con la cookie de sesión y la fecha de emisión
    alt Emitido hace menos de 30 días
        P->>S: Sigue sin consultar la base
    else 30 días o más (o sin fecha)
        P->>DB: rotar_token(hash actual, hash nuevo, 30)
        DB->>DB: Rota solo si la fecha real en la base lo confirma
        DB-->>P: Rotado o no, y fecha de emisión
        P->>P: El pedido en curso ya usa el token nuevo
        P->>S: Sigue
        P-->>N: Cookies nuevas
    end
```

Cerrar sesión reemplaza el hash en la base: la cookie vieja deja de servir aunque alguien la haya copiado.

### Baja de una cuenta (Ley 25.326)

```mermaid
sequenceDiagram
    actor Per as Persona
    actor E as Equipo
    participant Sc as scripts/dar-de-baja.mjs
    participant DB as Postgres
    participant ST as Storage

    Per->>E: Pide la baja por el WhatsApp del equipo
    E->>Sc: npm run baja -- "celular" "celular de quien opera"
    Sc->>DB: dar_de_baja(persona, operador)
    DB->>DB: Borra teléfono y nombre, invalida la sesión
    DB->>DB: Archiva y limpia sus publicaciones
    DB->>DB: Registra la acción en acciones_operador
    DB-->>Sc: Lista de fotos
    Sc->>ST: Borra las fotos
```

## Rendimiento

- **Primera carga:** 189 KB comprimidos, de un máximo de 300 KB (R13). Lexend pesa 39 KB y la sirve el propio dominio.
- **Región:** la app (Vercel) y la base (Supabase) están en San Pablo, así las consultas no cruzan el continente.
- **Sin conexión:** el service worker guarda los archivos de la app y la última pantalla vista. Nunca guarda nada de `/api`, `/alta`, `/publicar` ni `/mis-publicaciones`, y al cerrar sesión borra lo guardado.
