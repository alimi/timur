class BrowseController < Timur::Controller
  def index
    response = Magma::Client.instance.query(
      token,
      @params[:project_name],
      [ :project, '::first', '::identifier' ]
    )

    query = JSON.parse(
      response.body,
      symbolize_names: true
    )

    return redirect_to(
      route_url(
        :browse_model,
        project_name: @params[:project_name],
        model_name: 'project',
        record_name: query[:answer]
      )
    )
  rescue Magma::ClientError => e
    raise Etna::ServerError, 'Could not contact magma'
  end

  def activity
    @activities = Activity.order(created_at: :desc).limit(50).map do |activity|
      {
        date: activity.created_at,
        user: activity.user.name,
        model_name: activity.magma_model,
        record_name: activity.identifier,
        action: activity.action
      }
    end
  end

  def view
    view = ViewTab.retrieve_view(
      @params[:project_name],
      @params[:model_name]
    )
    success(view.to_json, 'application/json')
  end

  def update
    begin
      response = Magma::Client.instance.update(
        token,
        @params[:project_name],
        @params[:revisions]
      )
      return success(response.body, 'application/json')
    rescue Magma::ClientError => e
      failure(e.status, e.body)
    end
  end
end
