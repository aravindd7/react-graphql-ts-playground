import { MikroORM } from "@mikro-orm/core";

import mikroConfig from "./mikro-orm.config";

// Entities
import { Post } from "./entities/Post";

const main = async () => {
  const orm = await MikroORM.init(mikroConfig);

  const post = orm.em.create(Post, { title: "literally the first post" });

  await orm.em.persistAndFlush(post);
};

main().catch((error) => {
  console.log(error);
});
