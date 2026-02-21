import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'mapValue'
})
export class MapValuePipe implements PipeTransform {
  transform<K, V>(input: Map<K, V>, key: K, defaultValue?: V): Readonly<V | undefined> {
    return input.has(key) ? input.get(key) : defaultValue;
  }
}