import { of, take, interval, tap, map, concatMap, switchMap } from 'rxjs'; 

const slowFn = async (input) => {
  const randDelay = Math.floor(Math.random() * 3000)
  await new Promise(resolve => setTimeout(resolve, randDelay));
  return input.toUpperCase();
}

(() => {
  of('start').pipe(
    tap((val) => console.log(val)),
    map(() => ['a', 'b', 'c', 'd']),
    switchMap((arr) => {
      return interval(1000).pipe(
        tap((i) => console.log(arr[i])),
        take(arr.length),
        concatMap((i) => slowFn(arr[i])),
      )
    }),
    tap((val) => console.log(val)),
  ).subscribe({
    // next: (v) => console.log('in sub', v),
    // error: (e) => console.log('error in sub', e),
    complete: () => console.log('completed')
  });
})()
