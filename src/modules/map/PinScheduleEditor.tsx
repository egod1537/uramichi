import React from 'react';
import type { Poi } from '../../models/Poi';
import { eventBus } from '../../services/EventBus';
import {
  areTimeRangeDraftsEqual,
  createBusinessHoursDraft,
  createVisitTimeDraft,
  formatTimeRangeSummary,
  hasConfiguredTimeRangeValue,
  serializeBusinessHours,
  serializeVisitTime,
  type TimeRangeDraft,
  updateTimeRangeEnd,
  updateTimeRangeStart,
} from './pinScheduleTime';
import PinSchedulePopover from './PinSchedulePopover';
import PinScheduleSummary from './PinScheduleSummary';

interface PinScheduleEditorProps {
  place: Poi;
}

interface PinScheduleEditorState {
  businessHoursEnabled: boolean;
  businessHoursRange: TimeRangeDraft;
  isOpen: boolean;
  visitTimeEnabled: boolean;
  visitTimeRange: TimeRangeDraft;
}

function createStateFromPlace(place: Poi): Omit<PinScheduleEditorState, 'isOpen'> {
  const businessHours = place.businessHours ?? '';
  const visitTime = place.visitTime ?? '';

  return {
    businessHoursEnabled: hasConfiguredTimeRangeValue(businessHours),
    businessHoursRange: createBusinessHoursDraft(businessHours),
    visitTimeEnabled: hasConfiguredTimeRangeValue(visitTime),
    visitTimeRange: createVisitTimeDraft(visitTime),
  };
}

class PinScheduleEditor extends React.Component<PinScheduleEditorProps, PinScheduleEditorState> {
  static defaultProps = {};

  private rootRef = React.createRef<HTMLDivElement>();

  constructor(props: PinScheduleEditorProps) {
    super(props);

    this.state = {
      ...createStateFromPlace(props.place),
      isOpen: false,
    };
  }

  componentDidMount() {
    document.addEventListener('pointerdown', this.handleDocumentPointerDown);
    document.addEventListener('keydown', this.handleDocumentKeyDown);
  }

  componentDidUpdate(prevProps: PinScheduleEditorProps) {
    if (
      prevProps.place.id === this.props.place.id &&
      (prevProps.place.businessHours ?? '') === (this.props.place.businessHours ?? '') &&
      (prevProps.place.visitTime ?? '') === (this.props.place.visitTime ?? '')
    ) {
      return;
    }

    this.setState({
      ...createStateFromPlace(this.props.place),
      isOpen: prevProps.place.id === this.props.place.id ? this.state.isOpen : false,
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

    if (!(event.target instanceof Node) || this.rootRef.current?.contains(event.target)) {
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
    this.setState((currentState) => ({
      isOpen: !currentState.isOpen,
    }));
  };

  private handleClose = () => {
    this.setState({
      isOpen: false,
    });
  };

  private handleBusinessHoursStartChange = (minutes: number) => {
    this.setState((currentState) => ({
      businessHoursEnabled: true,
      businessHoursRange: updateTimeRangeStart(currentState.businessHoursRange, minutes),
    }));
  };

  private handleBusinessHoursEndChange = (minutes: number) => {
    this.setState((currentState) => ({
      businessHoursEnabled: true,
      businessHoursRange: updateTimeRangeEnd(currentState.businessHoursRange, minutes),
    }));
  };

  private handleVisitTimeStartChange = (minutes: number) => {
    this.setState((currentState) => ({
      visitTimeEnabled: true,
      visitTimeRange: updateTimeRangeStart(currentState.visitTimeRange, minutes),
    }));
  };

  private handleVisitTimeEndChange = (minutes: number) => {
    this.setState((currentState) => ({
      visitTimeEnabled: true,
      visitTimeRange: updateTimeRangeEnd(currentState.visitTimeRange, minutes),
    }));
  };

  private handleEnableBusinessHours = () => {
    this.setState({
      businessHoursEnabled: true,
    });
  };

  private handleEnableVisitTime = () => {
    this.setState({
      visitTimeEnabled: true,
    });
  };

  private handleClearBusinessHours = () => {
    this.setState({
      businessHoursEnabled: false,
    });
  };

  private handleClearVisitTime = () => {
    this.setState({
      visitTimeEnabled: false,
    });
  };

  private handleReset = () => {
    this.setState({
      ...createStateFromPlace(this.props.place),
      isOpen: this.state.isOpen,
    });
  };

  private handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!this.hasChanges()) {
      this.handleClose();
      return;
    }

    eventBus.emit('poi:update', {
      placeId: this.props.place.id,
      changes: {
        businessHours: this.state.businessHoursEnabled
          ? serializeBusinessHours(this.state.businessHoursRange)
          : '',
        visitTime: this.state.visitTimeEnabled
          ? serializeVisitTime(this.state.visitTimeRange)
          : '',
      },
    });

    this.handleClose();
  };

  private hasChanges(): boolean {
    const initialState = createStateFromPlace(this.props.place);

    return (
      this.state.businessHoursEnabled !== initialState.businessHoursEnabled ||
      this.state.visitTimeEnabled !== initialState.visitTimeEnabled ||
      !areTimeRangeDraftsEqual(this.state.businessHoursRange, initialState.businessHoursRange) ||
      !areTimeRangeDraftsEqual(this.state.visitTimeRange, initialState.visitTimeRange)
    );
  }

  render() {
    const { isOpen } = this.state;
    const summaryItems: string[] = [];

    if (this.state.businessHoursEnabled) {
      summaryItems.push(`영업 ${formatTimeRangeSummary(this.state.businessHoursRange, '항시 운영')}`);
    }

    if (this.state.visitTimeEnabled) {
      summaryItems.push(`방문 ${formatTimeRangeSummary(this.state.visitTimeRange)}`);
    }

    return (
      <div ref={this.rootRef} className="workspace-poi-popup-schedule-anchor">
        <PinScheduleSummary isOpen={isOpen} onToggle={this.handleToggle} summaryItems={summaryItems} />
        {isOpen ? (
          <PinSchedulePopover
            businessHoursEnabled={this.state.businessHoursEnabled}
            businessHoursRange={this.state.businessHoursRange}
            hasChanges={this.hasChanges()}
            onBusinessHoursAdd={this.handleEnableBusinessHours}
            onBusinessHoursClear={this.handleClearBusinessHours}
            onBusinessHoursEndChange={this.handleBusinessHoursEndChange}
            onBusinessHoursStartChange={this.handleBusinessHoursStartChange}
            onClose={this.handleClose}
            onReset={this.handleReset}
            onSubmit={this.handleSubmit}
            onVisitTimeAdd={this.handleEnableVisitTime}
            onVisitTimeClear={this.handleClearVisitTime}
            onVisitTimeEndChange={this.handleVisitTimeEndChange}
            onVisitTimeStartChange={this.handleVisitTimeStartChange}
            visitTimeEnabled={this.state.visitTimeEnabled}
            visitTimeRange={this.state.visitTimeRange}
          />
        ) : null}
      </div>
    );
  }
}

export default PinScheduleEditor;
