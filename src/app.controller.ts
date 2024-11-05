import { Controller, Get } from "@nestjs/common";

@Controller("/")
export class AppController {
  @Get()
  getRoot(): string {
    return "Api rodando!"; // Retorno simples como exemplo
  }
}
