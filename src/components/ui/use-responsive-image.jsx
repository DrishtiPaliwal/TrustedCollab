import * as React from "react"
import { useSize } from "../../hooks/use-size"
import { cn } from "../../lib/utils"
import { DEFAULT_TRANSFORM_WIDTH, getImagePreviewClassName } from "./image-helpers"

/**
 * @param {{ parsed: { baseUrl: string }, fittingType: string, focalPoint?: unknown, quality?: number, className?: string, onLoad?: (event: React.SyntheticEvent<HTMLImageElement>) => void, onSourceChange: (src: string, className: string) => void }} props
 * @param {React.Ref<HTMLImageElement | null>} parentRef
 */
export function useResponsiveImage({ parsed, fittingType, focalPoint, quality, className, onLoad, onSourceChange }, parentRef) {
  const wrapperRef = React.useRef(/** @type {HTMLDivElement | null} */ (null))
  const imgRef = React.useRef(/** @type {HTMLImageElement | null} */ (null))
  const size = useSize(wrapperRef)
  const [loaded, setLoaded] = React.useState(false)

  React.useImperativeHandle(parentRef, () => imgRef.current || null)
  React.useEffect(() => setLoaded(false), [parsed.baseUrl])
  React.useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    /** @param {Event} event */
    const replace = (event) => {
      const { src } = /** @type {CustomEvent<{src: string}>} */ (event).detail
      onSourceChange(src, getImagePreviewClassName(className, wrapper.className, cn("inline-block relative", className)))
    }
    wrapper.addEventListener("base44:image-replace", replace)
    return () => wrapper.removeEventListener("base44:image-replace", replace)
  }, [className, onSourceChange])

  const crop = fittingType !== "fit"
  // Wait for useSize's pre-paint measurement before requesting a transform.
  const options = size && {
    width: size.width || DEFAULT_TRANSFORM_WIDTH,
    height: size.height || undefined,
    crop,
    focalPoint: crop ? focalPoint : undefined,
    quality,
  }

  return {
    wrapperRef, imgRef, loaded, options,
    /** @param {React.SyntheticEvent<HTMLImageElement>} event */
    handleLoad: (event) => {
      setLoaded(true)
      onLoad?.(event)
    },
  }
}
