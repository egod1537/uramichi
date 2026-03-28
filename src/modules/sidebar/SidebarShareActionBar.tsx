import { DownloadIcon, PlusIcon, ShareIcon } from '../../components/icons/WorkspaceIcons';

interface SidebarShareActionBarProps {
  onExportClick: () => void;
  onShareClick: () => void;
}

export default function SidebarShareActionBar({
  onExportClick,
  onShareClick,
}: SidebarShareActionBarProps) {
  return (
    <div className="workspace-sidebar-actions" role="toolbar" aria-label="레이어 액션">
      <button type="button" className="workspace-sidebar-action">
        <PlusIcon />
        <span>레이어 추가</span>
      </button>
      <button type="button" className="workspace-sidebar-action" onClick={onShareClick}>
        <ShareIcon />
        <span>공유</span>
      </button>
      <button type="button" className="workspace-sidebar-action" onClick={onExportClick}>
        <DownloadIcon />
        <span>내보내기</span>
      </button>
    </div>
  );
}
