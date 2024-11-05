import { Book } from "src/modules/book/entities/book.entity";
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "tag" })
export class Tag {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 50 })
  name: string;

  @Column({ type: "int", default: 0 })
  usageCount: number;

  @ManyToMany(() => Book, (book) => book.tags)
  books: Book[];
}
