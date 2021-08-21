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
import { MyContext } from "../types";

import { User } from "../entities/User";

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

    const user = em.create(User, {
      username: options.username,
      password: hashedPassword,
    });

    try {
      await em.persistAndFlush(user);
    } catch(error) {
      // duplicate error
      if (error.code === '23505') {
        return {
          errors: [{ field: "username", message: "the username is already taken" }]
        }
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
