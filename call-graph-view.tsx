import {h, Component} from 'preact'
import {itMap, lastOf} from './utils'
import {LaidOutCallGraph, CallGraph} from './call-graph'

interface CallGraphViewProps {
  callGraph: CallGraph
  laidOutCallGraph: LaidOutCallGraph
}

export class CallGraphView extends Component<CallGraphViewProps, {}> {
  render() {
    const {callGraph, laidOutCallGraph} = this.props
    const {levels, nodePositions, edgePaths, ranks} = laidOutCallGraph

    const height = levels.length * 100
    const width = levels.reduce((max: number, level: any[]) => Math.max(level.length, max), 0) * 230

    return (
      <div style={{overflow: 'scroll', height: '100vh', width: '100vw'}}>
        <svg style={{flex: 1}} height={height} width={width}>
          {levels.map(level => {
            return (
              <g>
                {level.map(node => {
                  if (!node.vertex) return null
                  const pos = nodePositions.get(node)
                  if (!pos) throw new Error(`Failed to retrieve position for node ${node}`)
                  return (
                    <g transform={`translate(${pos.left()}, ${pos.top()})`}>
                      <rect
                        x={0}
                        y={0}
                        width={pos.width()}
                        height={pos.height()}
                        style={{
                          strokeWeight: 2,
                          stroke: '#00FF00',
                          fill: '#FFFFFF',
                        }}
                      />
                      <text
                        style={{
                          'alignment-baseline': 'hanging',
                          'font-size': '10px',
                        }}
                        fill="#000000"
                      >
                        {' '}
                        {`${ranks.get(node.vertex)}: ${lastOf(node.vertex.frame.name.split('/'))}`}
                      </text>
                    </g>
                  )
                })}
              </g>
            )
          })}
          {Array.from(
            itMap(callGraph.getEdges(), e => {
              const path = edgePaths.get(e) || ''
              return (
                <path
                  d={path}
                  style={{
                    strokeWeight: 2,
                    stroke: '#000000',
                    fill: 'none',
                  }}
                />
              )
            }),
          )}
        </svg>
      </div>
    )
  }
}
