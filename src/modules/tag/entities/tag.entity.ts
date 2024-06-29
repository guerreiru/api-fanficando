import { Book } from "src/modules/book/entities/book.entity";
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "tag" })
export class Tag {
  constructor(name: string = null) {
    this.id = name;
  }

  @PrimaryGeneratedColumn()
  id: string;

  @Column({ type: "varchar", length: 50 })
  name: string;

  @ManyToMany(() => Book, (book) => book.tags)
  books: Book[];
}
