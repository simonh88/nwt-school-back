import { Injectable, NotFoundException } from '@nestjs/common';
import { find, from, Observable, of, throwError } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { PEOPLE } from '../data/people';
import { Person } from './people.types';

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
