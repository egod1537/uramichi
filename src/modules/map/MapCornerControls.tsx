import React from 'react';
import { AppsGridIcon } from '../../components/icons/WorkspaceIcons';
import type { GoogleUser } from '../../models/Plan';
import { readStoredGoogleUser } from '../../services/GoogleUserSession';
import { GoogleLoginCard } from '../topbar';

interface MapCornerControlsProps {
  planTitle: string;
  travelRange: string;
}

interface MapCornerControlsState {
  googleUser: GoogleUser | null;
  isAppsOpen: boolean;
  isAccountOpen: boolean;
}

class MapCornerControls extends React.Component<
  MapCornerControlsProps,
  MapCornerControlsState
> {
  static defaultProps = {};

  constructor(props: MapCornerControlsProps) {
    super(props);
    this.state = {
      googleUser: readStoredGoogleUser(),
      isAppsOpen: false,
      isAccountOpen: false,
    };
  }

  private handleAppsToggle = () => {
    this.setState((currentState) => ({
      isAppsOpen: !currentState.isAppsOpen,
      isAccountOpen: false,
    }));
  };

  private handleAccountToggle = () => {
    this.setState((currentState) => ({
      isAppsOpen: false,
      isAccountOpen: !currentState.isAccountOpen,
    }));
  };

  private handleUserChange = (googleUser: GoogleUser | null) => {
    this.setState({
      googleUser,
    });
  };

  private handleAppsItemClick = () => {
    this.setState({
      isAppsOpen: false,
    });
  };

  render() {
    const { googleUser, isAppsOpen, isAccountOpen } = this.state;
    const { planTitle, travelRange } = this.props;

    return (
      <div className="workspace-map-corner-controls">
        <div className="workspace-map-corner-row">
          <div className="workspace-map-corner-menu">
            <button
              type="button"
              className="workspace-map-corner-button workspace-map-corner-button--apps"
              aria-label="다른 지도 열기"
              title="다른 지도"
              onClick={this.handleAppsToggle}
            >
              <AppsGridIcon />
            </button>

            {isAppsOpen ? (
              <div className="workspace-map-corner-popover workspace-map-corner-popover--apps">
                <div className="workspace-map-switcher-card">
                  <p className="workspace-map-switcher-eyebrow">메뉴</p>
                  <button
                    type="button"
                    className="workspace-map-switcher-item workspace-map-switcher-item--active"
                    onClick={this.handleAppsItemClick}
                  >
                    <span className="workspace-map-switcher-item-label">내 지도</span>
                    <span className="workspace-map-switcher-item-title">{planTitle}</span>
                    <span className="workspace-map-switcher-item-meta">{travelRange}</span>
                  </button>
                  <button
                    type="button"
                    className="workspace-map-switcher-item"
                    onClick={this.handleAppsItemClick}
                  >
                    <span className="workspace-map-switcher-item-label">설정</span>
                    <span className="workspace-map-switcher-item-title">지도 설정</span>
                    <span className="workspace-map-switcher-item-meta">
                      핀 기본값, 지도 스타일, 표시 옵션
                    </span>
                  </button>
                  <p className="workspace-map-switcher-note">
                    메뉴 동작 연결은 다음 단계에서 이어서 붙일 수 있습니다.
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="workspace-map-corner-menu">
            <button
              type="button"
              className="workspace-map-corner-button workspace-map-corner-button--profile"
              aria-label="구글 계정 메뉴"
              title={googleUser?.name ?? '구글 계정'}
              onClick={this.handleAccountToggle}
            >
              {googleUser?.imageUrl ? (
                <img
                  src={googleUser.imageUrl}
                  alt={googleUser.name}
                  className="workspace-map-corner-avatar"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="workspace-map-corner-avatar workspace-map-corner-avatar--placeholder">
                  {googleUser?.name?.slice(0, 1) ?? 'G'}
                </span>
              )}
            </button>

            {isAccountOpen ? (
              <div className="workspace-map-corner-popover">
                <GoogleLoginCard onUserChange={this.handleUserChange} />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
}

export default MapCornerControls;
