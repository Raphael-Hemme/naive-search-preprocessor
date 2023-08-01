import { of, take, interval, tap, map, concatMap, switchMap } from 'rxjs'; 

const slowFn = (input) => {
  const randDelay = Math.floor(Math.random() * 3000)
  let result;
  setTimeout(() => {
    result = input.toUpperCase();
  }, randDelay);
  return result;
}

(() => {
  of('start').pipe(
    tap((val) => console.log(val)),
    map(() => ['a', 'b', 'c', 'd']),
    switchMap((arr) => {
      return interval(1000).pipe(
        tap((i) => console.log(arr[i])),
        take(arr.length),
        map((i) => slowFn(arr[i])),
      )
    }),
    tap((val) => console.log(val)),
  ).subscribe({
    // next: (v) => console.log('in sub', v),
    // error: (e) => console.log('error in sub', e),
    complete: () => console.log('completed')
  });
})()
