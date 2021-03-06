'use strict'

const { Database } = require('../common/db')
const { ipcRenderer: ipc } = require('electron')
const { fail, save } = require('../dialog')
const { PROJECT, WIZARD } = require('../constants')
const { create } = require('../models/project')
const { unlink } = require('fs').promises
const { info, warn } = require('../common/log')

async function rm(file) {
  try {
    await unlink(file)
  } catch (e) {
    if (e.code !== 'ENOENT') throw e
  }
}

module.exports = {
  complete(payload, meta = {}) {
    return async () => {
      try {
        let { file, name, base } = payload
        info(`creating new project ${name} in ${file}`)

        if (meta.truncate) await rm(file)

        file = await Database.create(file, create, { name, base })
        ipc.send(PROJECT.CREATED, { file })

      } catch (e) {
        warn(e)
        await fail(e, PROJECT.CREATED)
        if (meta.truncate) await rm(payload.file)
      }
    }
  },

  project: {
    update(payload) {
      return {
        type: WIZARD.PROJECT.UPDATE,
        payload
      }
    },

    save(payload) {
      return async (dispatch) => {
        let file = await save.project({ defaultPath: payload })
        if (file) {
          dispatch(module.exports.project.update({ file }))
        }
      }
    }
  }
}
