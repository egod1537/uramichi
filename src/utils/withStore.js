// Generated under Codex compliance with AGENTS.md (uramichi)
import React from 'react';

const getStoreSnapshot = (storeEntries) =>
  storeEntries.reduce((snapshotMap, [propKey, storeHook]) => {
    snapshotMap[propKey] = storeHook.getState();
    return snapshotMap;
  }, {});

function withStore(WrappedComponent, storeMap) {
  return class StoreSubscriberWrapper extends React.Component {
    constructor(props) {
      super(props);
      const storeEntries = Object.entries(storeMap);
      this.storeEntries = storeEntries;
      this.state = {
        storeStateMap: getStoreSnapshot(storeEntries),
      };
      this.unsubscribeList = [];
    }

    componentDidMount() {
      this.unsubscribeList = this.storeEntries.map(([propKey, storeHook]) =>
        storeHook.subscribe((nextStoreState) => {
          this.setState((previousState) => ({
            storeStateMap: {
              ...previousState.storeStateMap,
              [propKey]: nextStoreState,
            },
          }));
        }),
      );
    }

    componentWillUnmount() {
      this.unsubscribeList.forEach((unsubscribe) => unsubscribe?.());
      this.unsubscribeList = [];
    }

    render() {
      return React.createElement(WrappedComponent, { ...this.props, ...this.state.storeStateMap });
    }
  };
}

export default withStore;
