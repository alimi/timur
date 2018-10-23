export const selectView = (state, model_name) => (
  state.timur.views
  ? state.timur.views[model_name]
  : null
)

export const getAttributes = (tab)=>{
  let {panes} = tab;
  let attributes = Object.values(panes).reduce(
    (collect,{attributes}) => collect.concat(Object.keys(attributes)),
    []
  )
  return (attributes.length <= 0) ? 'all' : attributes;
};

export const getPlotIds = (tab)=>{
  let { panes } = tab;

  // Loop down on the tab object and extract the manifest ids.
  let plot_ids = Object.values(panes).reduce(
    ({attributes})=> Object.values(attributes).map(attr=>attr.plot_ids)
  );

  // Flatten.
  plot_ids = [].concat.apply([], plot_ids);

  // Compact.
  plot_ids = plot_ids.filter(item=>(item != undefined && item != null));

  return plot_ids;
};


export const getTabByIndexOrder = (view, order)=>
  Object.values(view.tabs).find(
    tab => tab.index_order == order
  );

/*
 * There is a correlation between the Timur view model attributes and the Magma
 * model attributes. When we want to render the attributes we interleave the two
 * models and then can display the totality of the information they represent.
 * Timur view models keep the layout and order, Magma data models keep the data
 * type and editability.
 *
 * See `/app/models/view_tab.rb` over in the server code for an idea about the 
 * tab structure.
 */
export const interleaveAttributes = (tab, template)=>{
  let { panes, ...tab_props } = tab;
  let attributes = {};

  let new_tab = {
    ...tab_props,

    panes: Object.keys(panes).reduce((new_panes, pane_name)=>{
      let pane = panes[pane_name];
      let { attributes, ...pane_props } = pane;

      attributes = { ...attributes };

      // if there are no pane attributes show the whole template
      if (Object.keys(pane.attributes).length == 0) {
        attributes = { ...template.attributes };
      } else {
        // expand any attributes which are in the template
        Object.keys(pane.attributes).filter(attr_name=>attr_name in template.attributes).forEach(
          attr_name => {
            let view_attribute = pane.attributes[attr_name];
            let template_attribute = template.attributes[attr_name];

            // Interleave the attribute properties and set it back on the pane.
            attributes[attr_name] = {
              ...template_attribute,
              ...view_attribute,
              attribute_class: view_attribute.attribute_class || template_attribute.attribute_class,
              editable: true
            };
          }
        );
      }

      return {
        ...new_panes,
        [pane_name]: { attributes, ...pane_props }
      }
    }, {})
  };

  return new_tab;
}
