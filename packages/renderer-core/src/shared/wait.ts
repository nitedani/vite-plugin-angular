import {
  firstValueFrom,
  from,
  isObservable,
  Observable,
  ObservableInput,
} from 'rxjs';

export const wait = <T, O extends Promise<T> | Observable<T>>(input: O) => {
  if (import.meta.env.SSR) {
    const i = setInterval(() => {});
    let promise: Promise<T>;
    if (isObservable(input)) {
      promise = firstValueFrom<T>(input);
    } else {
      promise = input;
    }
    promise.finally(() => clearInterval(i));
  }
  return input;
};

export const wait$ = <T, O extends ObservableInput<T>>(input: O) => {
  const obs = from(input);
  if (import.meta.env.SSR) {
    const i = setInterval(() => {});
    const promise = firstValueFrom<T>(obs);
    promise.finally(() => clearInterval(i));
  }
  return obs;
};
