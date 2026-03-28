import React from 'react';
import { CloseIcon, CopyIcon } from '../../components/icons/WorkspaceIcons';

interface ShareDialogProps {
  accessDescription: string;
  isCopied: boolean;
  isPublicEnabled: boolean;
  isSearchEnabled: boolean;
  linkValue: string;
  ownerInitial: string;
  ownerLabel: string;
  ownerMeta: string;
  shareErrorMessage: string;
  shareStatus: 'disabled' | 'loading' | 'ready' | 'fallback' | 'error';
  onClose: () => void;
  onCopyLink: () => void;
  onOpenLink: () => void;
  onTogglePublic: () => void;
  onToggleSearchable: () => void;
}

function renderToggleButton(
  checked: boolean,
  disabled: boolean,
  onClick: () => void,
  ariaLabel: string,
) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={checked}
      className={`workspace-share-dialog-switch ${
        checked ? 'workspace-share-dialog-switch--checked' : ''
      }`}
    >
      <span className="workspace-share-dialog-switch-knob" />
    </button>
  );
}

export default function ShareDialog({
  accessDescription,
  isCopied,
  isPublicEnabled,
  isSearchEnabled,
  linkValue,
  ownerInitial,
  ownerLabel,
  ownerMeta,
  shareErrorMessage,
  shareStatus,
  onClose,
  onCopyLink,
  onOpenLink,
  onTogglePublic,
  onToggleSearchable,
}: ShareDialogProps) {
  const canCopy = (shareStatus === 'ready' || shareStatus === 'fallback') && Boolean(linkValue);
  const canOpen = canCopy;

  return (
    <div
      className="workspace-share-dialog-overlay"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="workspace-share-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="workspace-share-dialog-title"
      >
        <header className="workspace-share-dialog-header">
          <h2 id="workspace-share-dialog-title" className="workspace-share-dialog-title">
            지도 공유
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="workspace-share-dialog-close"
            aria-label="공유 팝업 닫기"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="workspace-share-dialog-body">
          <div className="workspace-share-dialog-toggle-list">
            <div className="workspace-share-dialog-toggle-row">
              {renderToggleButton(
                isPublicEnabled,
                false,
                onTogglePublic,
                '링크가 있는 사용자는 누구나 볼 수 있음',
              )}
              <div className="workspace-share-dialog-toggle-copy">
                <p className="workspace-share-dialog-toggle-title">
                  링크가 있는 사용자는 누구나 볼 수 있음
                </p>
                <p className="workspace-share-dialog-toggle-description">
                  현재 레이어 상태로 진입할 수 있는 웹사이트 공유 링크를 발급합니다.
                </p>
              </div>
            </div>

            <div className="workspace-share-dialog-toggle-row">
              {renderToggleButton(
                isSearchEnabled,
                !isPublicEnabled,
                onToggleSearchable,
                '다른 사람이 인터넷에서 이 지도를 검색하고 찾도록 허용함',
              )}
              <div className="workspace-share-dialog-toggle-copy">
                <p className="workspace-share-dialog-toggle-title">
                  다른 사람이 인터넷에서 이 지도를 검색하고 찾도록 허용함
                </p>
                <p className="workspace-share-dialog-toggle-description">
                  Shlink 단축 링크를 검색 엔진에 노출 가능한 링크로 생성합니다.
                </p>
              </div>
            </div>
          </div>

          <p className="workspace-share-dialog-note">{accessDescription}</p>

          <div className="workspace-share-dialog-owner">
            <span className="workspace-share-dialog-owner-badge">{ownerInitial}</span>
            <div className="workspace-share-dialog-owner-copy">
              <p className="workspace-share-dialog-owner-label">{ownerLabel}</p>
              <p className="workspace-share-dialog-owner-meta">{ownerMeta}</p>
            </div>
          </div>

          <div className="workspace-share-dialog-link-block">
            <div className="workspace-share-dialog-link-row">
              <input
                readOnly
                value={linkValue}
                className="workspace-share-dialog-link-input"
                aria-label="공유 링크"
              />

              <button
                type="button"
                onClick={onCopyLink}
                disabled={!canCopy}
                className="workspace-share-dialog-copy-button"
                aria-label="공유 링크 복사"
                title={isCopied ? '복사됨' : '링크 복사'}
              >
                <CopyIcon />
              </button>
            </div>

            {shareErrorMessage ? (
              <p className="workspace-share-dialog-error">{shareErrorMessage}</p>
            ) : null}

            {shareStatus === 'fallback' ? (
              <p className="workspace-share-dialog-note">
                Shlink 응답이 없어 원본 링크를 대신 표시하고 있습니다.
              </p>
            ) : null}
          </div>
        </div>

        <footer className="workspace-share-dialog-footer">
          <button
            type="button"
            onClick={onOpenLink}
            disabled={!canOpen}
            className="workspace-share-dialog-secondary-button"
          >
            새 탭에서 열기
          </button>
          <button type="button" onClick={onClose} className="workspace-share-dialog-primary-button">
            닫기
          </button>
        </footer>
      </section>
    </div>
  );
}
