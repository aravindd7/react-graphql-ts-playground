import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, Int, ObjectType } from "type-graphql";

@ObjectType()
@Entity()
export class User {
  // Id
  @Field(() => Int)  // GraphQL
  @PrimaryKey()      // MikroORM
  id!: number;       // TS

  // Username
  @Field(() => String)
  @Property({ type: "text", nullable: false, unique: true })
  username: string;

  // Password
  // @Field(() => String)  // Not showing in GraphQL
  @Property({ type: "text", nullable: false })
  password: string;
  
  // Email
  @Field(() => String)
  @Property({ type: "text", nullable: false, unique: true })
  email!: string;

  // Created At
  @Field(() => String)
  @Property({ type: "date" })
  createdAt: Date = new Date();

  // Update At
  @Field(() => String)
  @Property({ type: "date", onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
