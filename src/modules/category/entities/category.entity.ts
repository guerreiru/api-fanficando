import { Book } from "src/modules/book/entities/book.entity";
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "category" })
export class Category {
  constructor(id: string = null) {
    this.id = id;
  }

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    name: "name",
    nullable: false,
    unique: true,
    type: "varchar",
    length: 20,
  })
  name: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @OneToMany(() => Book, (book) => book.category)
  books: Book[];
}
