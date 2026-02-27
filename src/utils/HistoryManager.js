class HistoryManager {
  static createEmptySnapshot() {
    return { markers: [], lines: [], measurements: [], routes: [], linePath: [], routePaths: [], measurePath: [] }
  }

  static cloneSnapshot(snapshot) {
    return {
      markers: snapshot.markers.map((point) => ({ ...point })),
      lines: snapshot.lines.map((lineItem) => ({
        ...lineItem,
        points: (lineItem.points || []).map((point) => ({ ...point })),
      })),
      measurements: (snapshot.measurements || []).map((measurementItem) => ({
        ...measurementItem,
        points: (measurementItem.points || []).map((point) => ({ ...point })),
      })),
      routes: snapshot.routes.map((routeItem) => ({
        ...routeItem,
        start: routeItem.start ? { ...routeItem.start } : null,
        end: routeItem.end ? { ...routeItem.end } : null,
        path: (routeItem.path || []).map((point) => ({ ...point })),
      })),
      linePath: snapshot.linePath.map((point) => ({ ...point })),
      routePaths: snapshot.routePaths.map((pathItem) => pathItem.map((point) => ({ ...point }))),
      measurePath: snapshot.measurePath.map((point) => ({ ...point })),
    }
  }

  static commit(history, historyIndex, snapshot) {
    const nextSnapshot = HistoryManager.cloneSnapshot(snapshot)
    const trimmedHistory = history.slice(0, historyIndex + 1)
    const nextHistory = [...trimmedHistory, nextSnapshot]
    return { history: nextHistory, historyIndex: nextHistory.length - 1, snapshot: nextSnapshot }
  }

  static undo(history, historyIndex) {
    if (historyIndex === 0) return null
    const nextHistoryIndex = historyIndex - 1
    return {
      historyIndex: nextHistoryIndex,
      snapshot: HistoryManager.cloneSnapshot(history[nextHistoryIndex]),
    }
  }

  static redo(history, historyIndex) {
    if (historyIndex >= history.length - 1) return null
    const nextHistoryIndex = historyIndex + 1
    return {
      historyIndex: nextHistoryIndex,
      snapshot: HistoryManager.cloneSnapshot(history[nextHistoryIndex]),
    }
  }
}

export default HistoryManager
