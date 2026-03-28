import React from 'react';
import {
  AccommodationIcon,
  AttractionIcon,
  ClockIcon,
  FoodIcon,
  NightIcon,
  PlusIcon,
  ShoppingIcon,
  TimelineIcon,
  TravelerIcon,
  TransportIcon,
} from '../../components/icons/WorkspaceIcons';
import { eventBus } from '../../services/EventBus';
import { planStore } from '../../services/PlanStore';
import { findActiveSegment } from '../../services/SimulationEngine';
import { resolveSimulationPosition } from '../../services/SimulationPosition';
import { formatClock } from '../../shared/utils/time';
import type { TimelineSliderProps, TimelineSliderState } from './TimelineSlider.types';
import TimeBlock from './TimeBlock';

function getCategoryIcon(categoryId: string) {
  switch (categoryId) {
    case '관광':
      return AttractionIcon;
    case '음식':
      return FoodIcon;
    case '쇼핑':
      return ShoppingIcon;
    case '숙소':
      return AccommodationIcon;
    case '교통':
      return TransportIcon;
    case '야간':
      return NightIcon;
    default:
      return TimelineIcon;
  }
}

class TimelineSlider extends React.Component<TimelineSliderProps, TimelineSliderState> {
  static defaultProps = {};

  private unsubscribe: (() => void) | null = null;

  constructor(props: TimelineSliderProps) {
    super(props);
    this.state = {
      snapshot: planStore.getSnapshot(),
      isActive: false,
    };
  }

  componentDidMount() {
    this.unsubscribe = planStore.subscribe(this.handleStoreChange);
  }

  componentWillUnmount() {
    this.unsubscribe?.();
  }

  private handleStoreChange = () => {
    this.setState({
      snapshot: planStore.getSnapshot(),
    });
  };

  private handleTimelineToggle = () => {
    this.setState((currentState) => ({
      isActive: !currentState.isActive,
    }));
  };

  private renderLegendPopup() {
    const { snapshot } = this.state;

    return (
      <aside className="workspace-legend-popup">
        <div className="workspace-legend-list">
          {snapshot.legendItems.map((item) => {
            const isActive = snapshot.activeCategoryIds.includes(item.id);
            const Icon = getCategoryIcon(item.id);
            const tooltipLabel = `${item.label} ${isActive ? '숨기기' : '보이기'}`;

            return (
              <button
                key={item.id}
                type="button"
                className={`workspace-legend-item ${isActive ? '' : 'workspace-legend-item--inactive'}`}
                aria-pressed={isActive}
                aria-label={tooltipLabel}
                data-tooltip={tooltipLabel}
                onClick={() => eventBus.emit('legend:toggle', { categoryId: item.id })}
              >
                <span
                  className="workspace-legend-icon"
                  style={{ color: item.color }}
                  aria-hidden="true"
                >
                  <Icon />
                </span>
              </button>
            );
          })}
        </div>
      </aside>
    );
  }

  private renderTimelinePopup() {
    const { snapshot, isActive } = this.state;
    const { currentDay } = snapshot;
    const activeSegment = findActiveSegment(currentDay, snapshot.currentMinutes);
    const simulationPosition = resolveSimulationPosition(currentDay, snapshot.currentMinutes);
    const activeSegmentLabel = activeSegment?.label ?? '자유 시간';
    const activeSegmentRange = activeSegment
      ? `${formatClock(activeSegment.start)} - ${formatClock(activeSegment.end)}`
      : null;
    const totalTimelineMinutes = Math.max(1, currentDay.timelineRange.end - currentDay.timelineRange.start);
    const currentProgressPercent =
      ((snapshot.currentMinutes - currentDay.timelineRange.start) /
        totalTimelineMinutes) *
      100;

    if (!isActive) {
      return (
        <div className="workspace-timeline-launcher-shell">
          <span className="workspace-timeline-launcher-icon" aria-hidden="true">
            <TravelerIcon />
          </span>
          <button
            type="button"
            className="workspace-timeline-launcher"
            onClick={this.handleTimelineToggle}
            aria-label="시뮬레이션 타임라인 열기"
            data-tooltip="시뮬레이션 타임라인 열기"
          >
            <PlusIcon />
          </button>
        </div>
      );
    }

    return (
      <section className="workspace-timeline-popup">
        <div className="workspace-timeline-popup-header">
          <div className="workspace-timeline-popup-status">
            <span className="workspace-timeline-popup-chip">
              <TimelineIcon />
            </span>
            <div className="workspace-timeline-current">
              <TravelerIcon />
              <ClockIcon />
              <span>{formatClock(snapshot.currentMinutes)}</span>
            </div>
            <span className="workspace-timeline-day-badge">{currentDay.label}</span>
          </div>

          <div className="workspace-timeline-popup-actions">
            <div className="workspace-timeline-popup-active">
              {simulationPosition ? (
                <span
                  className={`workspace-timeline-popup-traveler ${
                    simulationPosition.kind === 'route'
                      ? 'workspace-timeline-popup-traveler--route'
                      : ''
                  }`}
                  aria-hidden="true"
                >
                  <TravelerIcon />
                </span>
              ) : null}
              <span className="workspace-timeline-popup-active-label">{activeSegmentLabel}</span>
              {activeSegmentRange ? (
                <span className="workspace-timeline-popup-active-meta">
                  {activeSegmentRange}
                </span>
              ) : null}
            </div>

            <button
              type="button"
              className="workspace-timeline-popup-expand workspace-timeline-popup-expand--active"
              onClick={this.handleTimelineToggle}
              aria-label="시뮬레이션 타임라인 닫기"
              data-tooltip="시뮬레이션 타임라인 닫기"
            >
              <PlusIcon />
            </button>
          </div>
        </div>

        <section className="workspace-timeline workspace-timeline--expanded">
          <div className="workspace-timeline-header">
            <div className="workspace-timeline-range">
              <span>{formatClock(currentDay.timelineRange.start)}</span>
              <span className="workspace-timeline-range-divider" aria-hidden="true" />
              <span>{formatClock(currentDay.timelineRange.end)}</span>
            </div>
          </div>

          <div className="workspace-timeline-track">
            {currentDay.segments.map((segment) => (
              <TimeBlock key={segment.id} range={currentDay.timelineRange} segment={segment} />
            ))}
            <div
              className={`workspace-timeline-cursor ${
                simulationPosition?.kind === 'route' ? 'workspace-timeline-cursor--route' : ''
              }`}
              style={{ left: `${Math.min(100, Math.max(0, currentProgressPercent))}%` }}
            >
              <span className="workspace-timeline-cursor-icon">
                <TravelerIcon />
              </span>
            </div>
          </div>

          <input
            type="range"
            min={currentDay.timelineRange.start}
            max={currentDay.timelineRange.end}
            value={snapshot.currentMinutes}
            onChange={(event) =>
              eventBus.emit('timeline:seek', {
                minutes: Number(event.target.value),
              })
            }
            className="workspace-timeline-slider"
          />
        </section>
      </section>
    );
  }

  render() {
    return (
      <div className="workspace-bottom-overlays">
        {this.renderLegendPopup()}
        {this.renderTimelinePopup()}
      </div>
    );
  }
}

export default TimelineSlider;
