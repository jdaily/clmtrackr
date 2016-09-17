import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';

import Drawer from 'material-ui/Drawer';
import MenuItem from 'material-ui/MenuItem';

import { EXAMPLES, setExample } from 'clmtrackr/examples/reducers/examples';

import './MenuDrawer.styl';


class MenuDrawer extends React.Component {
  render () {
    const menuItems = EXAMPLES.map((example, i) =>
      <MenuItem
        className={classNames({
          selected: example.id === this.props.selectedExample
        })}
        onClick={() => this.props.setExample(example)}
        key={i}
      >
        {example.name}
      </MenuItem>
    );

    return (
      <div className='menu-drawer-cmpt'>
        <Drawer open={true}>
          <div className='section-header'>Examples</div>
          {menuItems}
        </Drawer>
      </div>
    );
  }
}

MenuDrawer.propTypes = {
  selectedExample: PropTypes.string,
  setExample: PropTypes.func.isRequired
};

const mapStateToProps = state => {
  return {
    selectedExample: state.examples.activeExample
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setExample: example => dispatch(setExample(example))
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(MenuDrawer);
