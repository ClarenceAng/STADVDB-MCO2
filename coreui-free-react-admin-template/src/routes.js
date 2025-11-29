import React from 'react'

const Node2 = React.lazy(() => import('./views/nodes/Node2'))
const Node3 = React.lazy(() => import('./views/nodes/Node3'))

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/node2', name: 'Dashboard', element: Node2 },
  { path: '/node3', name: 'Dashboard', element: Node3 },
]

export default routes
