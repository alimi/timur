# This task extracts the view data from the Timur database and places it into 
# files for later consumption.

namespace :timur do

  desc 'Extract the old view models from the Timur database.'
  task :extract_old_db_views, [:directory] => [:environment] do |t, args|

    file_name_tabs = "#{args[:directory]}/view_tabs.csv"
    file_name_panes = "#{args[:directory]}/view_panes.csv"
    file_name_attributes = "#{args[:directory]}/view_attributes.csv"

    tabs = []
    panes = {}
    attributes = []

    ViewPane.all.each do |record|
      tabs = add_tab(record, tabs)
    end

    ViewPane.all.each do |record|
      panes = add_pane(record, tabs, panes)
    end

    panes = flatten_and_index_panes(panes)

    ViewPane.all.each do |record|
      record.view_attributes.each_with_index do |attribute, index|
        attributes = add_attribute(record, panes, attributes, attribute)
      end
    end

    attributes = flatten_and_index_attributes(attributes)

    write_view_files(
      tabs,
      panes,
      attributes,
      file_name_tabs,
      file_name_panes,
      file_name_attributes
    )
  end
end

def write_view_files(tabs, panes, attributes, file_name_tabs, file_name_panes, file_name_attributes)

  begin
    file = File.open(file_name_tabs, 'w')

    tab_header = [
      'id',
      'name',
      'title',
      'description',
      'project',
      'model',
      'index_order'
    ]

    file.write(tab_header.join(', '))
    file.write("\n")
    tabs.each do |tab|
      file.write(tab.join(', '))
      file.write("\n")
    end
  ensure
    file.close
  end

  begin
    file = File.open(file_name_panes, 'w')

    pane_header = [
      'id',
      'view_tab_id',
      'name',
      'title',
      'description',
      'index_order',
      'project',
      'model',
      'tab'
    ]

    file.write(pane_header.join(', '))
    file.write("\n")
    panes.each do |pane|
      file.write(pane.join(', '))
      file.write("\n")
    end
  ensure
    file.close
  end

  begin
    file = File.open(file_name_attributes, 'w')

    attributes_header = [
      'id',
      'view_pane_id',
      'manifest_id',
      'name',
      'title',
      'description',
      'attribute_class',
      'index_order',
      'project',
      'model',
      'tab',
      'pane'
    ]

    file.write(attributes_header.join(', '))
    file.write("\n")
    attributes.each do |attribute|
      file.write(attribute.join(', '))
      file.write("\n")
    end
  ensure
    file.close
  end
end

def flatten_and_index_attributes(attributes)

  # Group the attributes by their pane ids
  attributes_by_pane = {}
  attributes.each_with_index do |attribute, index|

    attribute[0] = index # Add an id

    if !attributes_by_pane.key?(attribute[1])
      attributes_by_pane[attribute[1]] = []
    end
    attributes_by_pane[attribute[1]].push(attribute)
  end

  # Now that the attributes are grouped we can add the index_order.
  attributes_by_pane.each do |pane_id, attributes|
    attributes.each_with_index do |attribute, index|
      attribute[7] = index # Add an index_order
    end
  end

  return attributes
end

def flatten_and_index_panes(panes)
  temp_panes = []

  # At this point the panes should be sorted by their tabs.
  panes.each do |key, value|
    value.each_with_index do |pane, index|
      pane[5] = index # Add the index_order
      temp_panes.push(pane)
    end
  end

  temp_panes.each_with_index do |pane, index|
    pane[0] = index # Add a view_pane_id
  end

  return temp_panes
end

def add_attribute(record, panes, attributes, attribute)
  # Extract pane id from the panes.
  view_panes = panes.select do |pane|
    pane[-3] == record[:project_name] &&
    pane[-2] == record[:view_model_name] &&
    pane[-1] == record[:tab_name]
  end

  view_pane = view_panes.select do |pane|
    pane[2] == record[:name] &&
    pane[3] == record[:title]
  end

  view_pane_id = view_pane[0][0]

  if attribute.plot != nil
    binding.pry
  end

  attributes.push([
    nil,                         # id
    view_pane_id,                # view_pane_id
    nil,                         # manifest_id
    attribute[:name],            # name
    attribute[:display_name],    # title
    nil,                         # description
    attribute[:attribute_class], # attribute_class
    nil,                         # index_order

    record[:project_name],       # project
    record[:view_model_name],    # model
    record[:tab_name],           # tab
    view_pane[0][2]              # pane
  ])

  return attributes
end

def add_pane(record, tabs, panes)

  pane_key = "#{record[:project_name]}-#{record[:view_model_name]}-"\
"#{record[:tab_name]}"
  
  if !panes.key?(pane_key)
    panes[pane_key] = []
  end

  # Extract the matching tab id for the pane.
  view_tab = tabs.select do |tab|
    tab[1] == record[:tab_name] &&
    tab[4] == record[:project_name] &&
    tab[5] == record[:view_model_name]
  end
  view_tab_id = view_tab[0][0]

  pane = [
    nil,                      # id
    view_tab_id,              # view_tab_id
    record[:name],            # name
    record[:title],           # title
    record[:description],     # description
    nil,                      # index_order

    record[:project_name],    # project
    record[:view_model_name], # model
    record[:tab_name]         # tab
  ]

  panes[pane_key].push(pane)

  return panes
end

def add_tab(record, tabs)
  db_tab = [
    nil,                      # id
    record.tab_name,          # name
    '',                       # title
    '',                       # description
    record.project_name,      # project
    record.view_model_name,   # model
    0                         # index_order
  ]

  # Loop the saved tabs and increment the index_order for any possible
  # addtions based upon the project name and model name.
  tabs.each do |local_tab|

    if(
      local_tab[4] == db_tab[4] &&
      local_tab[5] == db_tab[5]
    )

      db_tab[-1] = db_tab[-1] + 1
    end
  end

  # Loop the saved tabs and check if the incoming tab (db_tab) is a
  # duplicate based upon name, project and model.
  tab_exists = false
  tabs.each do |local_tab|

    if(
      local_tab[1] == db_tab[1] &&
      local_tab[4] == db_tab[4] &&
      local_tab[5] == db_tab[5]
    )

      tab_exists = true
    end
  end

  # If the tabs array is empty or if the item does not yet exist then add
  # the item to the master tab array.
  if !tab_exists || tabs.length == 0
    db_tab[0] = tabs.length # Add an id to the tab.
    tabs.push(db_tab)
  end

  return tabs
end