import { Book } from "src/modules/book/entities/book.entity";
import { Comment } from "src/modules/comment/entities/comment.entity";
import { Review } from "src/modules/review/entities/review.entity";
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "user" })
export class User {
  constructor(id: string = null) {
    this.id = id;
  }

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "name", nullable: false, type: "varchar", length: 120 })
  name: string;

  @Column({
    name: "user_name",
    nullable: false,
    unique: true,
    type: "varchar",
    length: 50,
  })
  userName: string;

  @Column({
    name: "email",
    nullable: false,
    unique: true,
    type: "varchar",
    length: 50,
  })
  email: string;

  @Column({ name: "password", nullable: false, type: "varchar", length: 255 })
  password: string;

  @Column({ name: "birth_date", nullable: false })
  birthDate: Date;

  @Column({ name: "profile_img_url", nullable: true })
  profileImgUrl: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @OneToMany(() => Book, (book) => book.user)
  books: Book[];

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  @OneToMany(() => Comment, (comments) => comments.user)
  comments: Comment[];
}
