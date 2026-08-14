import storage from '@system.storage'

/**
 * 读取本地持久化缓存
 * @param {string} key
 * @param {any} defaultValue
 * @returns {Promise<any>}
 */
export function getStorage(key, defaultValue = null) {
  return new Promise((resolve) => {
    storage.get({
      key,
      default: defaultValue,
      success: function (data) {
        if (data === undefined || data === null || data === '') {
          resolve(defaultValue)
          return
        }
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          resolve(data)
        }
      },
      fail: function () {
        resolve(defaultValue)
      }
    })
  })
}

/**
 * 写入本地持久化存储
 * @param {string} key
 * @param {any} value
 * @returns {Promise<boolean>}
 */
export function setStorage(key, value) {
  return new Promise((resolve) => {
    const dataStr = typeof value === 'object' ? JSON.stringify(value) : String(value)
    storage.set({
      key,
      value: dataStr,
      success: function () {
        resolve(true)
      },
      fail: function () {
        resolve(false)
      }
    })
  })
}

/**
 * 删除本地持久化存储键
 * @param {string} key
 * @returns {Promise<boolean>}
 */
export function deleteStorage(key) {
  return new Promise((resolve) => {
    storage.delete({
      key,
      success: function () {
        resolve(true)
      },
      fail: function () {
        resolve(false)
      }
    })
  })
}

/**
 * 清空所有本地存储
 * @returns {Promise<boolean>}
 */
export function clearStorage() {
  return new Promise((resolve) => {
    storage.clear({
      success: function () {
        resolve(true)
      },
      fail: function () {
        resolve(false)
      }
    })
  })
}
