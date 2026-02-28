import React from 'react';
import { LoadScript } from '@react-google-maps/api';
import Map from './components/Map/Map';
import Sidebar from './components/Sidebar/Sidebar';
import Toolbar from './components/Toolbar/Toolbar';
import ChatButton from './components/Chat/ChatButton';
import ChatPanel from './components/Chat/ChatPanel';
import UserButton from './components/common/UserButton';
import Testbed from './pages/Testbed';
import { getRoute } from './route';
import useProjectStore from './stores/useProjectStore';
import { initializeLocalization } from './utils/L';

const libraries = ['places', 'geometry'];

class App extends React.Component {
  state = {
    chatPanelOpen: false,
    currentMode: useProjectStore.getState().currentMode,
    historyIndex: useProjectStore.getState().historyIndex,
    historyLength: useProjectStore.getState().history.length,
  };

  componentDidMount() {
    initializeLocalization();
    window.addEventListener('keydown', this.handleWindowKeyDown);
    this.unsubscribeProjectStore = useProjectStore.subscribe((state) => {
      this.setState({
        currentMode: state.currentMode,
        historyIndex: state.historyIndex,
        historyLength: state.history.length,
      });
    });
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleWindowKeyDown);
    if (this.unsubscribeProjectStore) {
      this.unsubscribeProjectStore();
    }
  }

  handleWindowKeyDown = (event) => {
    if (event.key !== 'Tab') {
      return;
    }

    event.preventDefault();
    this.setState((previousState) => ({ chatPanelOpen: !previousState.chatPanelOpen }));
  };

  handleOpenChatPanel = () => {
    this.setState({ chatPanelOpen: true });
  };

  handleCloseChatPanel = () => {
    this.setState({ chatPanelOpen: false });
  };

  renderTestbed() {
    return (
      <LoadScript
        googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
        libraries={libraries}
        loadingElement={<div className="p-4">로딩 중...</div>}
      >
        <Testbed
          currentMode={this.state.currentMode}
          historyIndex={this.state.historyIndex}
          historyLength={this.state.historyLength}
        />
      </LoadScript>
    );
  }

  renderMainPage() {
    return (
      <LoadScript
        googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
        libraries={libraries}
        loadingElement={<div className="p-4">로딩 중...</div>}
      >
        <div className="relative h-screen w-screen overflow-hidden bg-[#82c7d7]">
          <Map />
          <Sidebar />
          <Toolbar
            currentMode={this.state.currentMode}
            historyIndex={this.state.historyIndex}
            historyLength={this.state.historyLength}
          />
          <UserButton />
          {!this.state.chatPanelOpen && <ChatButton onClick={this.handleOpenChatPanel} />}
          <ChatPanel isOpen={this.state.chatPanelOpen} onClose={this.handleCloseChatPanel} />
        </div>
      </LoadScript>
    );
  }

  render() {
    const currentRoute = getRoute();
    if (currentRoute === 'testbed') {
      return this.renderTestbed();
    }
    return this.renderMainPage();
  }
}

export default App;
