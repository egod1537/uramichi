import React from 'react'

class Logo extends React.Component {
  render() {
    const logoSize = this.props.size || 32
    return <img src="/favicon.svg" alt="uramichi" width={logoSize} height={logoSize} />
  }
}

export default Logo
