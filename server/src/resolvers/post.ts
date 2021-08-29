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
  FieldResolver,
  Root,
  ObjectType,
} from "type-graphql";

import { MyContext } from "../types";
import { isAuth } from "../middleware/isAuth";
import { Post } from "../entities/Post";
import { getConnection } from "typeorm";
import { Upvotes } from "../entities/Upvotes";

@InputType()
class PostInput {
  @Field() title: string;
  @Field() text: string;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post]) posts: Post[];
  @Field() hasMorePosts: boolean;
}

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 255);
  }

  /**
   * Sets a vote on a post. 
   * @param postId number, the post id where the vote will be set. 
   * @returns Promise<Boolean> 
   */
  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg('postId', () => Int) postId: number,
    @Arg('value', () => Int) value: number,
    @Ctx() { req }: MyContext
  ): Promise<Boolean> {
    const isUpvote = value !== -1;
    const realValue = isUpvote ? 1 : -1;
    const { userId } = req.session;
    
    await Upvotes.insert({
      userId,
      postId,
      value: realValue,
    });

    await Post.update
    await await getConnection().query(`
      UPDATE post p
      SET p.points = p.points + $1
      WHERE p.id = $2
    `, [realValue, postId])

    return true;
  }

  // Returns paginated posts from the db.
  @Query(() => PaginatedPosts, {
    description: "Returns posts from the db with a limit and cursor.",
  })
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = Math.min(50, limit) + 1;

    const replacements: any[] = [realLimitPlusOne];

    if (cursor) {
      replacements.push(new Date(parseInt(cursor)));
    }

    const posts = await getConnection().query(`
      SELECT p.*, 
      json_build_object(
        'id', u.id,
        'username', u.username,
        'email', u.email
      ) creator
      FROM post p
      INNER JOIN public.user u on u.id = p."creatorId"
      ${cursor ? `WHERE p."createdAt" < $2` : ""}
      ORDER by p."createdAt" DESC
      LIMIT $1
    `, replacements);

    // const qb = getConnection()
    //   .getRepository(Post)
    //   .createQueryBuilder("p")
    //   .innerJoinAndSelect(
    //     "p.creator",
    //     "user",
    //     "user.id = :p.creatorId"
    //   )
    //   .orderBy('p."createdAt"', "DESC")
    //   .take(realLimitPlusOne);

    // const posts = await qb.getMany();

    console.log("posts: ", posts);

    return {
      posts: posts.slice(0, realLimit),
      hasMorePosts: posts.length === realLimitPlusOne,
    };
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
