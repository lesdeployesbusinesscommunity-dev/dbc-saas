// Local Imports
import { useEffect, useRef } from 'react'

// Import Dependencies
import { useIsomorphicEffect } from './useIsomorphicEffect'
import { unRef } from 'utils/dom/unRef'

// ----------------------------------------------------------------------

export function useEventListener(
  eventName,
  handler,
  element,
  options,
) {
  // Create a ref that stores handler
  const savedHandler = useRef(handler)

  useIsomorphicEffect(() => {
    savedHandler.current = handler
  }, [handler])

  useEffect(() => {
    // Define the listening target
    const targetElement = unRef(element) ?? window

    if (!(targetElement && targetElement.addEventListener)) return

    // Create event listener that calls handler function stored in ref
    const listener = event => {
      savedHandler.current(event)
    }

    targetElement.addEventListener(eventName, listener, options)

    // Remove event listener on cleanup
    return () => {
      targetElement.removeEventListener(eventName, listener, options)
    }
  }, [eventName, element, options])
}
