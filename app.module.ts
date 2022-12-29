import { Module, Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello() {
    return {
      success: true,
    };
  }
}

@Module({
  imports: [],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
