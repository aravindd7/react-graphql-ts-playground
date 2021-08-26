import {
  Resolver,
  Query,
  Arg,
  Mutation,
  InputType,
  Field,
  Ctx,
  UseMiddleware,
  Int,
} from "type-graphql";

import { MyContext } from "../types";
import { isAuth } from "../middleware/isAuth";
import { Post } from "../entities/Post";
import { getConnection } from "typeorm";

@InputType()
class PostInput {
  @Field() title: string;
  @Field() text: string;
}

@Resolver()
export class PostResolver {
  // Returns all posts in the db.
  @Query(() => [Post], {
    description: "Returns posts from the db with a limit and cursor.",
  })
  posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ): Promise<Post[]> {
    const realLimit = Math.min(50, limit);
    const qb = getConnection()
      .getRepository(Post)
      .createQueryBuilder("p")
      
    if (cursor) {
      qb.where('"createdAt" < :cursor', { cursor: new Date(parseInt(cursor)) });
    }

    return qb.orderBy('"createdAt"', "DESC")
      .take(realLimit)
      .getMany();
  }

  // Returns a post based on id.
  @Query(() => Post, {
    nullable: true,
    description: "Returns a single post in the db based on id.",
  })
  post(@Arg("id") id: number): Promise<Post | undefined> {
    return Post.findOne(id);
  }

  // Creates a post.
  @Mutation(() => Post, { description: "Creates a post in the db." })
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("input") input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post> {
    return Post.create({
      ...input,
      creatorId: req.session.userId,
    }).save();
  }

  // Update a pre-existing post.
  @Mutation(() => Post, {
    nullable: true,
    description: "Updates a post in the db.",
  })
  async updatePost(
    @Arg("id") id: number,
    @Arg("title") title: string
  ): Promise<Post | undefined> {
    const post = await Post.findOne(id);

    if (!post) return undefined;
    if (typeof title !== "undefined") {
      await Post.update({ id }, { title });
    }

    return post;
  }

  // Delete a post.
  @Mutation(() => Boolean, { description: "Deletes a post from the db." })
  async deletePost(@Arg("id") id: number): Promise<boolean> {
    try {
      await Post.delete(id);
    } catch {
      return false;
    }
    return true;
  }
}
