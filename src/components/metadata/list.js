'use strict'

const React = require('react')
const xor = require('lodash/xor')
const { NewMetadataField, MetadataField } = require('./field')
const { get } = require('../../common/util')

const { arrayOf, bool, func, object, shape, string } =  require('prop-types')


class MetadataList extends React.PureComponent {
  get isBulk() {
    return this.props.fields.key === 'bulk'
  }

  get isEmpty() {
    return this.props.fields.length === 0
  }

  get isEditAndFieldsEqual() {
    let fieldsId = []
    if (this.props.edit != null && this.props.edit.id) {
      if (this.props.fields.id.constructor === Array) {
        fieldsId = [...this.props.fields.id]
      } else {
        fieldsId[0] = this.props.fields.id
      }
      return xor(this.props.edit.id, fieldsId).length === 0
    }
    return false
  }

  get hasNewMetadataField() {
    return this.isEditAndFieldsEqual && this.props.edit.property == null
  }

  indexOf(id) {
    const { fields } = this.props
    return (fields.idx != null) ?
      fields.idx[id] :
      fields.findIndex(f => f.property.id === id)
  }

  first() {
    return this.props.fields[0]
  }

  last() {
    return this.props.fields[this.props.fields.length - 1]
  }

  next(offset = 1) {
    const { fields } = this.props
    if (!fields.length) return null

    if (this.head == null) {
      return (offset < 0) ? this.last() : this.first()
    }

    const idx = this.indexOf(this.head) + offset
    return (idx >= 0 && idx < fields.length) ? fields[idx] : null
  }

  prev(offset = 1) {
    return this.next(-offset)
  }

  current() {
    return this.next(0)
  }

  isEditing(property) {
    let { key } = this.props.fields
    if (key != null && key === get(this.props.edit, [property])) {
      this.head = property
      return true
    } else {
      return false
    }
  }

  edit = (property) => {
    this.props.onEdit({ field: { [property]: this.props.fields.key } })
  }

  handleChange = (data, hasChanged) => {
    if (hasChanged || this.isBulk) {
      this.props.onChange({ id: this.props.fields.id, data })
    } else {
      this.props.onEditCancel()
    }
  }

  handleNext = () => {
    const next = this.next()
    if (next != null) this.edit(next.property.id)
    else this.props.onAfter()
  }

  handlePrev = () => {
    const prev = this.prev()
    if (prev != null) this.edit(prev.property.id)
    else this.props.onBefore()
  }

  handleFieldCreate = (property) => {
    let id = this.props.fields.id
    this.props.onCreate({ id, property })
  }


  render() {
    this.head = null
    return (
      <ol className="metadata-fields">
        {this.props.fields.map(({ property, value, type, ...props }) =>
          <MetadataField {...props}
            key={property.id}
            id={this.props.fields.id}
            isDisabled={this.props.isDisabled}
            isEditing={this.isEditing(property.id)}
            isMixed={!!value.mixed}
            property={property}
            text={value.text}
            type={value.type || type}
            onContextMenu={this.props.onContextMenu}
            onCopy={this.props.onCopy}
            onChange={this.handleChange}
            onEdit={this.edit}
            onEditCancel={this.props.onEditCancel}
            onNext={this.handleNext}
            onPrev={this.handlePrev}/>
        )}
        {this.hasNewMetadataField &&
          <NewMetadataField
            options={this.props.options}
            onCreate={this.handleFieldCreate}
            onEditCancel={this.props.onEditCancel}/>}
      </ol>
    )
  }

  static propTypes = {
    isDisabled: bool,
    edit: object,
    fields: arrayOf(shape({
      isExtra: bool.isRequired,
      isRequired: bool,
      label: string,
      property: object.isRequired,
      value: object
    })).isRequired,
    options: arrayOf(object).isRequired,
    onAfter: func.isRequired,
    onBefore: func.isRequired,
    onEdit: func,
    onEditCancel: func,
    onContextMenu: func,
    onCopy: func.isRequired,
    onChange: func.isRequired,
    onCreate: func
  }

  static defaultProps = {
    options: []
  }
}


module.exports = {
  MetadataList
}
