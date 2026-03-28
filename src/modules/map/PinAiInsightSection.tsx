import React from 'react';
import { ChevronDownIcon, MagicWandIcon } from '../../components/icons/WorkspaceIcons';
import type { Poi } from '../../models/Poi';
import { requestPoiInsight } from '../../services/AiAgentService';

interface PinAiInsightSectionProps {
  place: Poi;
}

interface PinAiInsightSectionState {
  content: string;
  errorMessage: string;
  isExpanded: boolean;
  isLoading: boolean;
}

class PinAiInsightSection extends React.Component<
  PinAiInsightSectionProps,
  PinAiInsightSectionState
> {
  static defaultProps = {};

  private isUnmounted = false;

  constructor(props: PinAiInsightSectionProps) {
    super(props);
    this.state = {
      content: '',
      errorMessage: '',
      isExpanded: false,
      isLoading: false,
    };
  }

  componentDidUpdate(prevProps: PinAiInsightSectionProps) {
    if (
      prevProps.place.id === this.props.place.id &&
      prevProps.place.detail === this.props.place.detail &&
      prevProps.place.memo === this.props.place.memo &&
      prevProps.place.summary === this.props.place.summary
    ) {
      return;
    }

    this.setState({
      content: '',
      errorMessage: '',
      isExpanded: false,
      isLoading: false,
    });
  }

  componentWillUnmount() {
    this.isUnmounted = true;
  }

  private handleToggle = () => {
    this.setState(
      (currentState) => ({
        errorMessage: currentState.isExpanded ? currentState.errorMessage : '',
        isExpanded: !currentState.isExpanded,
      }),
      () => {
        if (this.state.isExpanded && !this.state.content && !this.state.isLoading) {
          void this.loadInsight();
        }
      },
    );
  };

  private handleRetry = () => {
    void this.loadInsight();
  };

  private async loadInsight() {
    this.setState({
      errorMessage: '',
      isLoading: true,
    });

    try {
      const content = await requestPoiInsight(this.props.place);

      if (this.isUnmounted) {
        return;
      }

      this.setState({
        content: content || 'AI가 정리할 내용을 찾지 못했습니다.',
        isLoading: false,
      });
    } catch (error) {
      if (this.isUnmounted) {
        return;
      }

      this.setState({
        errorMessage:
          error instanceof Error ? error.message : 'AI 설명을 불러오지 못했습니다.',
        isLoading: false,
      });
    }
  }

  private renderBody() {
    if (this.state.isLoading) {
      return <p className="workspace-poi-popup-ai-copy">AI가 장소 정보를 정리하고 있습니다.</p>;
    }

    if (this.state.errorMessage) {
      return (
        <div className="workspace-poi-popup-ai-state">
          <p className="workspace-poi-popup-ai-error">{this.state.errorMessage}</p>
          <button
            type="button"
            className="workspace-poi-popup-secondary-button"
            onClick={this.handleRetry}
          >
            다시 시도
          </button>
        </div>
      );
    }

    if (!this.state.content) {
      return null;
    }

    return <div className="workspace-poi-popup-ai-copy">{this.state.content}</div>;
  }

  render() {
    return (
      <section
        className={`workspace-poi-popup-ai ${
          this.state.isExpanded ? 'workspace-poi-popup-ai--expanded' : ''
        }`}
      >
        <button
          type="button"
          className="workspace-poi-popup-ai-trigger"
          onClick={this.handleToggle}
          aria-expanded={this.state.isExpanded}
        >
          <span className="workspace-poi-popup-ai-trigger-copy">
            <span className="workspace-poi-popup-ai-trigger-icon" aria-hidden="true">
              <MagicWandIcon />
            </span>
            <span>AI 정리</span>
          </span>
          <span className="workspace-poi-popup-ai-trigger-chevron" aria-hidden="true">
            <ChevronDownIcon />
          </span>
        </button>

        {this.state.isExpanded ? (
          <div className="workspace-poi-popup-ai-panel">{this.renderBody()}</div>
        ) : null}
      </section>
    );
  }
}

export default PinAiInsightSection;
