import React from 'react';
import {
  CloseIcon,
  CodeInterpreterIcon,
  DownloadIcon,
  LayersIcon,
  MapPinIcon,
} from '../../components/icons/WorkspaceIcons';

interface ExportDialogProps {
  drawingCount: number;
  jsonFilename: string;
  kmlFilename: string;
  layerCount: number;
  placeCount: number;
  planTitle: string;
  travelRange: string;
  onClose: () => void;
  onDownloadJson: () => void;
  onDownloadKml: () => void;
}

export default function ExportDialog({
  drawingCount,
  jsonFilename,
  kmlFilename,
  layerCount,
  placeCount,
  planTitle,
  travelRange,
  onClose,
  onDownloadJson,
  onDownloadKml,
}: ExportDialogProps) {
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
        className="workspace-share-dialog workspace-export-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="workspace-export-dialog-title"
      >
        <header className="workspace-share-dialog-header">
          <div>
            <h2 id="workspace-export-dialog-title" className="workspace-share-dialog-title">
              지도 내보내기
            </h2>
            <p className="workspace-export-dialog-meta">
              {planTitle} · {travelRange}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="workspace-share-dialog-close"
            aria-label="내보내기 팝업 닫기"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="workspace-share-dialog-body">
          <div className="workspace-export-dialog-summary">
            <span className="workspace-export-dialog-summary-icon" aria-hidden="true">
              <LayersIcon />
            </span>
            <div className="workspace-export-dialog-summary-copy">
              <p className="workspace-export-dialog-summary-title">
                레이어 {layerCount}개 · 장소 {placeCount}개 · 선/영역 {drawingCount}개
              </p>
              <p className="workspace-export-dialog-summary-description">
                JSON은 전체 상태를, KML은 지도에서 쓰는 핀/선/다각형 중심 데이터를 저장합니다.
              </p>
            </div>
          </div>

          <div className="workspace-export-dialog-grid">
            <article className="workspace-export-dialog-card">
              <div className="workspace-export-dialog-card-icon" aria-hidden="true">
                <CodeInterpreterIcon />
              </div>
              <p className="workspace-export-dialog-card-eyebrow">JSON</p>
              <h3 className="workspace-export-dialog-card-title">전체 플래너 상태</h3>
              <p className="workspace-export-dialog-card-description">
                레이어, 분기, 핀, 선, 타임라인 위치, 필터, 현재 선택 상태까지 그대로 보존합니다.
              </p>
              <p className="workspace-export-dialog-card-filename">{jsonFilename}</p>
              <button
                type="button"
                className="workspace-export-dialog-card-button"
                onClick={onDownloadJson}
              >
                <DownloadIcon />
                <span>JSON 다운로드</span>
              </button>
            </article>

            <article className="workspace-export-dialog-card">
              <div className="workspace-export-dialog-card-icon" aria-hidden="true">
                <MapPinIcon />
              </div>
              <p className="workspace-export-dialog-card-eyebrow">KML</p>
              <h3 className="workspace-export-dialog-card-title">지도 데이터 중심</h3>
              <p className="workspace-export-dialog-card-description">
                핀, 경로, 다각형과 색상/아이콘/시간 같은 지도 메타데이터를 다른 지도 도구로 넘길 때 적합합니다.
              </p>
              <p className="workspace-export-dialog-card-filename">{kmlFilename}</p>
              <button
                type="button"
                className="workspace-export-dialog-card-button"
                onClick={onDownloadKml}
              >
                <DownloadIcon />
                <span>KML 다운로드</span>
              </button>
            </article>
          </div>
        </div>

        <footer className="workspace-share-dialog-footer">
          <button type="button" onClick={onClose} className="workspace-share-dialog-primary-button">
            닫기
          </button>
        </footer>
      </section>
    </div>
  );
}
