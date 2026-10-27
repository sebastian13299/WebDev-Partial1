# Prueba #1 – Programación Web

API REST hecha con **TypeScript**, **NestJS** y **SQLite** (`better-sqlite3`), basada en el código brindado por el profesor.

## Requisitos

- [Node.js](https://nodejs.org/) 22 o superior
- [pnpm](https://pnpm.io/) (si no lo tiene: `npm install -g pnpm`)

## Pasos para correr el proyecto

1. Descomprimir el zip y entrar a la carpeta del proyecto:

   ```bash
   cd web-api
   ```

2. Instalar las dependencias:

   ```bash
   pnpm install
   ```

3. Levantar el servidor:

   ```bash
   pnpm run start:dev
   ```

La API queda disponible en **http://localhost:8000** (otro puerto se puede usar con la variable `PORT`).

La base de datos `db.sqlite` se crea automáticamente en la carpeta del proyecto la primera vez que se ejecuta. Las tablas `user`, `payment` y `log` se crean al iniciar.

## Endpoints

### Usuarios – `/users`

| Método | Ruta         | Descripción                      |
| ------ | ------------ | -------------------------------- |
| POST   | `/users`     | Crea un usuario                  |
| GET    | `/users`     | Lista todos los usuarios         |
| GET    | `/users/:id` | Obtiene un usuario               |
| PUT    | `/users/:id` | Actualiza un usuario             |
| DELETE | `/users/:id` | Elimina un usuario (y sus pagos) |

```json
{ "name": "juan carlos", "lastname": "pérez", "age": 30 }
```

- `id`: UUID (texto) generado con `randomUUID()` al crear el registro
- `name`: requerido y se guarda capitalizado (`"juan carlos"` → `"Juan Carlos"`)
- `lastname`: opcional y se guarda capitalizado
- `age`: requerido, entero entre 1 y 115

### Pagos – `/payments`

| Método | Ruta            | Descripción           |
| ------ | --------------- | --------------------- |
| POST   | `/payments`     | Crea un pago          |
| GET    | `/payments`     | Lista todos los pagos |
| GET    | `/payments/:id` | Obtiene un pago       |
| PUT    | `/payments/:id` | Actualiza un pago     |
| DELETE | `/payments/:id` | Elimina un pago       |

```json
{ "user_id": "b03cc4d4-af93-4695-a894-93c2f4a132a4", "amount": 1500.75, "moneda": "USD" }
```

- `id`: UUID (texto) generado con `randomUUID()` al crear el registro
- `user_id`: requerido, UUID del usuario, llave foránea a `user(id)` (el usuario debe existir)
- `amount`: requerido, decimal entre 0 y 100000
- `moneda`: requerido, solamente `"USD"` o `"CRC"`
- `datetime`: se genera con la hora del back-end al crear el pago

### Reportes – `/reports`

| Método | Ruta                         | Descripción                                                                                   |
| ------ | ---------------------------- | --------------------------------------------------------------------------------------------- |
| GET    | `/reports/payments-per-user` | `LEFT JOIN` entre usuarios y pagos: todos los datos del pago, más `id`, `name` y `lastname` del usuario |
| GET    | `/reports/payments-with-iva` | Datos de la tabla de pagos, más `net_amount` (monto con 13% de IVA)                            |

Ambos reportes se resuelven únicamente con consultas SQL.

### Logs – `/logs`

Un interceptor global guarda en la tabla `log` cada petición `GET`, `POST`, `PUT` y `DELETE` que llega a cualquier controlador. Cada registro tiene:

- `id` (UUID)
- `action`
- `request_body` (JSON del cuerpo, o `null` si la petición no trae cuerpo)
- `datetime` (hora del back-end)

| Método | Ruta    | Descripción                  |
| ------ | ------- | ---------------------------- |
| GET    | `/logs` | Lista todos los logs guardados |

## Errores

- Datos inválidos → `400 Bad Request`
- Registros inexistentes → `404 Not Found`

Ejemplo:

```json
{ "message": "Moneda must be 'USD' or 'CRC'", "error": "Bad Request", "statusCode": 400 }
```

## Guía de pruebas

Esta sección explica cómo verificar que todos los módulos funcionan. Las pruebas se pueden hacer con **Thunder Client** (extensión de VS Code), **Postman** o cualquier cliente HTTP.

### Opción rápida: importar la colección

El proyecto incluye el archivo [`thunder-client-collection.json`](thunder-client-collection.json) con todas las peticiones de esta guía. Se puede importar así:

- **Thunder Client:** pestaña *Collections*, luego menú **☰**, luego **Import**, y seleccionar el archivo.
- **Postman:** **Import**, y seleccionar el archivo.

Las peticiones se ejecutan **en orden, de arriba hacia abajo**. Los textos `PASTE_USER_1_ID`, `PASTE_PAYMENT_1_ID`, etc. se reemplazan por los `id` reales que devuelve la API (ver abajo).

### Antes de empezar

1. Levantar el servidor con `pnpm run start` y esperar el mensaje `Nest application successfully started`.
2. URL base: `http://localhost:8000`
3. Para empezar con la base de datos vacía: detener el servidor, borrar `db.sqlite` y volver a levantarlo.

> **Importante:** los `id` son **UUID** generados al crear cada registro (por ejemplo `b03cc4d4-af93-4695-a894-93c2f4a132a4`). Hay que **copiar el `id` de cada respuesta** y usarlo en las peticiones siguientes, donde dice `USER_1`, `PAYMENT_1`, etc.

En el cliente HTTP: crear una petición nueva, elegir el método y pegar la URL. Para POST/PUT, ir a **Body → JSON** y pegar el JSON.

---

### 1. Usuarios: `/users`

#### Crear 3 usuarios (guardar cada `id`)

**POST** `http://localhost:8000/users`

```json
{ "name": "juan carlos", "lastname": "pérez mora", "age": 30 }
```

Respuesta esperada **201**:

```json
{ "id": "b03cc4d4-af93-4695-a894-93c2f4a132a4", "name": "Juan Carlos", "lastname": "Pérez Mora", "age": 30 }
```

📋 Guardar este `id` como **USER_1**. Note que el nombre y el apellido se guardan **capitalizados**.

**POST** `http://localhost:8000/users`

```json
{ "name": "ANA", "age": 25 }
```

Esperado: `"name": "Ana"`, `"lastname": null` (el apellido es opcional). 📋 Guardar como **USER_2**.

**POST** `http://localhost:8000/users`

```json
{ "name": "sin pagos", "age": 50 }
```

Esperado: `"name": "Sin Pagos"`. 📋 Guardar como **USER_3**.

#### Consultar y actualizar

| Método | URL | Body | Resultado esperado |
| --- | --- | --- | --- |
| GET | `/users` | — | Lista con los 3 usuarios |
| GET | `/users/USER_1` | — | Juan Carlos |
| PUT | `/users/USER_2` | `{ "lastname": "gómez", "age": 26 }` | Ana con `"lastname": "Gómez"` y `"age": 26`, mismo `id` |

#### Pruebas de validación (deben fallar)

| Método | URL | Body | Resultado esperado |
| --- | --- | --- | --- |
| POST | `/users` | `{ "name": "x", "age": 0 }` | **400**, edad fuera de rango (1 a 115) |
| POST | `/users` | `{ "name": "x", "age": 116 }` | **400**, edad fuera de rango (1 a 115) |
| POST | `/users` | `{ "name": "x", "age": 20.5 }` | **400**, la edad debe ser un entero |
| POST | `/users` | `{ "age": 20 }` | **400**, `Name is required` |
| POST | `/users` | `{ "name": "   ", "age": 20 }` | **400**, `Name is required` |
| GET | `/users/no-existe` | — | **404**, `User not found` |
| PUT | `/users/USER_1` | `{ "age": 200 }` | **400** (el PUT también valida) |

---

### 2. Pagos: `/payments`

#### Crear pagos (el `user_id` va **entre comillas** porque es un UUID)

**POST** `http://localhost:8000/payments`

```json
{ "user_id": "USER_1", "amount": 1000, "moneda": "USD" }
```

Respuesta esperada **201**:

```json
{ "id": "45110c31-383a-4d74-9509-35d25571655d", "user_id": "b03cc4d4-af93-4695-a894-93c2f4a132a4", "amount": 1000, "moneda": "USD", "datetime": "2026-10-26T23:39:34.892Z" }
```

📋 Guardar como **PAYMENT_1**. El campo `datetime` **no se envía**: lo genera el back-end.

**POST** `/payments`

```json
{ "user_id": "USER_1", "amount": 25000.5, "moneda": "CRC" }
```

**POST** `/payments`

```json
{ "user_id": "USER_2", "amount": 100, "moneda": "USD" }
```

📋 Guardar como **PAYMENT_3**.

#### Consultar, actualizar y eliminar

| Método | URL | Body | Resultado esperado |
| --- | --- | --- | --- |
| GET | `/payments` | — | Los 3 pagos, del más antiguo al más reciente |
| GET | `/payments/PAYMENT_1` | — | El pago de 1000 USD |
| PUT | `/payments/PAYMENT_3` | `{ "amount": 200, "moneda": "CRC" }` | Monto 200 CRC, con el **mismo `datetime`** que antes |
| DELETE | `/payments/PAYMENT_3` | — | Devuelve el pago eliminado |
| GET | `/payments/PAYMENT_3` | — | **404**, `Payment not found` (confirma que se eliminó) |

#### Pruebas de validación (deben fallar)

| Body (POST `/payments`) | Resultado esperado |
| --- | --- |
| `{ "user_id": "USER_1", "amount": 10, "moneda": "EUR" }` | **400**, `Moneda must be 'USD' or 'CRC'` |
| `{ "user_id": "USER_1", "amount": 10, "moneda": "usd" }` | **400** (distingue mayúsculas y minúsculas) |
| `{ "user_id": "USER_1", "amount": 100001, "moneda": "USD" }` | **400**, monto fuera de rango (0 a 100000) |
| `{ "user_id": "USER_1", "amount": -5, "moneda": "USD" }` | **400**, monto fuera de rango (0 a 100000) |
| `{ "user_id": "USER_1", "moneda": "USD" }` | **400**, el monto es requerido |
| `{ "user_id": "no-existe", "amount": 10, "moneda": "USD" }` | **404**, `User not found` (llave foránea) |
| `{ "user_id": 5, "amount": 10, "moneda": "USD" }` | **400**, `user_id` debe ser texto |

---

### 3. Reportes: `/reports`

**GET** `http://localhost:8000/reports/payments-per-user`

Qué verificar:

- Juan Carlos aparece **dos veces**, una por cada pago.
- Ana y Sin Pagos aparecen con `payment_id: null` y `amount: null`. Esto demuestra que el **LEFT JOIN** funciona.

```json
[
  { "user_id": "be67...", "name": "Ana", "lastname": "Gómez", "payment_id": null, "amount": null, "moneda": null, "datetime": null },
  { "user_id": "b03c...", "name": "Juan Carlos", "lastname": "Pérez Mora", "payment_id": "4511...", "amount": 1000, "moneda": "USD", "datetime": "..." }
]
```

**GET** `http://localhost:8000/reports/payments-with-iva`

Cada pago trae los mismos datos de la tabla de pagos, más la columna **`net_amount`** = `amount × 1.13`:

| amount | net_amount |
| --- | --- |
| 1000 | 1130 |
| 25000.5 | 28250.56 |

---

### 4. Eliminar un usuario (en cascada)

| Método | URL | Resultado esperado |
| --- | --- | --- |
| DELETE | `/users/USER_1` | Devuelve a Juan Carlos |
| GET | `/payments` | Los pagos de Juan Carlos **también se eliminaron** |
| GET | `/reports/payments-per-user` | Solo quedan Ana y Sin Pagos |

---

### 5. Logs: `/logs`

**GET** `http://localhost:8000/logs`

Qué verificar:

- Hay **un registro por cada petición** realizada, **incluidas las que fallaron** con 400 o 404.
- `action` es `GET`, `POST`, `PUT` o `DELETE`.
- `request_body` tiene el JSON enviado en POST/PUT y es `null` en GET/DELETE.
- `datetime` es la hora del back-end y `id` es un UUID.

```json
[
  { "id": "d6ff...", "action": "POST", "request_body": "{\"name\":\"juan carlos\",\"lastname\":\"pérez mora\",\"age\":30}", "datetime": "2026-10-26T23:39:34.699Z" },
  { "id": "6749...", "action": "GET", "request_body": null, "datetime": "..." }
]
```

---

### Lista de verificación

- [ ] Usuarios: crear, listar, consultar, actualizar y errores de validación
- [ ] Pagos: crear, listar, consultar, actualizar (sin cambiar el `datetime`), eliminar y errores de validación
- [ ] `payments-per-user` muestra a los usuarios sin pagos
- [ ] `payments-with-iva` trae la columna `net_amount`
- [ ] Al eliminar un usuario se eliminan sus pagos
- [ ] `/logs` tiene un registro por cada petición
