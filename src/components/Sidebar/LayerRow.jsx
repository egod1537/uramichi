import React from 'react';
import useProjectStore from '../../stores/useProjectStore';
import withStore from '../../utils/withStore';
import {
  CATEGORY_PRESETS,
  DEFAULT_PIN_SVG_PATH,
  TRANSPORT_PRESETS,
  TRAVEL_PIN_ICON_PRESETS,
  getTravelPinIconKey,
  getTravelPinIconPreset,
} from '../../utils/opts';

class LayerRow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isMenuOpen: false,
      objectOptionsTargetId: null,
      iconPickerPinId: null,
      dragObject: null,
      objectDropPreview: null,
      layerRenameDraft: props.layer.name,
      renameDraftsByTargetId: {},
    };
    this.layerRenameInputRef = React.createRef();
    this.renameInputRefsByTargetId = {};
  }

  componentDidUpdate(previousProps, previousState) {
    if (previousProps.layer.name !== this.props.layer.name) {
      this.setState({ layerRenameDraft: this.props.layer.name });
    }

    const currentEditingTarget = this.props.editingRenameTarget;
    const previousEditingTarget = previousProps.editingRenameTarget;
    if (currentEditingTarget !== previousEditingTarget) {
      if (
        currentEditingTarget?.type === 'layer' &&
        currentEditingTarget.id === `layer-${this.props.layer.id}`
      ) {
        window.setTimeout(() => this.layerRenameInputRef.current?.focus(), 0);
      }
      if (
        (currentEditingTarget?.type === 'pin' || currentEditingTarget?.type === 'line') &&
        currentEditingTarget.layerId === this.props.layer.id
      ) {
        window.setTimeout(
          () => this.renameInputRefsByTargetId[currentEditingTarget.id]?.focus?.(),
          0,
        );
      }
    }

    if (
      previousState.objectOptionsTargetId !== this.state.objectOptionsTargetId &&
      this.state.objectOptionsTargetId
    ) {
      window.addEventListener('click', this.handleOutsideObjectOptionsClick);
    }
    if (previousState.objectOptionsTargetId && !this.state.objectOptionsTargetId) {
      window.removeEventListener('click', this.handleOutsideObjectOptionsClick);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.handleOutsideObjectOptionsClick);
  }

  handleOutsideObjectOptionsClick = () => {
    this.setState({ objectOptionsTargetId: null });
  };

  createLayerObjectList = (layerPins, layerLines) => {
    const pinObjectList = layerPins.map((pinItem) => ({ type: 'pin', data: pinItem }));
    const lineObjectList = layerLines.map((lineItem) => ({ type: 'line', data: lineItem }));
    return [...pinObjectList, ...lineObjectList];
  };

  handleObjectDrop = (layerId, objectItem, dropPosition) => {
    const { projectStore } = this.props;
    const { dragObject } = this.state;
    if (!dragObject) return;
    projectStore.reorderLayerObjectsInLayer(
      layerId,
      { type: dragObject.type, id: dragObject.id },
      { type: objectItem.type, id: objectItem.data.id },
      dropPosition,
    );

    this.setState({ dragObject: null, objectDropPreview: null });
  };

  renderObjectRow = (
    layer,
    objectItem,
    objectIndex,
    layerObjectList,
    focusedRenameTarget,
    editingRenameTarget,
    onFocusRenameTarget,
    onStartRename,
    onFinishRename,
    projectStore,
    pinNameMap,
    renameDraftsByTargetId,
    objectOptionsTargetId,
    iconPickerPinId,
    objectDropPreview,
  ) => {
    const objectData = objectItem.data;
    const objectType = objectItem.type;
    const objectRenameTargetId = `${objectType}-${objectData.id}`;
    const isObjectRenameEditing = editingRenameTarget?.id === objectRenameTargetId;
    const routeItem =
      objectType === 'pin'
        ? layer.routes.find(
            (routeData) =>
              routeData.fromPinId === objectData.id &&
              routeData.toPinId === layerObjectList[objectIndex + 1]?.data?.id,
          )
        : null;

    return (
      <div
        key={objectRenameTargetId}
        className="space-y-1"
        draggable
        onDragStart={(event) => {
          event.stopPropagation();
          this.setState({ dragObject: { type: objectType, id: objectData.id } });
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
          const targetRect = event.currentTarget.getBoundingClientRect();
          const isUpperHalf = event.clientY < targetRect.top + targetRect.height / 2;
          this.setState({
            objectDropPreview: {
              targetObjectId: objectRenameTargetId,
              dropPosition: isUpperHalf ? 'before' : 'after',
            },
          });
        }}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();
          const targetRect = event.currentTarget.getBoundingClientRect();
          const isUpperHalf = event.clientY < targetRect.top + targetRect.height / 2;
          this.handleObjectDrop(layer.id, objectItem, isUpperHalf ? 'before' : 'after');
        }}
        onDragEnd={() => this.setState({ dragObject: null, objectDropPreview: null })}
      >
        {objectDropPreview?.targetObjectId === objectRenameTargetId &&
          objectDropPreview.dropPosition === 'before' && (
            <div className="mx-2 h-1 rounded bg-blue-500" />
          )}

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              if (objectType === 'pin') {
                projectStore.selectPin(objectData.id);
                return;
              }
              projectStore.selectLine(objectData.id);
            }}
            className="flex min-w-0 flex-1 items-center gap-2 rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-100"
          >
            {objectType === 'pin' ? (
              <span className="relative" onClick={(event) => event.stopPropagation()}>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    this.setState({
                      iconPickerPinId: iconPickerPinId === objectData.id ? null : objectData.id,
                    });
                  }}
                  className="rounded p-1 hover:bg-gray-200"
                >
                  <img
                    src={
                      getTravelPinIconPreset(
                        getTravelPinIconKey(
                          objectData.icon ||
                            CATEGORY_PRESETS[objectData.category]?.icon ||
                            CATEGORY_PRESETS.default.icon,
                        ),
                      )?.svgPath || DEFAULT_PIN_SVG_PATH
                    }
                    alt={objectData.name}
                    className="h-4 w-4"
                  />
                </button>
                {iconPickerPinId === objectData.id ? (
                  <div
                    className="absolute left-0 top-7 z-20 w-44 rounded-lg border border-gray-200 bg-white p-2 shadow-xl"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="grid grid-cols-5 gap-1">
                      {TRAVEL_PIN_ICON_PRESETS.map((iconPreset) => {
                        const isSelectedIcon =
                          getTravelPinIconKey(
                            objectData.icon ||
                              CATEGORY_PRESETS[objectData.category]?.icon ||
                              CATEGORY_PRESETS.default.icon,
                          ) === iconPreset.key;
                        return (
                          <button
                            key={iconPreset.key}
                            type="button"
                            onClick={() => {
                              projectStore.updatePin(objectData.id, { icon: iconPreset.key });
                              this.setState({ iconPickerPinId: null });
                            }}
                            className={`rounded-md px-1 py-1 text-lg hover:bg-gray-100 ${isSelectedIcon ? 'bg-blue-50 ring-1 ring-blue-300' : ''}`}
                          >
                            <img
                              src={iconPreset.svgPath}
                              alt={iconPreset.label}
                              className="h-5 w-5"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </span>
            ) : (
              <span>
                {objectData.shapeType === 'polygon'
                  ? '🔷'
                  : objectData.sourceType === 'measurement'
                    ? '📏'
                    : '🧵'}
              </span>
            )}

            {isObjectRenameEditing ? (
              <input
                ref={(node) => {
                  this.renameInputRefsByTargetId[objectRenameTargetId] = node;
                }}
                value={renameDraftsByTargetId[objectRenameTargetId] ?? objectData.name}
                onChange={(event) => {
                  const nextRenameDraft = event.target.value;
                  this.setState((previousState) => ({
                    renameDraftsByTargetId: {
                      ...previousState.renameDraftsByTargetId,
                      [objectRenameTargetId]: nextRenameDraft,
                    },
                  }));
                }}
                onBlur={() => {
                  const renamedValue =
                    renameDraftsByTargetId[objectRenameTargetId] ?? objectData.name;
                  if (objectType === 'pin') {
                    projectStore.updatePin(objectData.id, { name: renamedValue });
                  } else {
                    projectStore.updateLine(objectData.id, { name: renamedValue });
                  }
                  onFinishRename();
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    const renamedValue =
                      renameDraftsByTargetId[objectRenameTargetId] ?? objectData.name;
                    if (objectType === 'pin') {
                      projectStore.updatePin(objectData.id, { name: renamedValue });
                    } else {
                      projectStore.updateLine(objectData.id, { name: renamedValue });
                    }
                    onFinishRename();
                  }
                  if (event.key === 'Escape') {
                    onFinishRename();
                  }
                }}
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
              />
            ) : (
              <span
                className="truncate"
                tabIndex={0}
                onFocus={() =>
                  onFocusRenameTarget({
                    type: objectType,
                    id: objectRenameTargetId,
                    layerId: layer.id,
                  })
                }
                onDoubleClick={(event) => {
                  event.stopPropagation();
                  onStartRename({ type: objectType, id: objectRenameTargetId, layerId: layer.id });
                }}
              >
                {objectData.name}
              </span>
            )}
          </button>

          <div className="relative" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="rounded p-1 text-gray-500 hover:bg-gray-100"
              onClick={() =>
                this.setState({
                  objectOptionsTargetId:
                    objectOptionsTargetId === objectRenameTargetId ? null : objectRenameTargetId,
                })
              }
            >
              ⋯
            </button>
            {objectOptionsTargetId === objectRenameTargetId && (
              <div className="absolute right-0 top-7 z-20 w-28 rounded border border-gray-200 bg-white py-1 shadow">
                <button
                  type="button"
                  onClick={() => {
                    onStartRename({
                      type: objectType,
                      id: objectRenameTargetId,
                      layerId: layer.id,
                    });
                    this.setState({ objectOptionsTargetId: null });
                  }}
                  className="block w-full px-3 py-1 text-left text-xs text-gray-700 hover:bg-gray-100"
                >
                  이름 변경
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (objectType === 'pin') {
                      projectStore.removePin(objectData.id);
                    } else {
                      projectStore.removeLine(objectData.id);
                    }
                  }}
                  className="block w-full px-3 py-1 text-left text-xs text-red-500 hover:bg-gray-100"
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        </div>

        {routeItem && (
          <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-500">
            <span>
              {TRANSPORT_PRESETS[routeItem.transport]?.icon ?? TRANSPORT_PRESETS.walk.icon}
            </span>
            <span className="truncate">
              {pinNameMap[routeItem.fromPinId]} → {pinNameMap[routeItem.toPinId]}
            </span>
          </div>
        )}

        {objectDropPreview?.targetObjectId === objectRenameTargetId &&
          objectDropPreview.dropPosition === 'after' && (
            <div className="mx-2 h-1 rounded bg-blue-500" />
          )}
      </div>
    );
  };

  render() {
    const {
      layer,
      filteredPins,
      lines,
      isDraggingLayer,
      layerDropPreview,
      onLayerDragStart,
      onLayerDragEnd,
      onLayerDragOver,
      onLayerDrop,
      focusedRenameTarget,
      editingRenameTarget,
      onFocusRenameTarget,
      onStartRename,
      onFinishRename,
      projectStore,
    } = this.props;

    const {
      isMenuOpen,
      objectOptionsTargetId,
      iconPickerPinId,
      dragObject,
      objectDropPreview,
      layerRenameDraft,
      renameDraftsByTargetId,
    } = this.state;

    const layerPins = filteredPins.filter((pinItem) => pinItem.layerId === layer.id);
    const layerLines = lines.filter((lineItem) => lineItem.layerId === layer.id);
    const layerObjectList = this.createLayerObjectList(layerPins, layerLines);
    const layerRenameTargetId = `layer-${layer.id}`;
    const isLayerRenameEditing = editingRenameTarget?.id === layerRenameTargetId;
    const isLayerFocused = focusedRenameTarget?.id === layerRenameTargetId;
    const isLayerDropPreviewBefore =
      layerDropPreview?.targetLayerId === layer.id && layerDropPreview.dropPosition === 'before';
    const isLayerDropPreviewAfter =
      layerDropPreview?.targetLayerId === layer.id && layerDropPreview.dropPosition === 'after';
    const pinNameMap = layerPins.reduce(
      (accumulator, pinItem) => ({ ...accumulator, [pinItem.id]: pinItem.name }),
      {},
    );

    return (
      <div
        className={`rounded-md border px-2 py-2 ${isDraggingLayer ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white'}`}
        draggable
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = 'move';
          onLayerDragStart(layer.id);
        }}
        onDragEnd={onLayerDragEnd}
        onDragOver={(event) => {
          event.preventDefault();
          const targetRect = event.currentTarget.getBoundingClientRect();
          const isUpperHalf = event.clientY < targetRect.top + targetRect.height / 2;
          onLayerDragOver(layer.id, isUpperHalf ? 'before' : 'after');
        }}
        onDrop={(event) => {
          event.preventDefault();
          const targetRect = event.currentTarget.getBoundingClientRect();
          const isUpperHalf = event.clientY < targetRect.top + targetRect.height / 2;
          onLayerDrop(layer.id, isUpperHalf ? 'before' : 'after');
        }}
      >
        {isLayerDropPreviewBefore && <div className="mx-2 mb-1 h-1 rounded bg-blue-500" />}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => projectStore.toggleLayerCollapse(layer.id)}
            className="rounded p-1 text-gray-500 hover:bg-gray-100"
          >
            {layer.collapsed ? '▶' : '▼'}
          </button>
          <input
            type="checkbox"
            checked={layer.visible}
            onChange={() => projectStore.toggleLayerVisibility(layer.id)}
          />

          <button
            type="button"
            onClick={() => projectStore.setActiveLayer(layer.id)}
            className={`min-w-0 flex-1 rounded px-1 py-1 text-left text-sm ${projectStore.activeLayerId === layer.id ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            {isLayerRenameEditing ? (
              <input
                ref={this.layerRenameInputRef}
                value={layerRenameDraft}
                onChange={(event) => this.setState({ layerRenameDraft: event.target.value })}
                onBlur={() => {
                  projectStore.renameLayer(layer.id, layerRenameDraft || layer.name);
                  onFinishRename();
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    projectStore.renameLayer(layer.id, layerRenameDraft || layer.name);
                    onFinishRename();
                  }
                  if (event.key === 'Escape') {
                    this.setState({ layerRenameDraft: layer.name });
                    onFinishRename();
                  }
                }}
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
              />
            ) : (
              <span
                tabIndex={0}
                className={`${isLayerFocused ? 'ring-2 ring-blue-200' : ''} rounded px-1`}
                onFocus={() =>
                  onFocusRenameTarget({ type: 'layer', id: layerRenameTargetId, layerId: layer.id })
                }
                onClick={() =>
                  onFocusRenameTarget({ type: 'layer', id: layerRenameTargetId, layerId: layer.id })
                }
                onDoubleClick={(event) => {
                  event.stopPropagation();
                  onStartRename({ type: 'layer', id: layerRenameTargetId, layerId: layer.id });
                }}
              >
                {layer.name}
              </span>
            )}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() =>
                this.setState((previousState) => ({ isMenuOpen: !previousState.isMenuOpen }))
              }
              className="rounded p-1 text-gray-500 hover:bg-gray-100"
            >
              ⋮
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 top-7 z-10 w-24 rounded border border-gray-200 bg-white py-1 shadow">
                <button
                  type="button"
                  onClick={() => {
                    onStartRename({ type: 'layer', id: layerRenameTargetId, layerId: layer.id });
                    this.setState({ isMenuOpen: false });
                  }}
                  className="block w-full px-3 py-1 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  이름 변경
                </button>
                <button
                  type="button"
                  onClick={() => projectStore.removeLayer(layer.id)}
                  className="block w-full px-3 py-1 text-left text-sm text-red-500 hover:bg-gray-100"
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        </div>

        {!layer.collapsed && (
          <div className="relative mt-2 space-y-1 pl-8 pr-2">
            {layerObjectList.map((objectItem, objectIndex) =>
              this.renderObjectRow(
                layer,
                objectItem,
                objectIndex,
                layerObjectList,
                focusedRenameTarget,
                editingRenameTarget,
                onFocusRenameTarget,
                onStartRename,
                onFinishRename,
                projectStore,
                pinNameMap,
                renameDraftsByTargetId,
                objectOptionsTargetId,
                iconPickerPinId,
                objectDropPreview,
              ),
            )}

            {!!layerObjectList.length && (
              <div
                className={`mx-2 h-1 rounded bg-blue-500 transition-opacity ${objectDropPreview?.targetObjectId === '__end__' ? 'opacity-100' : 'opacity-0'}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (!dragObject) return;
                  this.setState({
                    objectDropPreview: { targetObjectId: '__end__', dropPosition: 'end' },
                  });
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (!dragObject) return;
                  const endTargetObject = [...layerObjectList]
                    .reverse()
                    .find((objectItem) => objectItem.type === dragObject.type);
                  if (!endTargetObject) return;
                  this.handleObjectDrop(layer.id, endTargetObject, 'end');
                }}
              />
            )}
          </div>
        )}
        {isLayerDropPreviewAfter && <div className="mx-2 mt-1 h-1 rounded bg-blue-500" />}
      </div>
    );
  }
}

const ConnectedLayerRow = withStore(LayerRow, { projectStore: useProjectStore });

export default ConnectedLayerRow;
