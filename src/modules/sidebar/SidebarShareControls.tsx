import React from 'react';
import { readStoredGoogleUser } from '../../services/GoogleUserSession';
import {
  buildPlannerExportFilenames,
  downloadPlannerJson,
  downloadPlannerKml,
} from '../../services/PlannerExportService';
import { buildPlannerShareUrl, createPlannerShareLink } from '../../services/ShareLinkService';
import ExportDialog from './ExportDialog';
import ShareDialog from './ShareDialog';
import SidebarShareActionBar from './SidebarShareActionBar';
import type {
  SidebarShareControlsProps,
  SidebarShareControlsState,
} from './SidebarShareControls.types';

class SidebarShareControls extends React.Component<
  SidebarShareControlsProps,
  SidebarShareControlsState
> {
  static defaultProps = {};

  private copyResetTimer: number | null = null;

  private shareRequestId = 0;

  private shareLinkCache = new Map<string, string>();

  constructor(props: SidebarShareControlsProps) {
    super(props);
    this.state = {
      isExportDialogOpen: false,
      isShareDialogOpen: false,
      isShareLinkCopied: false,
      isSharePublicEnabled: true,
      isShareSearchEnabled: false,
      shareErrorMessage: '',
      shareLink: '',
      shareStatus: 'disabled',
    };
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleWindowKeyDown);
  }

  componentDidUpdate(prevProps: SidebarShareControlsProps, prevState: SidebarShareControlsState) {
    if (
      prevProps.snapshot === this.props.snapshot ||
      !this.state.isShareDialogOpen ||
      !this.state.isSharePublicEnabled
    ) {
      return;
    }

    if (
      prevState.isShareSearchEnabled !== this.state.isShareSearchEnabled ||
      prevState.isSharePublicEnabled !== this.state.isSharePublicEnabled
    ) {
      return;
    }

    void this.refreshShareLink();
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleWindowKeyDown);

    if (this.copyResetTimer) {
      window.clearTimeout(this.copyResetTimer);
    }
  }

  private handleWindowKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') {
      return;
    }

    if (this.state.isShareDialogOpen) {
      this.closeShareDialog();
    }

    if (this.state.isExportDialogOpen) {
      this.closeExportDialog();
    }
  };

  private handleShareActionClick = () => {
    const shareLongUrl = buildPlannerShareUrl(this.props.snapshot);

    this.setState(
      {
        isExportDialogOpen: false,
        isShareDialogOpen: true,
        isShareLinkCopied: false,
        shareErrorMessage: '',
        shareLink: this.state.isSharePublicEnabled ? shareLongUrl : '',
        shareStatus: this.state.isSharePublicEnabled ? 'loading' : 'disabled',
      },
      () => {
        if (this.state.isSharePublicEnabled) {
          void this.refreshShareLink();
        }
      },
    );
  };

  private handleExportActionClick = () => {
    this.setState({
      isExportDialogOpen: true,
      isShareDialogOpen: false,
      isShareLinkCopied: false,
    });
  };

  private closeShareDialog = () => {
    this.setState({
      isShareDialogOpen: false,
      isShareLinkCopied: false,
    });
  };

  private closeExportDialog = () => {
    this.setState({
      isExportDialogOpen: false,
    });
  };

  private handleDownloadJson = () => {
    downloadPlannerJson(this.props.snapshot);
  };

  private handleDownloadKml = () => {
    downloadPlannerKml(this.props.snapshot);
  };

  private toggleSharePublicAccess = () => {
    this.setState(
      (currentState) => {
        const nextIsPublicEnabled = !currentState.isSharePublicEnabled;
        const shareLongUrl = buildPlannerShareUrl(this.props.snapshot);

        return {
          isSharePublicEnabled: nextIsPublicEnabled,
          isShareLinkCopied: false,
          shareErrorMessage: '',
          shareLink: nextIsPublicEnabled ? shareLongUrl : '',
          shareStatus: nextIsPublicEnabled ? 'loading' : 'disabled',
        };
      },
      () => {
        if (this.state.isSharePublicEnabled) {
          void this.refreshShareLink();
        }
      },
    );
  };

  private toggleShareSearchAccess = () => {
    if (!this.state.isSharePublicEnabled) {
      return;
    }

    this.setState(
      (currentState) => ({
        isShareLinkCopied: false,
        isShareSearchEnabled: !currentState.isShareSearchEnabled,
        shareErrorMessage: '',
        shareStatus: 'loading',
      }),
      () => {
        void this.refreshShareLink();
      },
    );
  };

  private async refreshShareLink() {
    if (!this.state.isSharePublicEnabled) {
      return;
    }

    const shareLongUrl = buildPlannerShareUrl(this.props.snapshot);
    const cacheKey = `${shareLongUrl}:${this.state.isShareSearchEnabled ? 'crawlable' : 'private'}`;
    const cachedLink = this.shareLinkCache.get(cacheKey);

    if (cachedLink) {
      this.setState({
        shareErrorMessage: '',
        shareLink: cachedLink,
        shareStatus: 'ready',
      });
      return;
    }

    const currentRequestId = this.shareRequestId + 1;
    this.shareRequestId = currentRequestId;

    this.setState({
      shareErrorMessage: '',
      shareLink: shareLongUrl,
      shareStatus: 'loading',
    });

    try {
      const nextShareLink = await createPlannerShareLink(this.props.snapshot, {
        crawlable: this.state.isShareSearchEnabled,
      });

      if (this.shareRequestId !== currentRequestId) {
        return;
      }

      this.shareLinkCache.set(cacheKey, nextShareLink.shortUrl);
      this.setState({
        shareErrorMessage: '',
        shareLink: nextShareLink.shortUrl,
        shareStatus: 'ready',
      });
    } catch (error) {
      if (this.shareRequestId !== currentRequestId) {
        return;
      }

      this.setState({
        shareErrorMessage: '',
        shareLink: shareLongUrl,
        shareStatus: 'fallback',
      });
    }
  }

  private handleOpenShareLink = () => {
    if (!this.state.shareLink) {
      return;
    }

    window.open(this.state.shareLink, '_blank', 'noopener,noreferrer');
  };

  private handleCopyShareLink = async () => {
    const { shareLink } = this.state;

    if (!shareLink) {
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareLink);
      } else {
        const textarea = document.createElement('textarea');

        textarea.value = shareLink;
        textarea.setAttribute('readonly', 'true');
        textarea.style.position = 'absolute';
        textarea.style.opacity = '0';
        document.body.append(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }

      if (this.copyResetTimer) {
        window.clearTimeout(this.copyResetTimer);
      }

      this.setState({
        isShareLinkCopied: true,
      });

      this.copyResetTimer = window.setTimeout(() => {
        this.setState({
          isShareLinkCopied: false,
        });
      }, 1800);
    } catch {
      this.setState({
        isShareLinkCopied: false,
        shareErrorMessage: '클립보드에 링크를 복사하지 못했습니다.',
        shareStatus: 'error',
      });
    }
  };

  render() {
    const {
      isExportDialogOpen,
      isShareDialogOpen,
      isShareLinkCopied,
      isSharePublicEnabled,
      isShareSearchEnabled,
      shareErrorMessage,
      shareLink,
      shareStatus,
    } = this.state;
    const storedUser = readStoredGoogleUser();
    const ownerName = storedUser?.name || '로컬 사용자';
    const ownerMeta = storedUser?.email || '현재 브라우저 세션';
    const ownerInitial = ownerName.slice(0, 2).toUpperCase();
    const layerCount = this.props.snapshot.dayLayers.length;
    const placeCount = this.props.snapshot.allPlaces.length;
    const drawingCount = this.props.snapshot.dayLayers.reduce(
      (count, day) => count + day.drawings.length,
      0,
    );
    const { jsonFilename, kmlFilename } = buildPlannerExportFilenames(this.props.snapshot);
    const shareLinkValue =
      shareStatus === 'disabled'
        ? '링크 공유가 꺼져 있습니다.'
        : shareLink || (shareStatus === 'error' ? '공유 링크를 생성하지 못했습니다.' : '');
    const shareAccessDescription =
      '현재 편집된 핀, 레이어 가시성, 카테고리 필터, 타임라인 위치를 포함한 고유 링크를 생성합니다.';

    return (
      <>
        <SidebarShareActionBar
          onExportClick={this.handleExportActionClick}
          onShareClick={this.handleShareActionClick}
        />

        {isExportDialogOpen ? (
          <ExportDialog
            drawingCount={drawingCount}
            jsonFilename={jsonFilename}
            kmlFilename={kmlFilename}
            layerCount={layerCount}
            placeCount={placeCount}
            planTitle={this.props.snapshot.planMeta.title}
            travelRange={this.props.snapshot.planMeta.travelRange}
            onClose={this.closeExportDialog}
            onDownloadJson={this.handleDownloadJson}
            onDownloadKml={this.handleDownloadKml}
          />
        ) : null}

        {isShareDialogOpen ? (
          <ShareDialog
            accessDescription={shareAccessDescription}
            isCopied={isShareLinkCopied}
            isPublicEnabled={isSharePublicEnabled}
            isSearchEnabled={isShareSearchEnabled}
            linkValue={shareLinkValue}
            ownerInitial={ownerInitial}
            ownerLabel={ownerName}
            ownerMeta={ownerMeta}
            shareErrorMessage={shareErrorMessage}
            shareStatus={shareStatus}
            onClose={this.closeShareDialog}
            onCopyLink={() => void this.handleCopyShareLink()}
            onOpenLink={this.handleOpenShareLink}
            onTogglePublic={this.toggleSharePublicAccess}
            onToggleSearchable={this.toggleShareSearchAccess}
          />
        ) : null}
      </>
    );
  }
}

export default SidebarShareControls;
