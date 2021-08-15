import { MikroORM } from "@mikro-orm/core";

import mikroConfig from "./mikro-orm.config";

// Entities
import { Post } from "./entities/Post";

const main = async () => {
  const orm = await MikroORM.init(mikroConfig);
  await orm.getMigrator().up();

  // Adding a post to the db
  // const post = orm.em.create(Post, { title: "literally the first post" });
  // await orm.em.persistAndFlush(post);

  // Find all the debug posts in db
  const posts = await orm.em.find(Post, {});
  console.log(posts);
};

main().catch((error) => {
  console.log(error);
});
