import {
  Arg,
  Ctx,
  Field,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";
import argon2 from "argon2";
import { EntityManager } from "@mikro-orm/postgresql";
import { MyContext } from "../types";

import { User } from "../entities/User";
import { COOKIE_NAME } from "../constants";

// This is another way to declare GraphQL types, instead of using multiple
// @Arg() statements in our functions.
@InputType()
class UsernamePasswordInput {
  @Field()
  username: string;

  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;

  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver() // From GraphQL (type-graphql package)
export class UserResolver {
  /**
   * Returns the current user (logged in)
   * @returns Promise<User | null>
   */
  @Query(() => User, { nullable: true })
  async me(
    @Ctx()
    { em, req }: MyContext
  ): Promise<User | null> {
    if (!req.session.userId) {
      return null;
    }

    const user = await em.findOneOrFail(User, { id: req.session.userId });
    return user;
  }

  /**
   * Registers a user e.g. saves a new user to the db.
   * @param options { username: string, password: string }
   * @returns Promise<UserResponse>
   */
  @Mutation(() => UserResponse)
  async register(
    @Arg("options")
    options: UsernamePasswordInput,
    @Ctx()
    { em, req }: MyContext
  ): Promise<UserResponse> {
    // Check if user has a valid username
    if (options.username.length <= 2) {
      return {
        errors: [{ field: "username", message: "the username is invalid" }],
      };
    }

    if (options.password.length <= 5) {
      return {
        errors: [
          {
            field: "password",
            message: "password length must be greater than 4",
          },
        ],
      };
    }

    const hashedPassword = await argon2.hash(options.password);
    let user;

    try {
      const result = await (em as EntityManager)
        .createQueryBuilder(User)
        .getKnexQuery()
        .insert({
          username: options.username,
          password: hashedPassword,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning("*");
      user = result[0];
    } catch (error) {
      // duplicate error
      if (error.code === "23505") {
        return {
          errors: [
            { field: "username", message: "the username is already taken" },
          ],
        };
      }
    }

    req.session.userId = user.id;

    return { user: user };
  }

  /**
   * Logs in a user with a username and password.
   * @param options { username: string, password: string }
   * @returns Promise<UserResponse>
   */
  @Mutation(() => UserResponse)
  async login(
    @Arg("options")
    options: UsernamePasswordInput,
    @Ctx()
    { em, req }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, { username: options.username });
    if (!user) {
      return {
        errors: [{ field: "username", message: "that username doesn't exist" }],
      };
    }

    const validPassword = await argon2.verify(user.password, options.password);
    if (!validPassword) {
      return {
        errors: [{ field: "password", message: "incorrect password" }],
      };
    }

    req.session.userId = user.id;

    return { user: user };
  }

  /**
   * Logs out an already signed in user
   * @returns Promise<Boolean>
   */
  @Mutation(() => Boolean)
  async logout(@Ctx() { req, res }: MyContext): Promise<Boolean> {
    return new Promise((resolve) =>
      req.session.destroy((error) => {
        if (error) {
          // Debugging for now
          console.log(error);
          resolve(false);
          return;
        }
        res.clearCookie(COOKIE_NAME);
        resolve(true);
      })
    );
  }

  /**
   * Returns all the users in the db.
   * @returns Promise<User[]>
   */
  @Query(() => [User], { description: "Returns all the users in the db." }) // GraphQL decorator
  users(@Ctx() { em }: MyContext): Promise<User[]> {
    return em.find(User, {});
  }

  /**
   * Returns a single user from the db based on id.
   * @param id number
   * @returns Promise<User | null>
   */
  user(
    @Arg("id", () => Int) // These are just decorators for parameters from type-graphql
    id: number,
    @Ctx()
    { em }: MyContext
  ): Promise<User | null> {
    return em.findOne(User, { id });
  }
}
