import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HelloModule } from './hello/hello.module';
import { PeopleModule } from './people/people.module';
import * as Config from 'config';

@Module({
  imports: [
    HelloModule,
    PeopleModule,
    MongooseModule.forRoot(Config.get<string>('mongodb.uri')),
  ],
})
export class AppModule {}
