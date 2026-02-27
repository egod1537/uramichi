import { useMemo, useState } from 'react'

const BASE_HUES = [0, 20, 35, 50, 65, 85, 110, 140, 170, 195, 220, 250, 275, 305, 335]

const RAINBOW_COLORS = BASE_HUES.flatMap((hue) => [
  `hsl(${hue} 88% 52%)`,
  `hsl(${hue} 70% 68%)`,
])

const NEUTRAL_COLORS = ['#D4D4D8', '#A1A1AA', '#71717A', '#52525B', '#3F3F46', '#27272A', '#18181B', '#09090B']

const DEFAULT_OPACITY = 60
const DEFAULT_BORDER_WIDTH = 2

function ColorPalette({
  selectedColor,
  onSelectColor,
  opacity,
  onOpacityChange,
  borderWidth,
  onBorderWidthChange,
}) {
  const [internalSelectedColor, setInternalSelectedColor] = useState(RAINBOW_COLORS[0])
  const [internalOpacity, setInternalOpacity] = useState(DEFAULT_OPACITY)
  const [internalBorderWidth, setInternalBorderWidth] = useState(DEFAULT_BORDER_WIDTH)

  const activeColor = selectedColor ?? internalSelectedColor
  const activeOpacity = opacity ?? internalOpacity
  const activeBorderWidth = borderWidth ?? internalBorderWidth

  const colorRows = useMemo(
    () => [
      RAINBOW_COLORS.slice(0, RAINBOW_COLORS.length / 2),
      RAINBOW_COLORS.slice(RAINBOW_COLORS.length / 2),
      NEUTRAL_COLORS,
    ],
    [],
  )

  const handleColorSelect = (colorValue) => {
    if (!onSelectColor) {
      setInternalSelectedColor(colorValue)
      return
    }

    onSelectColor(colorValue)
  }

  const handleOpacityChange = (event) => {
    const nextOpacity = Number(event.target.value)

    if (!onOpacityChange) {
      setInternalOpacity(nextOpacity)
      return
    }

    onOpacityChange(nextOpacity)
  }

  const handleBorderWidthChange = (event) => {
    const nextBorderWidth = Number(event.target.value)

    if (!onBorderWidthChange) {
      setInternalBorderWidth(nextBorderWidth)
      return
    }

    onBorderWidthChange(nextBorderWidth)
  }

  return (
    <div className="w-[220px] rounded-md border border-slate-300 bg-white p-2 shadow-sm">
      <h2 className="text-sm font-medium text-slate-700">색상</h2>

      <div className="mt-2 space-y-1">
        {colorRows.map((colorRow, rowIndex) => (
          <div key={`palette-row-${rowIndex}`} className="flex flex-wrap gap-1">
            {colorRow.map((colorValue) => {
              const isActiveColor = activeColor === colorValue

              return (
                <button
                  key={colorValue}
                  type="button"
                  aria-label={`${colorValue} 선택`}
                  onClick={() => handleColorSelect(colorValue)}
                  className={`h-4 w-4 border ${
                    isActiveColor ? 'border-black ring-1 ring-black ring-offset-1' : 'border-white/50'
                  }`}
                  style={{ backgroundColor: colorValue }}
                />
              )
            })}
          </div>
        ))}
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium text-slate-700">투명도</p>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="100"
            value={activeOpacity}
            onChange={handleOpacityChange}
            className="w-full accent-slate-300"
          />
          <span className="w-8 text-right text-xs text-slate-500">{activeOpacity}</span>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-sm font-medium text-slate-700">테두리 두께</p>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="10"
            value={activeBorderWidth}
            onChange={handleBorderWidthChange}
            className="w-full accent-slate-300"
          />
          <span className="w-6 text-right text-xs text-slate-500">{activeBorderWidth}</span>
        </div>
      </div>
    </div>
  )
}

export default ColorPalette
