import {
  Field,
  InputType
} from "type-graphql";

// This is another way to declare GraphQL types, instead of using multiple
// @Arg() statements in our functions.

@InputType()
export class UsernamePasswordInput {
  @Field()
  username: string;

  @Field()
  email: string;

  @Field()
  password: string;
}
