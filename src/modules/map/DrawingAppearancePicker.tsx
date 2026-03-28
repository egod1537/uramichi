import React from 'react';
import type { MapDrawing } from '../../models/Route';
import { eventBus } from '../../services/EventBus';
import { getPoiColorOptions } from '../../shared/constants/categories';
import {
  getDrawingIconOptions,
  getDrawingIconVisual,
} from '../../shared/constants/drawingIcons';

interface DrawingAppearancePickerProps {
  drawing: MapDrawing;
}

interface DrawingAppearancePickerState {
  isOpen: boolean;
}

class DrawingAppearancePicker extends React.Component<
  DrawingAppearancePickerProps,
  DrawingAppearancePickerState
> {
  static defaultProps = {};

  private rootRef = React.createRef<HTMLDivElement>();

  constructor(props: DrawingAppearancePickerProps) {
    super(props);
    this.state = {
      isOpen: false,
    };
  }

  componentDidMount() {
    document.addEventListener('pointerdown', this.handleDocumentPointerDown);
    document.addEventListener('keydown', this.handleDocumentKeyDown);
  }

  componentDidUpdate(prevProps: DrawingAppearancePickerProps) {
    if (prevProps.drawing.id === this.props.drawing.id || !this.state.isOpen) {
      return;
    }

    this.setState({
      isOpen: false,
    });
  }

  componentWillUnmount() {
    document.removeEventListener('pointerdown', this.handleDocumentPointerDown);
    document.removeEventListener('keydown', this.handleDocumentKeyDown);
  }

  private handleDocumentPointerDown = (event: PointerEvent) => {
    if (!this.state.isOpen) {
      return;
    }

    if (!(event.target instanceof Node)) {
      return;
    }

    if (this.rootRef.current?.contains(event.target)) {
      return;
    }

    this.setState({
      isOpen: false,
    });
  };

  private handleDocumentKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !this.state.isOpen) {
      return;
    }

    this.setState({
      isOpen: false,
    });
  };

  private handleToggle = () => {
    this.setState((prevState) => ({
      isOpen: !prevState.isOpen,
    }));
  };

  private handleColorSelect = (color: string) => {
    eventBus.emit('drawing:color-change', {
      color,
      drawingId: this.props.drawing.id,
    });
  };

  private handleIconSelect = (iconId: MapDrawing['iconId']) => {
    eventBus.emit('drawing:icon-change', {
      drawingId: this.props.drawing.id,
      iconId,
    });
  };

  private renderPopover() {
    const { drawing } = this.props;
    const colorOptions = getPoiColorOptions();
    const iconOptions = getDrawingIconOptions();

    return (
      <div className="workspace-poi-popup-appearance-popover">
        <div className="workspace-poi-popup-appearance-section">
          <span className="workspace-poi-popup-appearance-heading">색상</span>
          <div className="workspace-poi-popup-color-list">
            {colorOptions.map((color) => {
              const isActive = color === drawing.strokeColor;

              return (
                <button
                  key={color}
                  type="button"
                  className={`workspace-poi-popup-color-choice ${
                    isActive ? 'workspace-poi-popup-color-choice--active' : ''
                  }`}
                  aria-label={`${color} 색상으로 변경`}
                  aria-pressed={isActive}
                  onClick={() => this.handleColorSelect(color)}
                >
                  <span
                    className="workspace-poi-popup-color-choice-swatch"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div className="workspace-poi-popup-appearance-section">
          <span className="workspace-poi-popup-appearance-heading">아이콘</span>
          <div className="workspace-poi-popup-icon-picker-list">
            {iconOptions.map((option) => {
              const OptionIcon = option.Icon;
              const isActive = option.id === drawing.iconId;

              return (
                <button
                  key={option.id}
                  type="button"
                  className={`workspace-poi-popup-icon-choice ${
                    isActive ? 'workspace-poi-popup-icon-choice--active' : ''
                  }`}
                  aria-label={`${option.label} 아이콘으로 변경`}
                  aria-pressed={isActive}
                  onClick={() => this.handleIconSelect(option.id)}
                >
                  <span
                    className="workspace-poi-popup-icon-choice-swatch"
                    style={{ color: option.color }}
                    aria-hidden="true"
                  >
                    <OptionIcon />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { drawing } = this.props;
    const { isOpen } = this.state;
    const CurrentIcon = getDrawingIconVisual(drawing.iconId).Icon;

    return (
      <div ref={this.rootRef} className="workspace-poi-popup-appearance">
        <button
          type="button"
          className={`workspace-poi-popup-appearance-trigger ${
            isOpen ? 'workspace-poi-popup-appearance-trigger--active' : ''
          }`}
          aria-label="경로 아이콘과 색상 변경"
          aria-expanded={isOpen}
          onClick={this.handleToggle}
        >
          <span
            className="workspace-poi-popup-appearance-preview"
            style={{ backgroundColor: drawing.strokeColor }}
            aria-hidden="true"
          >
            <CurrentIcon />
          </span>
        </button>

        {isOpen ? this.renderPopover() : null}
      </div>
    );
  }
}

export default DrawingAppearancePicker;
