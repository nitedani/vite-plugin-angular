import { defer, from, ObservableInput, tap } from 'rxjs';

/** Delays the server-side render until the input resolves. */
export const wait = <T, O extends Promise<T>>(input: O) => {
  if (import.meta.env.SSR) {
    const i = setTimeout(() => {}, 10000);
    input.finally(() => clearTimeout(i));
  } else {
    return input;
  }
};

/** Delays the server-side render until the input resolves. */
export const wait$ = <T, O extends ObservableInput<T>>(input: O) => {
  const obs = from(input);
  if (import.meta.env.SSR) {
    const i = setTimeout(() => {}, 10000);
    return defer(() => obs.pipe(tap(() => clearTimeout(i))));
  } else {
    return obs;
  }
};
