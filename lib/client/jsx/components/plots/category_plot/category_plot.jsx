import React, {Component} from 'react';
import { flatten } from '../../../utils/types';
import * as d3 from 'd3';
import Bars from './bars';
import StackedBars from './stacked_bars';
import Boxes from './boxes';
import Swarms from './swarms';
import PlotCanvas from '../plot_canvas';
import { empty, validDomain } from '../plot';

const COMPONENTS = {
  bar: Bars,
  stackedbar: StackedBars,
  box: Boxes,
  swarm: Swarms
};

export const categoryGroups = (category, value, groupFunc)=>{
  let category_names = [...new Set(category.values)];

  return category_names.map((category_name, index)=>{
    let indexes = category.which(c => c == category_name).filter(i=>i!= null);
    let category_values = value(indexes).filter(i=>i!=null).sort((a,b)=>a-b);
    return groupFunc(category_name, category_values);
  });
};


const SeriesComponent = ({ series, index, count, gutter, gap, xScale, ...props}) => {
  let Component = COMPONENTS[series.series_type];

  // the basic width cuts the bandwidth into even strips for each series
  //
  let gutter_size = empty(gutter) ? 8 : parseInt(gutter);
  let gap_size = empty(gap) ? 4 : parseInt(gap);
  let width = Math.max(
    4,
    xScale.bandwidth() / count - (gap_size * (count-1) + 2*gutter_size)/ count
  );
  let offset = gutter_size + (width + gap_size) * index;
  return (
    Component && <Component
      xScale={xScale}
      width={width}
      offset={offset}
      series={series}
      { ...props }
    />
  );
}

export default class CategoryPlot extends Component{
  constructor(props){
    super(props);
    this.xScale = d3.scaleBand();
  }

  scale(axis) {
    return axis.values[0] instanceof Date ? d3.scaleTime() : d3.scaleLinear();
  }


  render(){

    let {parent_width, layout, config_variables={}, data}=this.props;
    let { domain, plot_series } = data;
    let { value_min, value_max, gap, gutter } = config_variables;

    let categories = flatten(plot_series.map(s => s.variables.category.values));

    if (!domain || !categories) return null;

    return(
      <PlotCanvas className='category-plot'
        component={ SeriesComponent }
        layout={ layout }
        parent_width={ parent_width }
        xdomain={ categories }
        ydomain={ validDomain(value_min,value_max,domain) }
        plot_series={ plot_series }
        gutter={ gutter }
        gap={ gap }
      />
    );
  }
}
