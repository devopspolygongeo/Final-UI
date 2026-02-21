import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'sort'
})
export class SortPipe implements PipeTransform {
    transform(ary: any, fn: Function = (a: string | number, b: string | number) => a > b ? 1 : -1): any {
        return ary.sort(fn)
    }
}