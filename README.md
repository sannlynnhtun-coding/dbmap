# dbmaps

dbmaps runs in the browser. Design schemas with DBML and the ERD canvas, import SQL, copy a built-in template, and export diagrams or a Markdown data dictionary.

Projects are stored in the current browser. Use **Export Full Project Backup** and **Import Project Backup** to move a project between browsers or domains. Backups include the schema, diagram layout, and project settings.

## Run locally

    bun install
    npm run dev

## Build and deploy

    npm run build
    npm run start

Vite builds the static site into dist. Vercel uses vercel.json to build it and serve the SPA routes. The app does not require runtime environment variables, a database, or a backend process.
