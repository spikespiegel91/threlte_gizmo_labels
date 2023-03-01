import { getContext, setContext } from 'svelte'

type Tuple<T = any> = [T] | T[]

type Keys = Tuple<any>

type CacheItem = {
  // The promise that is being cached
  promise: Promise<any>
  // The cache keys
  keys: Keys
  // The awaited return value of the promise
  value?: any
  // The error that was potentially thrown
  error?: any
}

type Cache = CacheItem[]

export const shallowEqualArrays = (arrA: any[], arrB: any[]) => {
  if (arrA === arrB) return true
  if (!arrA || !arrB) return false
  const len = arrA.length
  if (arrB.length !== len) return false
  for (let i = 0; i < len; i++) if (arrA[i] !== arrB[i]) return false
  return true
}

export const createCache = () => {
  setContext<Cache>('threlte-cache', [])
}

export const useCache = () => {
  const cache = getContext<Cache>('threlte-cache')

  const remember = <T>(callback: () => Promise<T>, keys: Keys): Promise<T> => {
    for (const entry of cache) {
      // Find a match
      if (shallowEqualArrays(keys, entry.keys)) {
        // If an error occurred, throw
        if (entry.error) throw entry.error
        // If a response was successful, return
        if (entry.value) return entry.value
        // If a response is pending, return
        if (entry.promise) return entry.promise as Promise<T>
      }
    }

    // If no match was found, create a new entry
    const entry: CacheItem = {
      promise: callback(),
      keys,
      value: undefined
    }

    // Add the entry to the cache
    cache.push(entry)

    // Add a then and catch handler to the promise
    entry.promise
      .then((value) => {
        // store the value
        entry.value = value
      })
      .catch((error) => {
        // store the error
        entry.error = error
        throw error
      })

    // Return the promise
    return entry.promise
  }

  const clear = (keys: Keys) => {
    const index = cache.findIndex((entry) => shallowEqualArrays(keys, entry.keys))
    if (index !== -1) {
      cache.splice(index, 1)
    }
  }

  return {
    remember,
    clear
  }
}
