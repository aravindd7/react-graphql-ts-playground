import "reflect-metadata";
import { createConnection } from "typeorm";
import { environment as env } from "../environment";
import { MyContext } from "./types";
import { COOKIE_NAME, __prod__ } from "./constants";

import express from "express";
import cors from "cors";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
// Importing to use GraphQL Playground instead of Apollo Sandbox. Sandbox
// needs a lot of work to be able to set cookies while sending queries.
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core/dist/plugin/landingPage/graphqlPlayground";

// Redis & sessions
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import path from "path";

// Resolvers
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import { Post } from "./entities/Post";
import { User } from "./entities/User";
// import { sendEmail } from "./utils/sendEmail";

const main = async () => {
  // Run this once when the server starts to get the details of ethereal email
  // in the console. Make sure to uncomment console.log(testAccount) in
  // sendEmail.ts.
  // sendEmail(
  //   "myles@myles.com",
  //   "SUBJECT",
  //   undefined,
  //   "<h1>Welcome to the WORLD OF TOMORROW!</h1>"
  // );

  const conn = await createConnection({
    type: "postgres",
    database: "lireddit",
    username: env.DB_USER,
    password: env.DB_PASS,
    host: env.DB_HOST,
    port: env.DB_PORT,
    logging: true,
    synchronize: true,
    migrations: [path.join(__dirname, "./migrations/*")],
    entities: [Post, User],
  });
  
  await conn.runMigrations();

  // Just added this to make the compiler shut up for a bit while
  // I figure out what I want to do with the connection.
  console.log("db: ", conn.options.database);

  const app = express();

  const RedisStore: connectRedis.RedisStore = connectRedis(session);
  const redis: Redis.Redis = new Redis({});
  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        sameSite: "lax", // Protects against CSRF
        httpOnly: true,
        // Secure makes it so the cookie will only work via https. Setting
        // to __prod__ so that the cookie will only be secure in a production
        // environment (when __prod__ evaluates to true). Else (in dev) this
        // is something I don't have to worry about.
        secure: __prod__,
      },
      saveUninitialized: false,
      secret: env.REDIS_SECRET,
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [UserResolver, PostResolver],
      validate: false,
    }),
    context: ({ req, res }): MyContext => ({ req, res, redis }),
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground],
  });

  await apolloServer.start();

  apolloServer.applyMiddleware({ app, cors: false });

  app.listen(4000, () => {
    console.log("server started on localhost:4000");
  });
};

main().catch((error) => {
  console.log(error);
});
