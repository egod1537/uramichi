import { MapView } from '../modules/map';
import { SidebarPanel } from '../modules/sidebar';
import { TimelineSlider } from '../modules/timeline';
import { ChatPanel } from '../modules/chat';
import ErrorBoundary from '../shared/components/ErrorBoundary';
import { isDebugEnabledFromLocation } from '../shared/utils/debug';
import styles from './App.module.css';

export default function App() {
  const debugEnabled = isDebugEnabledFromLocation();

  return (
    <ErrorBoundary>
      <div
        className={`${styles.app} workspace-shell`}
        data-debug-enabled={debugEnabled ? 'true' : 'false'}
      >
        <div className="workspace-main">
          <section className="workspace-canvas">
            <div className="workspace-map-panel">
              <MapView className="workspace-map-fill" />
              <SidebarPanel />
              <TimelineSlider />
              <ChatPanel />
            </div>
          </section>
        </div>
      </div>
    </ErrorBoundary>
  );
}
