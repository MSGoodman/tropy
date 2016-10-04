'use strict'

const React = require('react')

const { PropTypes, Component } = React
const { connect } = require('react-redux')
const { Editable } = require('./editable')
const { IconFolder } = require('./icons')
const { getChildren } = require('../selectors/list')
const { create, save, edit } = require('../actions/list')
const ui = require('../actions/ui')
const { noop } = require('../common/util')
const nav = require('../actions/nav')
const cn = require('classnames')


class List extends Component {

  static propTypes = {
    list: PropTypes.object,
    active: PropTypes.bool,
    context: PropTypes.bool,
    editing: PropTypes.bool,
    onActivate: PropTypes.func,
    onCancel: PropTypes.func,
    onContextMenu: PropTypes.func,
    onRename: PropTypes.func,
    onUpdate: PropTypes.func
  }

  static defaultProps = {
    onActivate: noop,
    onCancel: noop,
    onContextMenu: noop,
    onRename: noop,
    onUpdate: noop
  }

  update = (name) => {
    this.props.onUpdate(this.props.list.id, { name })
  }

  activate = () => {
    if (!this.props.active) {
      this.props.onActivate(this.props.list.id)
    }
  }

  rename = () => {
    this.props.onRename(this.props.list.id)
  }

  cancel = () => {
    this.props.onCancel(this.props.list)
  }

  popup = (event) => {
    this.props.onContextMenu(event, this.props.list.id)
  }

  render() {
    const { list, active, context, editing } = this.props

    return (
      <li
        className={cn({ list: true, active, context })}
        onContextMenu={this.popup}
        onClick={this.activate}>
        <IconFolder/>
        <div className="title">
          <Editable
            value={list.name}
            required
            editing={editing}
            onActivate={this.rename}
            onChange={this.update}
            onCancel={this.cancel}/>
        </div>
      </li>
    )
  }
}


const Lists = ({
  lists,
  selected,
  onUpdate,
  onCancel,
  onSelect,
  onRename,
  showListMenu,
  editing,
  context,
  parent
}) => (
  <ol className="lists">
    {
      lists.map(list => (
        <List
          key={list.id}
          active={selected === list.id}
          context={context === list.id}
          editing={editing && editing.id === list.id}
          list={list}
          onContextMenu={showListMenu}
          onUpdate={onUpdate}
          onActivate={onSelect}
          onRename={onRename}
          onCancel={onCancel}/>
      ))
    }
    {
      editing && editing.parent === parent ? (
        <List
          key={editing.parent}
          list={editing}
          editing
          onUpdate={onUpdate}
          onCancel={onCancel}/>
      ) : undefined
    }
  </ol>
)

Lists.propTypes = {
  lists: PropTypes.array,
  selected: PropTypes.number,
  context: PropTypes.number,
  parent: PropTypes.number.isRequired,
  editing: PropTypes.object,
  onCancel: PropTypes.func,
  onSelect: PropTypes.func,
  onRename: PropTypes.func,
  onUpdate: PropTypes.func,
  showListMenu: PropTypes.func
}

module.exports = {
  Lists: connect(

    () => {
      const children = getChildren()

      return (state, props) => ({
        selected: state.nav.list,
        context: (state.ui.context.scope === 'list') ?
          state.ui.context.event.target : undefined,
        editing: state.ui.edit.list,
        lists: children(state, props)
      })
    },

    (dispatch, props) => ({
      onCancel() {
        dispatch(ui.edit.cancel())
      },

      onSelect(list) {
        dispatch(nav.update({ list }))
      },

      onRename(id) {
        dispatch(edit({ id }))
      },

      onUpdate(id, values) {
        dispatch(ui.edit.cancel())
        dispatch(id ?
          save({ id, ...values }) :
          create({ ...values, parent: props.parent }))
      },

      showListMenu(event, target) {
        event.stopPropagation()
        dispatch(ui.context.show(event, 'list', target))
      }
    })

  )(Lists)
}
