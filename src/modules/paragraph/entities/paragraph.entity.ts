import { Chapter } from "src/modules/chapter/entities/chapter.entity";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity({ name: "paragraph" })
export class Paragraph {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("varchar", { length: 200 })
  content: string;

  @ManyToOne(() => Chapter, (chapter) => chapter.paragraphs)
  @JoinColumn({ name: "chapter_id" })
  chapter: Chapter;
}
