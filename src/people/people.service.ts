import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { find, findIndex, from, Observable, of, throwError } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { PEOPLE } from '../data/people';
import { Person } from './people.types';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';

@Injectable()
export class PeopleService {
  // private property to store all people
  private _people: Person[];

  /**
   * Class constructor
   */
  constructor() {
    this._people = [].concat(PEOPLE).map((person) => ({
      ...person,
      birthDate: this._parseDate(person.birthDate),
    }));
  }

  /**
   * Returns all existing people in the list
   *
   * @returns {Observable<Person[] | void>}
   */
  findAll = (): Observable<Person[] | void> =>
    of(this._people).pipe(
      map((people: Person[]) =>
        !!people && !!people.length ? people : undefined,
      ),
    );

  findAllWithoutArrowAndObs(): Person[] | void {
    return !!this._people && !!this._people.length ? this._people : undefined;
  }

  /**
   * Returns randomly one person of the list
   *
   * @returns {Observable<Person | void>}
   */
  findRandom = (): Observable<Person | void> =>
    of(this._people[Math.round(Math.random() * this._people.length)]).pipe(
      map((person: Person) => (!!person ? person : undefined)),
    );

  findRandomWithoutArrowAndObs(): Person | void {
    const randomPerson =
      this._people[Math.round(Math.random() * this._people.length)];
    return !!randomPerson ? randomPerson : undefined;
  }

  /**
   * Returns one person of the list matching id in parameter
   *
   * @param {string} id of the person
   *
   * @returns {Observable<Person>}
   */
  findOne = (id: string): Observable<Person> =>
    from(this._people).pipe(
      find((person: Person) => person.id === id),
      mergeMap((person: Person) =>
        !!person
          ? of(person)
          : throwError(
              () => new NotFoundException(`People with id '${id}' not found`),
            ),
      ),
    );

  findOneWithoutArrowAndObs(id: string): Person {
    const person = this._people.find((person) => person.id === id);
    if (!person) {
      throw new NotFoundException(`People with id '${id}' not found`);
    }

    return person;
  }

  /**
   * Check if person already exists and add it in people list
   *
   * @param person to create
   *
   * @returns {Observable<Person>}
   */
  create = (person: CreatePersonDto): Observable<Person> =>
    from(this._people).pipe(
      find(
        (personFound: Person) =>
          personFound.lastname.toLowerCase() ===
            person.lastname.toLowerCase() &&
          personFound.firstname.toLowerCase() ===
            person.firstname.toLowerCase(),
      ),
      mergeMap((personFound: Person) =>
        !!personFound
          ? throwError(
              () =>
                new ConflictException(
                  `People with lastname '${person.lastname}' and firstname '${person.firstname}' already exists`,
                ),
            )
          : this._addPerson(person),
      ),
    );

  createWithoutArrowAndObs(person: CreatePersonDto): Person {
    const personAlreadyExists = this._people.find(
      (personFound) =>
        personFound.lastname.toLowerCase() === person.lastname.toLowerCase() &&
        personFound.firstname.toLowerCase() === person.firstname.toLowerCase(),
    );

    if (!!personAlreadyExists) {
      throw new ConflictException(
        `People with lastname '${person.lastname}' and firstname '${person.firstname}' already exists`,
      );
    }
    return this._addPersonWithoutArrowAndObs(person);
  }
  /**
   * Update a person in people list
   *
   * @param {string} id of the person to update
   * @param person data to update
   *
   * @returns {Observable<Person>}
   */
  update = (id: string, person: UpdatePersonDto): Observable<Person> =>
    from(this._people).pipe(
      find(
        (existingPerson: Person) =>
          existingPerson.lastname.toLowerCase() ===
            person.lastname.toLowerCase() &&
          existingPerson.firstname.toLowerCase() ===
            person.firstname.toLowerCase() &&
          existingPerson.id.toLowerCase() !== id.toLowerCase(),
      ),
      mergeMap((matchingPerson: Person) =>
        !!matchingPerson
          ? throwError(
              () =>
                new ConflictException(
                  `People with lastname '${person.lastname}' and firstname '${person.firstname}' already exists`,
                ),
            )
          : this._findPeopleIndexOfList(id),
      ),
      tap((index: number) => Object.assign(this._people[index], person)),
      map((index: number) => this._people[index]),
    );

  updateWithoutArrowAndObs(id: string, person: UpdatePersonDto): Person {
    const matchingPerson = this._people.find(
      (existingPerson) =>
        existingPerson.lastname.toLowerCase() ===
          person.lastname.toLowerCase() &&
        existingPerson.firstname.toLowerCase() ===
          person.firstname.toLowerCase() &&
        existingPerson.id.toLowerCase() !== id.toLowerCase(),
    );
    if (!!matchingPerson) {
      throw new ConflictException(
        `People with lastname '${person.lastname}' and firstname '${person.firstname}' already exists`,
      );
    }
    const indexToUpdate = this._findPeopleIndexOfListWithoutArrowAndObs(id);
    Object.assign(this._people[indexToUpdate], person);

    return this._people[indexToUpdate];
  }

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

  private _findPeopleIndexOfListWithoutArrowAndObs(id: string): number {
    const index = this._people.findIndex((person) => person.id === id);
    if (index <= -1) {
      throw new NotFoundException(`People with id '${id}' not found`);
    }
    return index;
  }

  /**
   * Add person with good data in people list
   *
   * @param person to add
   *
   * @returns {Observable<Person>}
   *
   * @private
   */
  private _addPerson = (person: CreatePersonDto): Observable<Person> =>
    of({
      ...person,
      id: this._createId(),
      birthDate: this._parseDate('06/05/1985').toString(),
      photo: 'https://randomuser.me/api/portraits/lego/6.jpg',
    } as Partial<Person>).pipe(
      tap(
        (createdPerson: Person) =>
          (this._people = this._people.concat(createdPerson)),
      ),
    );

  _addPersonWithoutArrowAndObs(person: CreatePersonDto): Person {
    const personToAdd: Person = {
      ...person,
      id: this._createId(),
      birthDate: this._parseDate('06/05/1985').toString(),
      photo: 'https://randomuser.me/api/portraits/lego/6.jpg',
    };

    this._people = this._people.concat(personToAdd);

    return personToAdd;
  }

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

  /**
   * Creates a new id
   *
   * @returns {string}
   *
   * @private
   */
  private _createId = (): string => `${new Date().getTime()}`;
}
