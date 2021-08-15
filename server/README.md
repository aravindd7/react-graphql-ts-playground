# Overview
### Starting the dev environment
You need to start two different servers, one to watch for file changes in *.ts
files and output changes to the dist folder, and another to actually view the
changes in the program (e.g. in the console).

```
// Terminal 1
$ yarn watch

// Terminal 2
$ yarn dev
```

### MikroORM Migrations
In order to create a migration for new entities, we can use MikroORM's
migration tool:

```
$ npx mikro-orm migration:create
```

The application itself will migrate to the latest version when run e.g.
it will perform `$ npx mikro-orm migration:up` within `index.ts` upon start.