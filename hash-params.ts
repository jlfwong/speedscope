export interface HashParams {
  profileURL?: string
  title?: string
}

export default function getHashParams(): HashParams {
  try {
    const hashContents = window.location.hash
    if (!hashContents.startsWith('#')) {
      return {}
    }
    const components = hashContents.substr(1).split('&')
    const result: HashParams = {}
    for (const component of components) {
      let [key, value] = component.split('=')
      if (key === 'profileURL') {
        result.profileURL = decodeURIComponent(value)
      } else if (key === 'title') {
        result.title = decodeURIComponent(value)
      }
    }
    return result
  } catch (e) {
    console.error(`Error when loading hash fragment.`)
    console.error(e)
    return {}
  }
}
