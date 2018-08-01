export interface HashParams {
  profileURL?: string
  title?: string
  localProfilePath?: string
}

export function getHashParams(hashContents = window.location.hash): HashParams {
  try {
    if (!hashContents.startsWith('#')) {
      return {}
    }
    const components = hashContents.substr(1).split('&')
    const result: HashParams = {}
    for (const component of components) {
      let [key, value] = component.split('=')
      value = decodeURIComponent(value)
      if (key === 'profileURL') {
        result.profileURL = value
      } else if (key === 'title') {
        result.title = value
      } else if (key === 'localProfilePath') {
        result.localProfilePath = value
      }
    }
    return result
  } catch (e) {
    console.error(`Error when loading hash fragment.`)
    console.error(e)
    return {}
  }
}
