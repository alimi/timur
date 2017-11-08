module Archimedes
  class Function
    class << self
      def call(token, project_name, function_name, args)
        function = all_functions.find do |f|
          f.is_func?(function_name)
        end

        function.new(token,project_name,function_name,args).call
      end

      def all_functions
        @all_functions ||= ObjectSpace.each_object(::Class).select {|k| k < self }
      end

      def is_func? function_name
        self.name.split(/::/).last.snake_case == function_name.to_s
      end
    end

    def initialize token, project_name, function_name, args
      @token = token
      @project_name = project_name
      @function_name = function_name
      @args = args
    end
  end
end

require_relative 'functions/default'
require_relative 'functions/diff_exp'
require_relative 'functions/question'
require_relative 'functions/spread'
require_relative 'functions/table'
