import * as React from "react"
import { cn } from "../../lib/utils"
import { buildSrcSet, buildTransformUrl, splitImageProps } from "./image-helpers"
import { useResponsiveImage } from "./use-responsive-image"

/**
 * @typedef {Object} ResponsiveImageProps
 * @property {string} [src]
 * @property {any} [parsed]
 * @property {"fit" | "cover" | string} [fittingType]
 * @property {any} [focalPoint]
 * @property {number} [quality]
 * @property {string} [className]
 * @property {Object} [style]
 * @property {number | string} [aspectRatio]
 * @property {() => void} [onLoad]
 * @property {(value?: any) => void} [onSourceChange]
 */

/**
 * @typedef {Object} ResponsiveImageOptions
 * @property {number} width
 * @property {number} [height]
 * @property {boolean} [crop]
 * @property {{ x: number, y: number }} [focalPoint]
 * @property {number} [quality]
 */

/**
 * @type {import("react").ForwardRefExoticComponent<React.PropsWithoutRef<ResponsiveImageProps> & React.RefAttributes<any>>}
 */
export const ResponsiveImage = React.forwardRef(
  /**
   * @param {ResponsiveImageProps & Record<string, any>} props
   * @param {React.ForwardedRef<any>} ref
   */
  ({ src = "", parsed, fittingType = "cover", focalPoint, quality, className = "", style, aspectRatio, onLoad, onSourceChange, ...props }, ref) => {
    /** @type {{ wrapperRef: any, imgRef: any, loaded: boolean, options: { width: number, height?: number, crop?: boolean, focalPoint?: unknown, quality?: number } | null, handleLoad: (event?: any) => void }} */
    const { wrapperRef, imgRef, loaded, options, handleLoad } = useResponsiveImage(
      {
        parsed,
        fittingType,
        focalPoint,
        quality,
        className,
        onLoad,
        onSourceChange: typeof onSourceChange === "function" ? onSourceChange : () => {},
      },
      ref
    )
    const imageOptions = /** @type {{ width: number, height?: number, crop?: boolean, focalPoint?: { x: number, y: number }, quality: number } | null} */ (
      /** @type {unknown} */ (options)
    )
    const { wrapperProps, imageProps } = splitImageProps(props)

    return (
      <span
        ref={wrapperRef}
        className={cn("inline-block relative", className)}
        style={{ aspectRatio, ...style }}
        {...wrapperProps}
        data-base44-image=""
        data-base44-image-src={src}
      >
        {/* Contain both image layers inside the padded content box without adding an edit target. */}
        <span data-source-location={undefined} className="block relative w-full h-full overflow-hidden">
          {imageOptions && !loaded && (
            <img
              data-source-location={undefined}
              src={buildTransformUrl(parsed, {
                width: 20,
                height: imageOptions.height
                  ? Math.max(1, Math.round((20 * imageOptions.height) / (imageOptions.width || 1)))
                  : undefined,
                crop: imageOptions.crop,
                focalPoint: imageOptions.focalPoint,
                quality: 20,
              })}
              alt=""
              aria-hidden="true"
              className="w-full h-full inset-0 absolute"
              style={{
                objectFit: fittingType === "fit" ? "contain" : "cover",
                filter: "blur(10px)",
                transform: "scale(1.1)",
              }}
            />
          )}
          {imageOptions && (
            <img
              data-source-location={undefined}
              ref={imgRef}
              src={buildTransformUrl(parsed, imageOptions)}
              srcSet={buildSrcSet(parsed, imageOptions)}
              loading="lazy"
              className={cn(
                "w-full h-full inset-0 absolute",
                fittingType === "fit" ? "object-contain" : "object-cover"
              )}
              onLoad={handleLoad}
              {...imageProps}
            />
          )}
        </span>
      </span>
    )
  }
)
ResponsiveImage.displayName = "ResponsiveImage"
