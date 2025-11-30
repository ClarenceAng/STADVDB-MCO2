import React from 'react'

const Node1 = React.lazy(() => import('./views/nodes/Node1'))
const Node2 = React.lazy(() => import('./views/nodes/Node2'))
const Node3 = React.lazy(() => import('./views/nodes/Node3'))

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/node1', name: 'All Movies and Shows', element: Node1 },
  { path: '/node2', name: 'Movies and Misc', element: Node2 },
  { path: '/node3', name: 'TV Shows', element: Node3 },
]

export default routes
