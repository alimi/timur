import { createSelector } from 'reselect';
import { PLOTS } from '../components/plots/plot';
import { mapObject } from '../utils/types';

export const newPlot = () => {
  let date = new Date();
  let plot = {
    id: 0,
    access: 'private',
    name: null,
    script: '',
    configuration: {
      layout: {
        height: 200,
        margin: { top: 30, bottom: 30, left: 30, right: 30 }
      },
      plot_series: [],
      plot_type: null
    },
    created_at: date.toString(),
    updated_at: date.toString()
  };
  return plot;
}

export const getSelectedPlotId = state => {
  return state.plots.selected;
};

/*
  boxplot
  barplot
  stackedbar
  histogram
  swarm
  scatter
  heatmap
*/

// script addendum helpers
export const varName = (name, vname) => `${name}____${vname}`;

export const seriesVars = (plot_series, vname) =>
  plot_series.map((s, index) => `@${varName(`series${index}`, vname)}`);

const scriptBlock = (name, vars) =>
  Object.keys(vars)
    .map(v => `@${varName(name, v)} = ${vars[v]}`)
    .join('\n');

const getConsignmentVars = (name, varnames, consignment) =>
  varnames.reduce((vars, v) => {
    vars[v] = consignment[varName(name, v)];
    return vars;
  }, {});

/* These are the three types of additions we make to the original plot script
 * inputs - for each varname, value, adds @varname = value (e.g. for @record_name)
 * series - for each series { name, variables: { varname: expression, ... } },
 *   adds @name____varname = expression
 * plot - for the given plot_type, add whatever variables the plot requires
 */

const inputAddendum = inputs =>
  Object.keys(inputs)
    .map(i => `@${i} = '${inputs[i]}'`)
    .join('\n');

// the basic variables required for each series (e.g. { x, y })
const seriesAddendum = (plot_type, plot_series) => !plot_series ? '' :
  plot_series.map(({ variables, series_type }, index) =>
    scriptBlock(
      `series${index}`,
      {
        ...variables,
        ...seriesTypeAddendum(
          plot_type, series_type, index
        )
      }
    )
  ).join('\n');

const validPlot = (plot_type) => plot_type && PLOTS[plot_type];

const seriesConfig = (plot_type, series_type) =>
  (validPlot(plot_type) && series_type &&
    series_type in PLOTS[plot_type].series_types) ? PLOTS[plot_type].series_types[series_type] : {};

const seriesTypeAddendum = (plot_type, series_type, index) => {
  let { computed } = seriesConfig(plot_type, series_type);
  return computed ? mapObject(computed, (k,func) => func(index)) : '';
}

// plot-specific calculations to be added to the manifest
const plotAddendum = (plot_type, plot_series) =>
  !(plot_series && validPlot(plot_type)) ? '' :
    scriptBlock(
      plot_type,
      mapObject(PLOTS[plot_type].computed, (name,func) => func(plot_series))
    );

// computes the data variables to be added to the consignment
const plotScript = (plot, inputs) => {
  if (!plot) return plot;

  let {
    script,
    plot_type,
    configuration: { plot_series }
  } = plot;

  return [
    inputAddendum(inputs),
    script,
    seriesAddendum(plot_type, plot_series),
    plotAddendum(plot_type, plot_series)
  ].join('\n');
};

/*
 * This undoes the work of the addendums - i.e., it finds the
 * correspondingly-named values in the consignment and binds them into the
 * original plot_series hash (replacing the expression)
 */

// the consignment data bound back into a series list
const bindSeriesData = (
  plot_type,
  { name, variables, series_type },
  varName,
  consignment
) => {
  let { computed={} } = seriesConfig(plot_type, series_type);
  return {
    name,
    series_type,
    variables: {
      ...getConsignmentVars(varName, Object.keys(variables), consignment),
      ...getConsignmentVars(varName, Object.keys(computed), consignment)
    }
  }
};

// bind the consignment variables back into the plot
const bindPlotData = (plot_type, consignment) =>
  plot_type && consignment && plot_type in PLOTS
    ? getConsignmentVars(plot_type, Object.keys(PLOTS[plot_type].computed), consignment)
    : {};

export const plotData = (
  { configuration: { plot_series }, plot_type },
  consignment
) =>
  plot_series
    ? {
        plot_series: plot_series.map((series, index) =>
          bindSeriesData(plot_type, series, `series${index}`, consignment)
        ),
        ...bindPlotData(plot_type, consignment)
      }
    : {};

// this strange return value is because reselect doesn't let us have optional args
const selectPlotById = (state, plot_id, inputs) =>
  plot_id ? [state.plots.plotsMap[plot_id], inputs] : [];

export const plotWithScript = ([plot, inputs]) => (
  plot ? {
  ...plot,
  plotScript: plotScript(plot, inputs)
} : null);

export const selectPlot = createSelector(
  selectPlotById,
  plotWithScript
);

export const getAllPlots = state => {
  return Object.values(state.plots.plotsMap);
};

export const getPlotsByManifestId = (state, manifestId) => {
  return getAllPlots(state).filter(plot => {
    return plot.manifestId === manifestId;
  });
};

export const getSelectedPlot = state => {
  if (state.plots.selected > 0) {
    return state.plots.plotsMap[state.plots.selected];
  }

  /*
   * If the selected id is equal to 0 then retrun a new plot. The access is hard
   * set to 'private' on the server for now.
   */
  if (state.plots.selected == 0) {
    return {
      id: 0,
      name: null,
      user_id: null,
      manifest_id: null,
      project: null,
      access: 'private',
      plot_type: null,
      data: [],
      is_editable: true,
      layout: {
        height: 0,
        width: 0
      },
      config: {
        displayModeBar: true,
        modeBarButtonsToRemove: [
          'sendDataToCloud',
          'lasso2d',
          'toggleSpikelines'
        ],
        showLink: false
      }
    };
  }

  /*
   * If there is no specified plot and we are not requesting a new
   * plot (id == 0) then return null, and clear the screen.
   */
  return null;
};
