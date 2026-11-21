import { useEffect, useState } from 'react'
import { DEFAULT_MAP_FILTERS, type MapFilters } from './graph'

const KEY = 'studyblocks.mapFilters'

function load(): MapFilters {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<MapFilters> | null
    if (!saved) return DEFAULT_MAP_FILTERS
    return {
      hiddenCourses: Array.isArray(saved.hiddenCourses) ? saved.hiddenCourses.filter((x) => typeof x === 'string') : [],
      hideFinished: typeof saved.hideFinished === 'boolean' ? saved.hideFinished : DEFAULT_MAP_FILTERS.hideFinished,
      showClasses: typeof saved.showClasses === 'boolean' ? saved.showClasses : DEFAULT_MAP_FILTERS.showClasses,
    }
  } catch {
    return DEFAULT_MAP_FILTERS
  }
}

/** Map filters, remembered in this browser (a convenience, so localStorage is fine). */
export function useMapFilters(): [MapFilters, (f: MapFilters) => void] {
  const [filters, setFilters] = useState(load)
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(filters))
    } catch {
      // Storage can be blocked; filters just won't be remembered.
    }
  }, [filters])
  return [filters, setFilters]
}
