import React, {Component} from 'react';
import { flatten } from '../../../utils/types';
import * as d3 from 'd3';
import Bars from './bars';
import Boxes from './boxes';
import Beeswarms from './beeswarms';
import PlotCanvas from '../plot_canvas';
import { seriesVars, varName } from '../../../selectors/plot_selector';

export const CategoryConfig = {
  name: 'category',
  label: 'Category Plot',
  computed: {
    domain: plot_series => {
      let all_values = seriesVars(plot_series, 'value').join(', ');
      return `[ min( concat( ${all_values})), max( concat( ${all_values})) ]`;
    }
  },

  series_types: {
    bar: {
      variables: {
        value: 'expression',
        category: 'expression',
        color: 'color_type'
      },
      component: Bars
    },
    box: {
      variables: {
        value: 'expression', category: 'expression', color: 'color_type'
      },
      component: Boxes
    },
    beeswarm: {
      variables: {
        value: 'expression', category: 'expression', color: 'color_type'
      },
      computed: {
        beeswarm: index => `beeswarm(@${varName(
          `series${index}`, 'value'
        )})`
      },
      component: Beeswarms
    }
  }
};

const SeriesComponent = ({ series, index, count, xScale, ...props}) => {
  let Component = SERIES_COMPONENTS[series.series_type];

  let width = (xScale.bandwidth() - (4 * count-1))/ count;
  let offset = (width + 4) * index;

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

    let {parent_width, layout, data}=this.props;
    let { domain, plot_series } = data;

    let categories = flatten(plot_series.map(s => s.variables.category.values));

    if (!domain || !categories) return null;

    return(
      <div>
        <PlotCanvas
          component={ SeriesComponent }
          layout={ layout }
          parent_width={ parent_width }
          xdomain={ categories }
          ydomain={ domain.values }
          plot_series={ plot_series }
        />
     </div>
    );
  }
}
