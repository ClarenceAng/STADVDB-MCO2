import React from 'react'
import { CFooter } from '@coreui/react'

const AppFooter = () => {
  return (
    <CFooter className="px-4">
      <div>
        <span className="ms-1">MCO2 - Group 8</span>
      </div>
      <div className="ms-auto">
        <span className="me-1">Based on</span>
        <a
          href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          target="_blank"
          rel="noopener noreferrer"
        >
          ( ͡° ͜ʖ ͡°)
        </a>
      </div>
    </CFooter>
  )
}

export default React.memo(AppFooter)
