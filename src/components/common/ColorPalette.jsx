import React from 'react';

const BASE_HUES = [0, 20, 35, 50, 65, 85, 110, 140, 170, 195, 220, 250, 275, 305, 335];

const RAINBOW_COLORS = BASE_HUES.flatMap((hue) => [`hsl(${hue} 88% 52%)`, `hsl(${hue} 70% 68%)`]);

const NEUTRAL_COLORS = [
  '#D4D4D8',
  '#A1A1AA',
  '#71717A',
  '#52525B',
  '#3F3F46',
  '#27272A',
  '#18181B',
  '#09090B',
];

const DEFAULT_OPACITY = 60;
const DEFAULT_BORDER_WIDTH = 2;

class ColorPalette extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      internalSelectedColor: RAINBOW_COLORS[0],
      internalOpacity: DEFAULT_OPACITY,
      internalBorderWidth: DEFAULT_BORDER_WIDTH,
    };
  }

  handleColorSelect = (colorValue) => {
    const { onSelectColor } = this.props;
    if (!onSelectColor) {
      this.setState({ internalSelectedColor: colorValue });
      return;
    }

    onSelectColor(colorValue);
  };

  handleOpacityChange = (event) => {
    const { onOpacityChange } = this.props;
    const nextOpacity = Number(event.target.value);

    if (!onOpacityChange) {
      this.setState({ internalOpacity: nextOpacity });
      return;
    }

    onOpacityChange(nextOpacity);
  };

  handleBorderWidthChange = (event) => {
    const { onBorderWidthChange } = this.props;
    const nextBorderWidth = Number(event.target.value);

    if (!onBorderWidthChange) {
      this.setState({ internalBorderWidth: nextBorderWidth });
      return;
    }

    onBorderWidthChange(nextBorderWidth);
  };

  render() {
    const { selectedColor, opacity, borderWidth } = this.props;
    const { internalSelectedColor, internalOpacity, internalBorderWidth } = this.state;

    const activeColor = selectedColor ?? internalSelectedColor;
    const activeOpacity = opacity ?? internalOpacity;
    const activeBorderWidth = borderWidth ?? internalBorderWidth;

    const colorRows = [
      RAINBOW_COLORS.slice(0, RAINBOW_COLORS.length / 2),
      RAINBOW_COLORS.slice(RAINBOW_COLORS.length / 2),
      NEUTRAL_COLORS,
    ];

    return (
      <div className="w-[220px] rounded-md border border-slate-300 bg-white p-2 shadow-sm">
        <h2 className="text-sm font-medium text-slate-700">색상</h2>

        <div className="mt-2 space-y-1">
          {colorRows.map((colorRow, rowIndex) => (
            <div key={`palette-row-${rowIndex}`} className="flex flex-wrap gap-1">
              {colorRow.map((colorValue) => {
                const isActiveColor = activeColor === colorValue;

                return (
                  <button
                    key={colorValue}
                    type="button"
                    aria-label={`${colorValue} 선택`}
                    onClick={() => this.handleColorSelect(colorValue)}
                    className={`h-4 w-4 border ${
                      isActiveColor
                        ? 'border-black ring-1 ring-black ring-offset-1'
                        : 'border-white/50'
                    }`}
                    style={{ backgroundColor: colorValue }}
                  />
                );
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
              onChange={this.handleOpacityChange}
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
              onChange={this.handleBorderWidthChange}
              className="w-full accent-slate-300"
            />
            <span className="w-6 text-right text-xs text-slate-500">{activeBorderWidth}</span>
          </div>
        </div>
      </div>
    );
  }
}

export default ColorPalette;
