import { MikroORM } from "@mikro-orm/core";
import { environment as env } from "../environment";
import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import path from "path";

export default {
  migrations: {
    path: path.join(__dirname, "./migrations"),
    pattern: /^[\w-]+\d+\.[tj]s$/,
    // Need to disable foreign keys to omit `set_replication_role` queries
    // to PostgreSQL that happens during migraitons. Setting replication role
    // requires the DB user to be a superuser, and I don't want to add SU to
    // this user. This user is only meant to perform CRUD operations.
    // https://github.com/mikro-orm/mikro-orm/issues/190
    disableForeignKeys: false,
  },
  entities: [Post],
  host: env.DB_HOST,
  port: env.DB_PORT,
  dbName: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASS,
  type: "postgresql",
  debug: !__prod__,
} as Parameters<typeof MikroORM.init>[0];
