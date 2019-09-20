'use strict'

const React = require('react')
const { WindowContext } = require('../main')
const { DropTarget, NativeTypes } = require('../dnd')
const { ItemGrid, ItemTable } = require('../item')
const { ProjectSidebar } = require('./sidebar')
const { ProjectToolbar } = require('./toolbar')
const { blank, pick } = require('../../common/util')
const { array, bool, func, object, number } = require('prop-types')
const { isImageSupported } = require('../../constants/mime')
const { ITEM } = require('../../constants/sass')


class ProjectView extends React.Component {
  get size() {
    return ITEM.ZOOM[this.props.zoom]
  }

  get isEmpty() {
    return this.props.isEmpty &&
      !this.props.nav.trash &&
      this.props.items.length === 0
  }

  get isItemSortable() {
    if (this.props.nav.query === '' &&
      this.props.nav.list &&
      this.props.nav.sort[ this.props.nav.list ].column === 'added') {
      return true
    }
    return false
  }

  get maxZoom() {
    return ITEM.ZOOM.length - 1
  }

  get ItemIterator() {
    return this.props.zoom ? ItemGrid : ItemTable
  }

  get style() {
    return {
      flexBasis: `calc(100% - ${this.props.offset}px)`
    }
  }

  handleZoomChange = (zoom) => {
    this.props.onUiUpdate({ zoom })
  }

  handleItemImport = () => {
    return this.props.onItemImport({ list: this.props.nav.list })
  }

  handleSort = (sort) => {
    this.props.onSort({
      ...sort, list: this.props.nav.list || 0
    })
  }

  render() {
    const {
      isActive,
      canDrop,
      edit,
      isOver,
      items,
      keymap,
      nav,
      photos,
      tags,
      zoom,
      onItemCreate,
      onItemSelect,
      onSearch
    } = this.props

    const { size, maxZoom, ItemIterator, isEmpty, isItemSortable } = this

    return (
      <div id="project-view">
        <ProjectSidebar {...pick(this.props, ProjectSidebar.props)}
          isDisabled={!isActive}/>
        <div className="main">
          <section className="items" style={this.style}>
            <header>
              <ProjectToolbar
                count={items.length}
                canCreateItems={!nav.trash}
                isDisabled={!isActive}
                maxZoom={maxZoom}
                query={nav.query}
                zoom={zoom}
                onItemCreate={this.handleItemImport}
                onSearch={onSearch}
                onZoomChange={this.handleZoomChange}/>
            </header>

            <ItemIterator {...pick(this.props, ItemIterator.getPropKeys())}
              items={items}
              isEmpty={isEmpty}
              isItemSortable={isItemSortable}
              photos={photos}
              edit={edit.column}
              keymap={keymap.ItemIterator}
              list={nav.list}
              selection={nav.items}
              size={size}
              tags={tags}
              hasScrollbars={this.context.state.scrollbars}
              isDisabled={nav.trash}
              isOver={isOver && canDrop}
              onCreate={onItemCreate}
              onSelect={onItemSelect}
              onSort={this.handleSort}/>
            <div className="fake-gap"/>
          </section>
        </div>
      </div>
    )
  }

  static contextType = WindowContext

  static propTypes = {
    canDrop: bool,
    edit: object.isRequired,
    isActive: bool,
    isEmpty: bool.isRequired,
    isOver: bool,
    items: array.isRequired,
    keymap: object.isRequired,
    nav: object.isRequired,
    offset: number.isRequired,
    photos: object.isRequired,
    tags: object.isRequired,
    dt: func.isRequired,
    zoom: number.isRequired,
    onItemCreate: func.isRequired,
    onItemImport: func.isRequired,
    onItemSelect: func.isRequired,
    onItemTagAdd: func.isRequired,
    onSearch: func.isRequired,
    onSort: func.isRequired,
    onUiUpdate: func.isRequired
  }
}

const spec = {
  drop({ nav, onItemImport }, monitor) {
    let type = monitor.getItemType()
    let item = monitor.getItem()
    let files

    switch (type) {
      case NativeTypes.FILE:
        files = item.files.filter(isImageSupported).map(f => f.path)
        break
      case NativeTypes.URL:
        files = item.urls
        break
    }

    if (!blank(files)) {
      onItemImport({ files, list: nav.list })
      return { files }
    }
  },

  canDrop(_, monitor) {
    let type = monitor.getItemType()
    let item = monitor.getItem()

    switch (type) {
      case NativeTypes.FILE:
        return !!item.types.find(isImageSupported)
      default:
        return true
    }

  }
}

const collect = (connect, monitor) => ({
  dt: connect.dropTarget(),
  isOver: monitor.isOver(),
  canDrop: monitor.canDrop()
})

module.exports = {
  ProjectView: DropTarget([
    NativeTypes.FILE,
    NativeTypes.URL
  ], spec, collect)(ProjectView)
}
