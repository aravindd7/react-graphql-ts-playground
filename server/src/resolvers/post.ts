import { Resolver, Query, Ctx, Arg, Int, Mutation } from "type-graphql";
import { MyContext } from "../types";

import { Post } from "../entities/Post";

@Resolver()
export class PostResolver {
  // Returns all posts in the db.
  @Query(() => [Post], { description: "Returns all posts in the db." })
  posts(@Ctx() { em }: MyContext): Promise<Post[]> {
    return em.find(Post, {});
  }

  // Returns a post based on id.
  @Query(() => Post, {
    nullable: true,
    description: "Returns a single post in the db based on id.",
  })
  post(
    @Arg("id", () => Int) id: number,
    @Ctx() { em }: MyContext
  ): Promise<Post | null> {
    return em.findOne(Post, { id });
  }

  // Creates a post.
  @Mutation(() => Post, { description: "Creates a post in the db." })
  async createPost(
    @Arg("title") title: string,
    @Ctx() { em }: MyContext
  ): Promise<Post> {
    const post = em.create(Post, { title });
    await em.persistAndFlush(post);
    return post;
  }

  // Update a pre-existing post.
  @Mutation(() => Post, { nullable: true, description: "Updates a post in the db." })
  async updatePost(
    @Arg("id") id: number,
    @Arg("title") title: string,
    @Ctx() { em }: MyContext
  ): Promise<Post | null> {
    const post = await em.findOne(Post, { id });

    if (!post) return null;
    if (typeof title !== 'undefined') {
      post.title = title;
      await em.persistAndFlush(post);
    }

    return post;
  }

  // Delete a post.
  @Mutation(() => Boolean, { description: "Deletes a post from the db." })
  async deletePost(
    @Arg("id") id: number,
    @Ctx() { em }: MyContext
  ): Promise<boolean> {
    try {
      await em.nativeDelete(Post, { id });
    } catch {
      return false;
    }
    return true;
  }
}
