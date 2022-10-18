import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { from, map, Observable } from 'rxjs';
import { CreatePersonDto } from '../dto/create-person.dto';
import { UpdatePersonDto } from '../dto/update-person.dto';
import { PersonEntity } from '../entities/person.entity';
import { Person } from '../schemas/person.schema';

@Injectable()
export class PeopleDao {
  /**
   * Class constructor
   *
   * @param {Model<Person>} _personModel instance of the model representing a Person
   */
  constructor(
    @InjectModel(Person.name)
    private readonly _personModel: Model<Person>,
  ) {}

  /**
   * Call mongoose method, call toJSON on each result and returns PersonModel[]
   *
   * @return {Observable<Person[]>}
   */
  find = (): Observable<Person[]> =>
    from(this._personModel.find({})).pipe(map((people) => [].concat(people)));

  /**
   * Returns one person of the list matching id in parameter
   *
   * @param {string} id of the person in the db
   *
   * @return {Observable<Person | void>}
   */
  findById = (id: string): Observable<Person | void> =>
    from(this._personModel.findById(id));

  /**
   * Check if person already exists with index and add it in people list
   *
   * @param {CreatePersonDto} person to create
   *
   * @return {Observable<Person>}
   */
  save = (person: CreatePersonDto): Observable<Person> =>
    from(new this._personModel(person).save());

  /**
   * Update a person in people list
   *
   * @param {string} id
   * @param {UpdatePersonDto} person
   *
   * @return {Observable<Person | void>}
   */
  findByIdAndUpdate = (
    id: string,
    person: UpdatePersonDto,
  ): Observable<Person | void> =>
    from(
      this._personModel.findByIdAndUpdate(id, person, {
        new: true,
        runValidators: true,
      }),
    );
}