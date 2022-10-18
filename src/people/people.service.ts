import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { find, findIndex, from, Observable, of, throwError } from 'rxjs';
import {
  catchError,
  defaultIfEmpty,
  filter,
  map,
  mergeMap,
  tap,
} from 'rxjs/operators';
import { PEOPLE } from '../data/people';
import { Person } from './people.types';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { PersonEntity } from './entities/person.entity';
import { PeopleDao } from './dao/people.dao';

@Injectable()
export class PeopleService {
  // private property to store all people
  private _people: Person[];

  /**
   * Class constructor
   *
   * @param {PeopleDao} _peopleDao instance of the DAO
   */
  constructor(private readonly _peopleDao: PeopleDao) {
    this._people = [].concat(PEOPLE).map((person) => ({
      ...person,
      birthDate: this._parseDate(person.birthDate),
    }));
  }

  /**
   * Returns all existing people in the list
   *
   * @returns {Observable<PersonEntity[] | void>}
   */
  findAll = (): Observable<PersonEntity[] | void> =>
    this._peopleDao.find().pipe(
      filter(Boolean),
      map((people) => (people || []).map((person) => new PersonEntity(person))),
      defaultIfEmpty(undefined),
    );

  /**
   * Returns randomly one person of the list
   *
   * @returns {Observable<PersonEntity | void>}
   */
  findRandom = (): Observable<PersonEntity | void> =>
    this._peopleDao.find().pipe(
      filter((people) => !!people && !!people.length),
      map((people) => people[Math.round(Math.random() * people.length)]),
      map((people) => new PersonEntity(people)),
      defaultIfEmpty(undefined),
    );

  /**
   * Returns one person of the list matching id in parameter
   *
   * @param {string} id of the person
   *
   * @returns {Observable<PersonEntity>}
   */
  findOne = (id: string): Observable<PersonEntity> =>
    this._peopleDao.findById(id).pipe(
      catchError((e) =>
        throwError(() => new UnprocessableEntityException(e.message)),
      ),
      mergeMap((person) =>
        !!person
          ? of(new PersonEntity(person))
          : throwError(
              () => new NotFoundException(`People with id '${id}' not found`),
            ),
      ),
    );

  /**
   * Check if person already exists and add it in people list
   *
   * @param person to create
   *
   * @returns {Observable<PersonEntity>}
   */
  create = (person: CreatePersonDto): Observable<PersonEntity> =>
    this._prepareNewPerson(person).pipe(
      mergeMap((newPreparedPerson: CreatePersonDto) =>
        this._peopleDao.save(newPreparedPerson),
      ),
      catchError((e) =>
        e.code === 11000
          ? throwError(
              () =>
                new ConflictException(
                  `People with lastname '${person.lastname}' and firstname '${person.firstname}' already exists`,
                ),
            )
          : throwError(() => new UnprocessableEntityException(e.message)),
      ),
      map((personCreated) => new PersonEntity(personCreated)),
    );

  /**
   * Update a person in people list
   *
   * @param {string} id of the person to update
   * @param person data to update
   *
   * @returns {Observable<PersonEntity>}
   */
  update = (id: string, person: UpdatePersonDto): Observable<PersonEntity> =>
    this._peopleDao.findByIdAndUpdate(id, person).pipe(
      catchError((e) =>
        e.code === 11000
          ? throwError(
              () =>
                new ConflictException(
                  `People with lastname '${person.lastname}' and firstname '${person.firstname}' already exists`,
                ),
            )
          : throwError(() => new UnprocessableEntityException(e.message)),
      ),
      mergeMap((personUpdated) =>
        !!personUpdated
          ? of(new PersonEntity(personUpdated))
          : throwError(
              () => new NotFoundException(`People with id '${id}' not found`),
            ),
      ),
    );

  /**
   * Deletes one person in people list
   *
   * @param {string} id of the person to delete
   *
   * @returns {Observable<void>}
   */
  delete = (id: string): Observable<void> =>
    this._findPeopleIndexOfList(id).pipe(
      tap((existingPeople: number) => this._people.splice(existingPeople, 1)),
      map(() => undefined),
    );

  /**
   * Finds index of array for current person
   *
   * @param {string} id of the person to find
   *
   * @returns {Observable<number>}
   *
   * @private
   */
  private _findPeopleIndexOfList = (id: string): Observable<number> =>
    from(this._people).pipe(
      findIndex((person: Person) => person.id === id),
      mergeMap((index: number) =>
        index > -1
          ? of(index)
          : throwError(
              () => new NotFoundException(`People with id '${id}' not found`),
            ),
      ),
    );

  /**
   * Add person with good data in people list
   *
   * @param person to add
   *
   * @returns {Observable<Person>}
   *
   * @private
   */
  private _prepareNewPerson = (
    person: CreatePersonDto,
  ): Observable<CreatePersonDto> =>
    of({
      ...person,
      birthDate: this._parseDate('06/05/1985').toString(),
      photo: 'https://randomuser.me/api/portraits/lego/6.jpg',
    });

  /**
   * Function to parse date and return timestamp
   *
   * @param {string} date to parse
   *
   * @returns {number} timestamp
   *
   * @private
   */
  private _parseDate = (date: string): number => {
    const dates = date.split('/');
    return new Date(dates[2] + '/' + dates[1] + '/' + dates[0]).getTime();
  };
}