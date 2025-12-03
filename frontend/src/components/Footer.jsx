import React from 'react'
import './Footer.css'

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-left">
          <span>© Copyright All Rights Reserved</span>
        </div>
        <div className="footer-right">
          <span>Website by Tom and Ben Gladney</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
