import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Field, Int, ObjectType } from "type-graphql";
import { Post } from "./Post";

@ObjectType()
@Entity()
export class User extends BaseEntity {
  // Id
  @Field(() => Int) // GraphQL
  @PrimaryGeneratedColumn() // MikroORM
  id!: number; // TS

  // Username
  @Field(() => String)
  @Column({ type: "text", nullable: false, unique: true })
  username: string;

  // Password
  // @Field(() => String)  // Not showing in GraphQL
  @Column({ type: "text", nullable: false })
  password: string;

  // Email
  @Field(() => String)
  @Column({ type: "text", nullable: false, unique: true })
  email!: string;

  @OneToMany(() => Post, post => post.creator)
  posts: Post[];
  
  // Created At
  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  // Update At
  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date = new Date();
}
