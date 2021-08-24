import {
  Arg,
  Ctx,
  Field,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";
import argon2 from "argon2";

import { User } from "../entities/User";
import { MyContext } from "../types";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { EntityManager } from "@mikro-orm/postgresql";
import { UsernamePasswordInput } from "./UsernamePasswordInput";
import { validateRegister } from "../utils/validateRegister";
import { sendEmail } from "../utils/sendEmail";
import { v4 } from "uuid";

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
    const errors = validateRegister(options);
    if (errors) return { errors };

    const hashedPassword = await argon2.hash(options.password);

    let user;

    try {
      // Trying out old way cause I'm a moron.
      const result = await (em as EntityManager)
        .createQueryBuilder(User)
        .getKnexQuery()
        .insert({
          username: options.username,
          email: options.email,
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
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(
      User,
      usernameOrEmail.includes("@")
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail }
    );
    if (!user) {
      return {
        errors: [
          {
            field: "usernameOrEmail",
            message: "that username or email doesn't exist",
          },
        ],
      };
    }

    const validPassword = await argon2.verify(user.password, password);
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
   * Sends an email to the user to reset the password.
   * @returns Promise<Boolean>
   */
  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { em, redis }: MyContext
  ): Promise<Boolean> {
    const user = await em.findOne(User, { email: email });
    const token = v4();

    let htmlResponse = `
      <h2>It looks like you've forgotten your password...</h2>
      <br>
      <a href="http://localhost:3000/change-password/${token}">Reset your password</a>
    `;

    if (!user) return true;
    // The user is not in the db. Don't tell them.
    else {
      // User is in the db. Generate a token to send an email.
      await redis.set(
        FORGET_PASSWORD_PREFIX + token,
        user.id,
        "ex",
        1000 * 60 * 60 * 24 * 3 // Good for 3 days.
      );
    }

    sendEmail(user.email, "You forgot your password!", undefined, htmlResponse);

    return true;
  }
  /**
   * Changes the password of a user via token.
   * @param param0
   * @returns Promise<UserResponse>
   */
  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { em, req, redis }: MyContext
  ): Promise<UserResponse> {
    // Probably should just extract this to make a password validator
    // in a new file. later.
    if (newPassword.length <= 2) {
      return {
        errors: [
          {
            field: "newPassword",
            message: "length must be greater than 2",
          },
        ]
      };
    };
   
    const key = `${ FORGET_PASSWORD_PREFIX }${ token }`;
    const userId = await redis.get(key);

    if (!userId) {
      return {
        errors: [{ field: "token", message: "token expired" }]
      }
    }

    const user = await em.findOne(User, { id: parseInt(userId) });

    if (!user) {
      return {
        errors: [{ field: "token", message: "user no longer exists" }]
      }
    }

    user.password = await argon2.hash(newPassword);
    await em.persistAndFlush(user);

    await redis.del(key);

    // Log in user after resetting password.
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
