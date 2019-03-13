import React, {Component} from 'react';

const Legend = ({labels}) =>
  <div className='legend-container'>
    {
      Object.keys(labels).map(label =>
        <div key={ label } className='category-group'>
          <div className='label-rect' style={{background: labels[label].color}}/>
          <div className='label-text'>{labels[label].text}</div>
        </div>
      )
    }
  </div>;

export default Legend;
