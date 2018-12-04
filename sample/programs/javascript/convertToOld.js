/*
* This script is used to reconstruct an cpu profile from chrome with an old format
* still used in nodejs with v8-profiler
*/
const fs = require('fs')

const data = JSON.parse(fs.readFileSync('../../profiles/Chrome/65/simple.cpuprofile').toString())

const _convertTimeDeltas = (profile) => {
  if (!profile.timeDeltas) return null
  let lastTimeUsec = profile.startTime
  const timestamps = new Array(profile.timeDeltas.length + 1)
  for (let i = 0; i < profile.timeDeltas.length; ++i) {
    timestamps[i] = lastTimeUsec
    lastTimeUsec += profile.timeDeltas[i]
  }
  timestamps[profile.timeDeltas.length] = lastTimeUsec
  return timestamps
}

const reformatNode = node => {
  if (!node.children) node.children = []

  node.children = node.children.map(childID => {
    if (typeof childID !== 'number') return childID
    const childNode = data.nodes.find(node => node.id === childID)
    if (typeof childNode !== 'object') return null
    childNode.callUID = node.id
    return childNode
  })
  return {
    functionName: node.callFrame.functionName,
    url: node.callFrame.url,
    lineNumber: node.callFrame.lineNumber,
    callUID: node.callUID,
    bailoutReason: '',
    id: node.id,
    scriptId: 0,
    hitCount: node.hitCount,
    children: node.children.map(reformatNode)
  }
}

// reformat then only keep the root as top level node
const nodes = data.nodes
  .map(reformatNode)
  .filter(node => node.functionName === '(root)')[0]

// since it can be undefined, create an array so execution still works
if (!data.timeDeltas) {
  data.timeDeltas = []
}

fs.writeFileSync('./new.cpuprofile', JSON.stringify({
  head: nodes,
  startTime: Math.floor(data.startTime / 1000000),
  endTime: Math.floor(data.endTime / 1000000),
  samples: data.samples,
  timestamps: _convertTimeDeltas(data)
}))
