import reducer from '../../../app/assets/javascripts/reducers/plots_reducer';
import { plot as testPlot } from '../fixtures/all_manifests_response';

describe('plots reducer', () => {
  const initialState = {
    plotsMap: {},
    selected: null,
    isEditing: false,
    selectedPoints: []
  };

  it('should return the initial state', () => {
    expect(reducer(undefined, {})).toEqual(initialState);
  });

  it('should handle SELECT_PLOT', () => {
    expect(
      reducer(initialState, {
        type: 'SELECT_PLOT',
        id: 3
      })
    ).toEqual({
      plotsMap: {},
      selected: 3,
      isEditing: false,
      selectedPoints: []
    });
  });

  it('should handle TOGGLE_PLOT_EDITING without isEditing boolean', () => {
    expect(
      reducer(initialState, {
        type: 'TOGGLE_PLOT_EDITING'
      })
    ).toEqual({
      plotsMap: {},
      selected: null,
      isEditing: true,
      selectedPoints: []
    });
  });

  it('should handle TOGGLE_PLOT_EDITING with isEditing boolean', () => {
    expect(
      reducer({isEditing: false}, {
        type: 'TOGGLE_PLOT_EDITING',
        isEditing: true
      })
    ).toEqual({
      plotsMap: {},
      selected: null,
      isEditing: true,
      selectedPoints: []
    });
  });

  it('should handle ADD_PLOT ', () => {
    expect(
      reducer(undefined, {
        type: 'ADD_PLOT',
        plot: testPlot
      })
    ).toEqual({
      plotsMap: { [testPlot.id]: testPlot },
      selected: null,
      isEditing: false,
      selectedPoints: []
    });
  });

  it('should handle REMOVE_PLOT ', () => {
    expect(
      reducer({ plotsMap: { [testPlot.id]: testPlot }}, {
        type: 'REMOVE_PLOT',
        id: [testPlot.id]
      })
    ).toEqual({
      plotsMap: {},
      selected: null,
      isEditing: false,
      selectedPoints: []
    });
  });

  it('should handle UPDATE_PLOT ', () => {
    const updatedPlot = {
      ...testPlot,
      name: 'changed',
      random: 'property'
    };

    expect(
      reducer({ plotsMap: { [testPlot.id]: testPlot }}, {
        type: 'UPDATE_PLOT',
        plot: updatedPlot
      })
    ).toEqual({
      plotsMap: { 3: updatedPlot },
      selected: null,
      isEditing: false,
      selectedPoints: []
    });
  });
});