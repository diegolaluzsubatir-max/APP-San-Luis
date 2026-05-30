# Club Estudiantil San Luis de Pando — App de Gestión Deportiva

App de gestión deportiva para el Club Estudiantil San Luis de Pando,  
categoría **2017 Mixto**, Liga Costa de Oro Uruguay 2026.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS · Prisma 5 · PostgreSQL (Supabase)

---

## Deploy en producción (Netlify + Supabase)

### Paso 1 — Crear la base de datos en Supabase

1. Entrá a [supabase.com](https://supabase.com) y creá una cuenta gratuita.
2. Creá un nuevo proyecto (elegí la región más cercana a Uruguay, ej: South America).
3. Esperá que el proyecto esté listo (~2 min).
4. Andá a **Settings → Database → Connection string → URI**.
5. Copiá la connection string. Se ve así:
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
6. Reemplazá `[PASSWORD]` con tu contraseña del proyecto.

### Paso 2 — Configurar variables de entorno en Netlify

1. En Netlify, andá a tu site → **Site configuration → Environment variables**.
2. Agregá:

   | Variable | Valor |
   |----------|-------|
   | `DATABASE_URL` | La connection string de Supabase del paso anterior |

### Paso 3 — Conectar el repo a Netlify

1. Subí el proyecto a GitHub:
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   git remote add origin https://github.com/<tu-usuario>/san-luis-app.git
   git push -u origin main
   ```
2. En [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**.
3. Elegí el repo de GitHub.
4. Netlify detecta `netlify.toml` automáticamente. El build command ya incluye:
   ```
   npx prisma generate && npx prisma db push && pnpm build
   ```
   Esto crea las tablas en Supabase automáticamente en cada deploy.
5. Hacé click en **Deploy site**.

### Paso 4 — Cargar datos iniciales (opcional)

Después del primer deploy, para cargar los jugadores, partidos y rivales de ejemplo:

```bash
# En tu máquina local, con DATABASE_URL apuntando a Supabase:
DATABASE_URL="postgresql://..." pnpm db:seed
node scripts/seed-rivales.mjs
```

---

## Variables de entorno necesarias

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Connection string de PostgreSQL (Supabase) | `postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres` |

> Copiá `.env.example` a `.env` para desarrollo local.

---

## Desarrollo local

```bash
# 1. Clonar e instalar
git clone <url-del-repo>
cd san-luis-app
pnpm install

# 2. Variables de entorno — para desarrollo local podés usar SQLite:
#    Cambiá el provider en prisma/schema.prisma a "sqlite" y:
echo 'DATABASE_URL="file:./prisma/dev.db"' > .env

# 3. Crear la DB y poblar con datos
pnpm db:push
pnpm db:seed
node scripts/seed-rivales.mjs

# 4. Correr el servidor
pnpm dev
```

Abrí [http://localhost:3000](http://localhost:3000).

---

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm start` | Servidor de producción |
| `pnpm db:push` | Sincronizar schema con la BD |
| `pnpm db:seed` | Poblar con datos iniciales |
| `pnpm db:studio` | Abrir Prisma Studio (UI visual de la BD) |

---

## Rutas principales

| Ruta | Descripción |
|------|-------------|
| `/dashboard` | Panel principal |
| `/jugadores` | Plantel |
| `/partidos` | Partidos |
| `/entrenamientos` | Entrenamientos |
| `/notas` | Notas internas del cuerpo técnico |
| `/partidos/[id]/planificacion` | Planilla de alineación por cuartos |
